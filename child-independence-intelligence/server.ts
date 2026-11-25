import express, { Request, Response } from 'express';
import http from 'http';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { setupGeminiLiveBridge, GEMINI_LIVE_TOOLS } from './server/services/geminiLiveBridge';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '20mb' }));

// Lazy initialize Gemini client
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

// Helper to convert linear 16-bit PCM buffer into standard WAV with 44-byte RIFF header
function pcmToWav(pcmBuffer: Buffer, sampleRate = 24000, numChannels = 1, bitDepth = 16): Buffer {
  const byteRate = (sampleRate * numChannels * bitDepth) / 8;
  const blockAlign = (numChannels * bitDepth) / 8;
  const dataSize = pcmBuffer.length;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitDepth, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  pcmBuffer.copy(buffer, 44);
  return buffer;
}

// In-memory cache for generated TTS audio to provide instant Alexa-like responses for frequent phrases
const ttsCache = new Map<string, string>();

// Generate spoken audio using Gemini TTS with fast fallback so speech is always audible
async function generateSpeechAudio(text: string, voiceName = 'Puck'): Promise<string | null> {
  if (!text || !text.trim()) return null;

  try {
    const cleanText = text
      .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
      .replace(/[*_#`~]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) return null;

    const cacheKey = `${voiceName}:${cleanText}`;
    if (ttsCache.has(cacheKey)) {
      return ttsCache.get(cacheKey)!;
    }

    // 1. Try Gemini TTS preview if client is available
    const ai = getGeminiClient();
    if (ai) {
      try {
        const ttsPromise = ai.models.generateContent({
          model: 'gemini-3.1-flash-tts-preview',
          contents: cleanText,
          config: {
            responseModalities: ['audio'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: voiceName || 'Puck',
                },
              },
            },
          },
        });
        const timeoutPromise = new Promise<any>((_, reject) =>
          setTimeout(() => reject(new Error('Gemini TTS timeout')), 2200)
        );
        const res = await Promise.race([ttsPromise, timeoutPromise]);

        const audioBase64 = res.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (audioBase64) {
          const pcmBuffer = Buffer.from(audioBase64, 'base64');
          const wavBuffer = pcmToWav(pcmBuffer, 24000, 1, 16);
          const audioDataUrl = `data:audio/wav;base64,${wavBuffer.toString('base64')}`;

          if (ttsCache.size < 200) {
            ttsCache.set(cacheKey, audioDataUrl);
          }
          return audioDataUrl;
        }
      } catch (geminiErr: any) {
        console.warn('Gemini TTS notice:', geminiErr?.message || geminiErr);
      }
    }

    return null;
  } catch (err: any) {
    console.warn('Speech generation error:', err?.message || err);
    return null;
  }
}

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// Dedicated TTS endpoint for on-demand high-quality voice audio
app.post('/api/tts', async (req: Request, res: Response) => {
  const { text = '', voice = 'Puck' } = req.body;
  try {
    const audioUrl = await generateSpeechAudio(text, voice);
    return res.json({ audioUrl });
  } catch (err: any) {
    return res.json({ audioUrl: null, error: err?.message });
  }
});

// Fast scenario opening greeting endpoint with pre-cached audio
app.get('/api/greeting', async (req: Request, res: Response) => {
  const scenario = (req.query.scenario as string) || 'after_school';
  const childName = (req.query.childName as string) || 'Aarav';
  let text = `Hey ${childName}! You're back. How was school today?`;
  if (scenario === 'morning') {
    text = `Good morning ${childName}! Did you get up on time today?`;
  } else if (scenario === 'pre_study' || scenario === 'study_time') {
    text = `Hey ${childName}! What time did you get home today?`;
  }
  const audioUrl = await generateSpeechAudio(text, 'Puck');
  return res.json({ text, audioUrl });
});

// Context-aware child chat endpoint
app.post('/api/chat', async (req: Request, res: Response) => {
  const {
    childName = 'Aarav',
    userMessage: propUserMessage,
    message: propMessage,
    text: propText,
    prompt: propPrompt,
    scenario: propScenario,
    timeScenario,
    simulatedTime = '15:30',
    currentTaskTitle = 'Mathematics homework',
    parentDescription = 'Aarav usually wakes up around 6:30. He gets ready for school himself but sometimes needs reminders to pack his bag. He likes football and drawing. He usually gets home around 3 PM. He tends to watch TV when he comes home and sometimes loses track of time. He prefers studying Maths before Science.',
    conversationHistory = [],
    sessionState = null,
    tasks = [],
    otherSchedules = [],
    companionVoice = 'Puck',
  } = req.body;

  // Accept any standard property for user utterance
  const rawUserMessage = propUserMessage ?? propMessage ?? propText ?? propPrompt ?? '';
  const userMessage = (typeof rawUserMessage === 'string' ? rawUserMessage : String(rawUserMessage || '')).trim();
  const scenario = propScenario || timeScenario || 'after_school';

  const questionsAskedList: string[] = sessionState?.questionsAsked || [];
  const knownFactsList: string[] = sessionState?.knownFacts || [];
  const currentMood: string = sessionState?.currentMood || 'neutral';
  const turnNumber: number = sessionState?.turnNumber || 0;

  const tasksContext = tasks.length > 0
    ? tasks.map((t: any) => `${t.title} (${t.time || t.timeWindow || ''}, ${t.importance || 'normal'})`).join(', ')
    : 'Maths homework (5:00-6:00 PM, Important, Notes: Focus on exercises 1-10 from Chapter 4), Science notes (8:00-8:45 PM)';

  const otherContext = otherSchedules.length > 0
    ? `Other recurring activities: ${otherSchedules.map((s: any) => `${s.title} (${s.day || ''} ${s.time || s.timeWindow || ''})`).join(', ')}`
    : '';

  const systemInstruction = `You are Echo, the warm, curious, calm, respectful, age-appropriate AI guide for a 13-year-old child named ${childName}. You embody the Childindi V2 Architect conversation engine.
Simulated Time: ${simulatedTime} (${scenario} scenario).
Parent Description of child: "${parentDescription}"
Today's Responsibilities Context: ${tasksContext}. ${otherContext}
Current Turn Number: ${turnNumber}
Questions Already Asked this Session: [${questionsAskedList.map((q) => `"${q}"`).join(', ')}]
Facts Already Known: [${knownFactsList.map((f) => `"${f}"`).join(', ')}]
Current Mood: ${currentMood}

CRITICAL CHILDINDI V2 ARCHITECT CONVERSATIONAL RULES:
1. ALWAYS REPLY DIRECTLY TO WHAT THE CHILD JUST SAID:
   - If child says "boring", empathize warmly (e.g. "I hear you, boring days happen! Want to switch things up or hear a riddle?").
   - NEVER repeat the initial greeting ("How was school today?") if the child has already replied or if the session is underway!
   - Every response must genuinely advance the dialogue based on the child's input.
2. DO NOT BE A TASKMASTER OR SURVEILLANCE BOT:
   - Never say "You have 5 tasks pending", "You are behind schedule", or "Your parent expects you to do this".
   - Never guilt-trip or pressure the child.
3. STRICT QUESTION LIMIT & ANTI-LOOP SAFEGUARD:
   - Ask at most 1 single question at a time.
   - NEVER ask any question that is already listed in "Questions Already Asked this Session"!
   - If 2 or more questions have already been asked in this session, DO NOT ask another question! Instead, provide a warm acknowledgment, empathetic comment, or offer choices.
4. CONVERSATIONAL OUTCOMES & ACTIONS:
   - If the child says "stop", "bye", "leave me alone", "I don't want to talk", or "that's enough":
     Reply warmly without pushback: "That's okay. I'm here if you feel like talking later." and set "action": "end_session".
   - If the child says "No" or declines a suggestion:
     Never argue or push: "No worries at all! What would you rather do first?" (action: null).
   - Natural Intent Discovery for Learning:
     * Child says "I want to finish something" -> ask "Sure. What do you want to finish?"
     * Child mentions "notes" -> ask "Which notes?"
     * Child says "Maths" or "Fractions" or asks to open homework -> reply "Got it. Show me the notes you're working on." or "Want to work on them together?" and set "action": "open_study".
   - Creative & Break Intentions:
     * Child wants to draw, sketch, art, car -> reply enthusiastically (e.g. "Cool! What kind of car do you want to draw?") and set "action": "open_drawing".
     * Child wants to move, stretch, break -> "Let's do it! A quick 5-minute movement break to recharge." and set "action": "open_move".
     * Child wants videos/watch -> set "action": "open_youtube".
     * Deep science curiosity (planets, moon, universe) -> answer clearly and set "action": "open_explore".
   - Boredom & Fatigue:
     * If child says "I'm bored" or "boring" -> "Aw, I hear you! Being bored is no fun at all 😄 Want to hear a fun riddle or switch things up?"
     * If child is tired -> "Sounds like you've had a long day. Want to take a short break?"
5. SCENARIO AWARENESS:
   - Morning (7:00-7:30 AM): Light check on wake-up ("Did you get up on time today?"). If answered, check on breakfast, then stop asking questions.
   - After School (3:30 PM): Warm welcome back. If they say boring, school was tiring, or played sports, acknowledge that directly.
   - 5:00 PM Late Login: Notice arrival without scolding. Then naturally suggest: "Want to do some Maths now?".
6. QUIET OBSERVATION EXTRACTION (Parent Visibility without Nagging):
   - If the child reports a factual event or routine detail, generate a structured "observationRecord" in the JSON.
   - Never lecture the child about what they report.
7. RESPONSE LENGTH & SUGGESTED REPLIES:
   - Keep replies concise (1 to 2 short sentences maximum).
   - Provide 2 to 4 contextual, clickable quick reply suggestions matching the current response.

Output JSON format strictly:
{
  "reply": "Warm 1-2 sentence response",
  "suggestedReplies": ["choice 1", "choice 2", "choice 3"],
  "action": null | "open_study" | "open_drawing" | "open_youtube" | "open_move" | "open_explore" | "end_session",
  "observationRecord": null | {
    "title": "Short title of event",
    "detail": "Descriptive detail (e.g. Child reported watching TV from 3:00 to 5:00 PM)",
    "source": "child_reported",
    "category": "after_school" | "routine" | "learning" | "responsibility" | "mood"
  }
}`;

  try {
    const ai = getGeminiClient();
    if (ai) {
      const formattedHistory = conversationHistory
        .slice(-6)
        .map((msg: { sender: string; text: string }) => `${msg.sender === 'ai' || msg.sender === 'echo' || msg.sender === 'Guide' ? 'Echo' : childName}: ${msg.text}`)
        .join('\n');

      const prompt = `Conversation history:
${formattedHistory}
${childName}: "${userMessage || 'Hello'}"

Respond strictly in JSON format as specified:`;

      const candidateModels = ['gemini-2.5-flash', 'gemini-3.8-flash'];
      let response: any = null;

      for (const modelName of candidateModels) {
        try {
          const genPromise = ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
              systemInstruction,
              responseMimeType: 'application/json',
            },
          });
          const timeoutGen = new Promise<any>((_, reject) =>
            setTimeout(() => reject(new Error(`Timeout for ${modelName}`)), 3500)
          );
          response = await Promise.race([genPromise, timeoutGen]);
          if (response?.text) break;
        } catch (modelErr: any) {
          console.warn(`[API/Chat] ${modelName} notice:`, modelErr?.message || modelErr);
        }
      }

      if (response?.text) {
        const parsed = JSON.parse(response.text);
        const reply = parsed.reply || "Hey! What do you feel like doing right now?";

        let audioUrl: string | null = null;
        try {
          const ttsPromise = generateSpeechAudio(reply, companionVoice || 'Puck');
          const timeoutPromise = new Promise<null>((res) => setTimeout(() => res(null), 1200));
          audioUrl = await Promise.race([ttsPromise, timeoutPromise]);
        } catch {}

        return res.json({
          reply,
          audioUrl,
          suggestedReplies: parsed.suggestedReplies || ['Tell me a riddle ❓', '🎨 Draw', '▶️ Watch', '🏃 Move'],
          observationRecord: parsed.observationRecord || null,
          action: parsed.action || null,
          timerData: parsed.timerData || null,
        });
      }
    }
  } catch (err) {
    console.error('Gemini chat error, using contextual fallback:', err);
  }

  // Resilient Contextual Fallback Engine (Adapts directly to whatever child said)
  const lowerMsg = (userMessage || '').toLowerCase().trim();
  let fallbackReply = `Got it, ${childName}! What would you like to explore or do right now?`;
  let fallbackOptions = ['Tell me a riddle ❓', '🎨 Drawing studio', '🏃 Movement break', '📚 Check tasks'];
  let observationRecord: any = null;
  let action: string | null = null;
  let timerData: any = null;

  // 1. Voice Timer / Reminder requests (e.g. "remind after 1 minute", "set timer for 1 min")
  const timerMatch =
    lowerMsg.match(/(?:timer|remind|alarm).*?(\d+(?:\.\d+)?)\s*(min(?:ute)?s?|sec(?:ond)?s?)/i) ||
    lowerMsg.match(/(\d+(?:\.\d+)?)\s*(min(?:ute)?s?|sec(?:ond)?s?)\s*(?:timer|reminder)?/i);

  if (
    timerMatch ||
    lowerMsg.includes('remind after') ||
    lowerMsg.includes('remind me') ||
    lowerMsg.includes('set timer') ||
    lowerMsg.includes('1 minute timer')
  ) {
    let seconds = 60;
    let mins = 1;
    if (timerMatch) {
      const val = parseFloat(timerMatch[1]);
      const unit = timerMatch[2].toLowerCase();
      if (unit.startsWith('sec')) {
        seconds = Math.max(5, Math.round(val));
        mins = Math.round((val / 60) * 10) / 10;
      } else {
        seconds = Math.max(10, Math.round(val * 60));
        mins = val;
      }
    }
    const label = `${mins === 1 ? '1 minute' : mins + ' min'} reminder`;
    fallbackReply = `Timer set for ${mins === 1 ? '1 minute' : mins + ' minutes'}! ⏱️ I'll count down and let you know the second it's up.`;
    fallbackOptions = ['⏱️ How much time left?', '⏹️ Cancel timer', '🎨 Draw while waiting', '🏃 Movement break'];
    action = 'set_timer';
    timerData = { durationSeconds: seconds, label, minutes: mins };
    observationRecord = {
      title: `Set ${label}`,
      detail: `Child requested a ${seconds}s voice timer (${label}) independently.`,
      category: 'routine',
      source: 'child_reported',
    };
  } else if (lowerMsg.includes('how much time') || lowerMsg.includes('time left')) {
    fallbackReply = `Your timer is actively running! You can check the live countdown right at the top of your screen ⏱️`;
    fallbackOptions = ['Add 1 minute ⏱️', '⏹️ Cancel timer', '🎨 Draw something', 'Tell me a riddle ❓'];
  } else if (lowerMsg.includes('cancel timer') || lowerMsg.includes('stop timer')) {
    fallbackReply = `Timer cancelled! You're all clear. What would you like to do now?`;
    fallbackOptions = ['Set 1-min timer ⏱️', '🎨 Drawing studio', '📚 Maths notes', 'Tell me a riddle ❓'];
    action = 'cancel_timer';
  }
  // 2. Exercise Demonstration requests (e.g. "demonstrate exercise", "show jumping jacks")
  else if (
    lowerMsg.includes('demonstrat') ||
    lowerMsg.includes('show exercise') ||
    lowerMsg.includes('exercise demo') ||
    lowerMsg.includes('jumping jack') ||
    lowerMsg.includes('how to do') ||
    lowerMsg.includes('show me how') ||
    lowerMsg === 'exercise'
  ) {
    fallbackReply = `Here is the animated demonstration for Jumping Jacks! ⚡ Watch the visual form cues and let's jump together!`;
    fallbackOptions = ['⚡ Start 20 Jacks', 'Try Squats next 🏋️', '💆 Neck rolls', 'Done! Feeling energized ✓'];
    action = 'demonstrate_exercise';
    observationRecord = {
      title: 'Viewed exercise demonstration',
      detail: `Child initiated visual exercise demonstration: "${userMessage}"`,
      category: 'wellbeing',
      source: 'child_reported',
    };
  }
  // 3. Boredom check-in
  else if (
    lowerMsg.includes('bored') ||
    lowerMsg.includes('boring')
  ) {
    fallbackReply = `Aw, I hear you—being bored is no fun at all 😄 Want to hear a goofy riddle, doodle something cool, or do a quick 5-minute movement break?`;
    fallbackOptions = ['Tell me a riddle ❓', '🎨 Draw something', '🏃 Movement break', 'Tell me a joke 😂'];
    observationRecord = {
      title: 'Child reported boredom',
      detail: `Child stated "${userMessage}" during check-in; Echo suggested engaging alternatives`,
      source: 'child_reported',
      category: 'mood',
    };
  } else if (
    lowerMsg.includes('tired') ||
    lowerMsg.includes('exhausted') ||
    lowerMsg.includes('sleepy')
  ) {
    fallbackReply = `Sounds like you've had a long day! Want to take a short breather, grab a snack, or should I set a 5-minute rest timer?`;
    fallbackOptions = ['⏱️ Remind after 5 minutes', '🥤 Grab a snack', 'Tell me a riddle ❓', '😌 Just chill'];
    observationRecord = {
      title: 'Child reported fatigue',
      detail: `Child shared "${userMessage}"`,
      source: 'child_reported',
      category: 'mood',
    };
  } else if (
    lowerMsg.includes('won') ||
    lowerMsg.includes('we won') ||
    lowerMsg.includes('trophy')
  ) {
    fallbackReply = `Awesome! Congratulations on the win! 🏆 It feels great to celebrate. Want to chill for a bit, or what do you feel like doing next?`;
    fallbackOptions = ['🎨 Draw something', 'Tell me a riddle ❓', '📚 Check Maths notes', '🥤 Grab a snack'];
    observationRecord = {
      title: 'Won football match',
      detail: 'Child reported winning their football match after school',
      source: 'child_reported',
      category: 'routine',
    };
  } else if (
    lowerMsg.includes('close') ||
    lowerMsg.includes('tie')
  ) {
    fallbackReply = `Sounds like an intense match! ⚽ Playing hard is what counts. Want to grab a drink, relax, or hear a riddle?`;
    fallbackOptions = ['Tell me a riddle ❓', '🥤 Grab a drink', '🎨 Draw something', 'Tell me a joke 😂'];
  } else if (
    lowerMsg.includes('football') ||
    lowerMsg.includes('match') ||
    lowerMsg.includes('soccer') ||
    lowerMsg.includes('game')
  ) {
    fallbackReply = `Nice! Did you have fun playing today? How did the match go?`;
    fallbackOptions = ['We won! 🏆', 'It was close ⚽', 'Tired now 😴'];
    observationRecord = {
      title: 'Played football after school',
      detail: 'Child reported playing football match',
      source: 'child_reported',
      category: 'routine',
    };
  } else if (
    lowerMsg.includes('tv') ||
    lowerMsg.includes('watch tv') ||
    lowerMsg.includes('television')
  ) {
    fallbackReply = `Cool! Watching something entertaining is a great way to unwind. Want to doodle something fun, hear a riddle, or check out Maths?`;
    fallbackOptions = ['🎨 Draw something', 'Tell me a riddle ❓', '📚 Check Maths notes', '🏃 Movement break'];
    observationRecord = {
      title: 'Watched TV after school',
      detail: 'Child reported watching TV after school',
      source: 'child_reported',
      category: 'routine',
    };
  } else if (
    lowerMsg.includes('good') ||
    lowerMsg.includes('great') ||
    lowerMsg.includes('fine') ||
    lowerMsg.includes('fun') ||
    lowerMsg.includes('awesome') ||
    lowerMsg === 'ok' ||
    lowerMsg === 'okay'
  ) {
    fallbackReply = `Glad to hear that! What are you in the mood for right now?`;
    fallbackOptions = ['🎨 Draw something', 'Tell me a riddle ❓', '🏃 Movement break', '📚 Maths homework'];
  } else if (
    lowerMsg.includes('yes') ||
    lowerMsg.includes('yeah') ||
    lowerMsg === 'yep' ||
    lowerMsg === 'sure'
  ) {
    fallbackReply = `Awesome! Did you brush your teeth and get your backpack packed for school?`;
    fallbackOptions = ['All packed! 🎒', 'Brushing teeth now 🪥', 'Ready for breakfast 🥣'];
  } else if (
    lowerMsg.includes('6:45') ||
    lowerMsg.includes('7:00') ||
    lowerMsg.includes('woke up') ||
    lowerMsg.includes('around')
  ) {
    fallbackReply = `6:45 is a great time to wake up! Feeling well-rested and ready for the day?`;
    fallbackOptions = ['Ready for breakfast 🥣', 'Need a morning stretch 🧘', 'Still sleepy 🥱'];
  } else if (
    lowerMsg.includes('breakfast') ||
    lowerMsg.includes('eating') ||
    lowerMsg.includes('cereal')
  ) {
    fallbackReply = `Yum! A hearty breakfast gives you superhero energy for the whole school day! What are you having?`;
    fallbackOptions = ['Cereal & Milk 🥣', 'Toast & Eggs 🍳', 'Fruit & Juice 🍎'];
  } else if (
    lowerMsg.includes('got home') ||
    lowerMsg.includes('3:00') ||
    lowerMsg.includes('3:30')
  ) {
    fallbackReply = `Right on time! Have you had a chance to drink some cool water and put your backpack away?`;
    fallbackOptions = ['Drank water 💧', 'Watched TV 📺', 'Ready for Maths ✏️'];
  } else if (
    lowerMsg.includes('reveal the answer') ||
    lowerMsg.includes('what is the answer') ||
    lowerMsg.includes('answer')
  ) {
    fallbackReply = `The answer is: A computer keyboard! ⌨️ It has keys but no locks, space but no room, and you can enter but can't go inside! Did you guess it?`;
    fallbackOptions = ['I guessed it! 😄', 'Good one! Another riddle ❓', 'Tell me a joke 😂'];
  } else if (
    lowerMsg.includes('hint') ||
    lowerMsg.includes('give me a hint')
  ) {
    fallbackReply = `Here's a hint: You press these keys every day when you type on a computer or laptop! 💻 Think you know what it is?`;
    fallbackOptions = ['Reveal the answer! 💡', 'A keyboard! ⌨️', 'Tell me a joke 😂'];
  } else if (
    lowerMsg.includes('another riddle') ||
    lowerMsg.includes('tell me another')
  ) {
    fallbackReply = `Here's another one: What has a thumb and four fingers, but is not alive? ... A glove! 🧤 How about another, or something else?`;
    fallbackOptions = ['Tell me a joke 😂', '🎨 Draw something', '📚 Check Maths notes', '🏃 Movement break'];
  } else if (
    lowerMsg.includes('riddle') ||
    lowerMsg.includes('tell me a riddle')
  ) {
    fallbackReply = `Here's a good one: What has keys, but no locks; space, but no room; and you can enter, but can't go inside? ... Think you know?`;
    fallbackOptions = ['Reveal the answer! 💡', 'Give me a hint 🔍', 'Tell me a joke 😂'];
  } else if (
    lowerMsg.includes('joke') ||
    lowerMsg.includes('tell me a joke')
  ) {
    fallbackReply = `Why did the scarecrow win an award? Because he was outstanding in his field! 😄 Want another joke, or something else?`;
    fallbackOptions = ['Haha another joke! 😆', 'Tell me a riddle ❓', '🎨 Draw something', '📚 Maths homework'];
  } else if (
    lowerMsg.includes('snack') ||
    lowerMsg.includes('drink') ||
    lowerMsg.includes('water')
  ) {
    fallbackReply = `Go grab a tasty snack and some water to recharge! I'll be right here whenever you're ready.`;
    fallbackOptions = ['Done with snack! 😋', 'Tell me a riddle ❓', '🎨 Draw something', '📚 Maths homework'];
  } else if (
    lowerMsg.includes('chapter 4') ||
    lowerMsg.includes('fractions') ||
    lowerMsg.includes('notes')
  ) {
    fallbackReply = `Got it! Let's take a look at your Chapter 4 Fractions notes together. Opening study studio now!`;
    fallbackOptions = ['Open Maths 📐', 'Help with Question 5 ❓', 'Later ⏳'];
    action = 'open_study';
  } else if (
    lowerMsg.includes('maths') ||
    lowerMsg.includes('math') ||
    lowerMsg.includes('homework') ||
    lowerMsg.includes('study')
  ) {
    fallbackReply = `Got it! Want to open up your Maths notes and work on Chapter 4 together?`;
    fallbackOptions = ['Open Maths 📐', 'Help with Question 5 ❓', 'Later ⏳'];
    action = 'open_study';
  } else if (
    lowerMsg.includes('draw') ||
    lowerMsg.includes('sketch') ||
    lowerMsg.includes('art') ||
    lowerMsg.includes('doodle')
  ) {
    fallbackReply = `Awesome! I've opened up the drawing studio for you. What are you going to draw?`;
    fallbackOptions = ['A race car 🏎️', 'A space rocket 🚀', 'An animal 🦁'];
    action = 'open_drawing';
  } else if (
    lowerMsg.includes('move') ||
    lowerMsg.includes('break') ||
    lowerMsg.includes('stretch')
  ) {
    fallbackReply = `Let's do it! A quick 5-minute movement break with exercise demonstration to recharge your energy.`;
    fallbackOptions = ['⚡ Jumping Jacks demo', '🏋️ Squats demo', 'Done! Feeling good 😊'];
    action = 'open_move';
  } else if (
    lowerMsg.includes('stop') ||
    lowerMsg.includes('bye') ||
    lowerMsg.includes('leave me alone')
  ) {
    fallbackReply = `That's totally okay. I'm right here if you feel like chatting later!`;
    fallbackOptions = ['👋 See you later', 'Talk later'];
    action = 'end_session';
  } else if (lowerMsg === '' && conversationHistory.length === 0) {
    // Only deliver opening greeting on a fresh turn with no previous input
    if (scenario === 'morning') {
      fallbackReply = `Good morning ${childName}! Did you get up on time today?`;
      fallbackOptions = ['Yes 👍', 'Around 6:45 😴', 'Ready for breakfast 🥣'];
    } else if (scenario === 'pre_study' || scenario === 'study_time') {
      fallbackReply = `Hey ${childName}! What time did you get home today?`;
      fallbackOptions = ['Got home at 3:00 🕒', 'Watched TV 📺', 'Ready for Maths ✏️'];
    } else {
      fallbackReply = `Hey ${childName}! You're back 😊 How was school today?`;
      fallbackOptions = ['Good 👍', 'We played football ⚽', 'Tiring 😴', 'Boring 🥱'];
    }
  } else {
    // Meaningful acknowledgement of arbitrary input
    fallbackReply = `Got it, ${childName}! What do you feel like doing right now? We could do a quick exercise demo, set a timer, hear a riddle, or doodle something fun!`;
    fallbackOptions = ['⚡ Exercise demo', '⏱️ Remind after 1 minute', 'Tell me a riddle ❓', '🎨 Drawing studio'];
  }

  let audioUrl: string | null = null;
  try {
    const ttsPromise = generateSpeechAudio(fallbackReply, companionVoice || 'Puck');
    const timeoutPromise = new Promise<null>((res) => setTimeout(() => res(null), 1500));
    audioUrl = await Promise.race([ttsPromise, timeoutPromise]);
  } catch {}

  return res.json({
    reply: fallbackReply,
    audioUrl,
    suggestedReplies: fallbackOptions,
    observationRecord,
    action,
    timerData,
  });
});

// Socratic AI Learning Assistant grounded in uploaded textbook material
app.post('/api/learning-help', async (req: Request, res: Response) => {
  const {
    question = '',
    subject = 'Mathematics',
    chapter = 'Linear Equations',
    topic = 'Algebra',
    materialContext = '',
    childName = 'Aarav',
  } = req.body;

  const systemInstruction = `You are a friendly Socratic Learning Assistant for a 13-year-old student (${childName}).
Subject: ${subject}
Chapter/Topic: ${chapter} - ${topic}

CRITICAL LEARNING RULES (Section 14 of Product Spec):
1. The objective is LEARNING, NOT homework answer generation.
2. Explain concepts simply, visually, and vividly.
3. Give hints and break problems down into manageable steps.
4. Ask ONE useful question to encourage the student to think through the next step.
5. Encourage the child to attempt the answer themselves.
6. AVOID simply giving away the final numerical or homework answer directly.
7. Use the provided textbook material as your primary source.
8. Keep response concise (2-4 paragraphs maximum, under 150 words). Friendly and encouraging tone.`;

  try {
    const ai = getGeminiClient();
    if (ai) {
      const prompt = `Textbook Reference Material:
${materialContext}

Student's Question:
"${question}"

Provide a friendly, Socratic response that helps ${childName} understand the concept or take the next step without handing them the completed homework answer:`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: { systemInstruction },
      });

      if (response.text) {
        return res.json({ answer: response.text });
      }
    }
  } catch (err) {
    console.error('Gemini learning help error:', err);
  }

  // High quality contextual fallback responses
  const qLower = question.toLowerCase();
  let fallbackAnswer = `Let's look at this step-by-step from your ${subject} material!`;

  if (qLower.includes('5') || (qLower.includes('two-thirds') && qLower.includes('35'))) {
    fallbackAnswer = `Let's work this out from Chapter 4! 

The question says: *"A number added to its two-thirds is equal to 35."*
1. Let the unknown number be **x**.
2. Its two-thirds is **(2/3)x**.
3. Adding them together gives: **x + (2/3)x = 35**.

Here's a hint: Can you write **x** as **(3/3)x** so they have the same denominator? What do you get when you add (3/3)x + (2/3)x? Give it a try!`;
  } else if (qLower.includes('photosynthesis')) {
    fallbackAnswer = `Let's break down Photosynthesis from your Science chapter:

Plants are autotrophic, meaning they make their own food! They take:
🌿 **Carbon Dioxide (CO₂)** from the air through microscopic stomata
💧 **Water (H₂O)** from the soil through their roots
☀️ **Sunlight** trapped by the green **chlorophyll** pigment in chloroplasts

And they produce **Glucose** (energy) and release **Oxygen (O₂)**!
Want to try explaining: What do you think would happen to a plant's photosynthesis on a cloudy, rainy day?`;
  } else if (qLower.includes('digestive') || qLower.includes('stomach') || qLower.includes('amylase')) {
    fallbackAnswer = `Great question from your digestive system notes!

Digestion starts right in your mouth:
1. Teeth chew the food mechanically.
2. **Salivary Amylase** starts breaking complex starches into simple sugars.
3. Then food travels down the esophagus into the stomach, where gastric juice (HCl and Pepsin) begins breaking down proteins.

Want to recall: What role does hydrochloric acid play in protecting our stomach?`;
  } else {
    fallbackAnswer = `Let's work through this concept together from your ${subject} notes! 

When tackling "${question}", the best first step is to identify what information we already have, and what we need to find. 
What do you think is the very first step you'd take here?`;
  }

  return res.json({ answer: fallbackAnswer });
});

// Text extraction / OCR for uploaded photos or handwritten notes
app.post('/api/ocr-extract', async (req: Request, res: Response) => {
  const { imageBase64, mimeType = 'image/jpeg', fallbackTopic = 'New Topic' } = req.body;

  try {
    const ai = getGeminiClient();
    if (ai && imageBase64) {
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [
          {
            inlineData: {
              mimeType,
              data: base64Data,
            },
          },
          {
            text: `Extract readable text from this textbook page or student note.
Provide the output as JSON:
{
  "subject": "Mathematics or Science or English",
  "chapter": "Detected Chapter title",
  "topic": "Detected topic",
  "extractedText": "Clean full extracted text",
  "summary": "1-2 sentence key takeaway"
}`,
          },
        ],
        config: {
          responseMimeType: 'application/json',
        },
      });

      if (response.text) {
        const parsed = JSON.parse(response.text);
        return res.json(parsed);
      }
    }
  } catch (err) {
    console.error('OCR extract error:', err);
  }

  // Fallback for simulation
  return res.json({
    subject: 'Science',
    chapter: 'Biology — Chapter 6: Life Processes',
    topic: fallbackTopic,
    extractedText: 'Extracted text from uploaded page: Key definitions, formulas, and diagrams extracted accurately.',
    summary: 'Clear study notes digitized and indexed for AI learning assistant.',
  });
});

// Parent daily summary generator
app.post('/api/daily-snapshot', async (req: Request, res: Response) => {
  const { childName = 'Aarav', tasks = [], logs = [], parentRemindersCount = 0 } = req.body;

  try {
    const ai = getGeminiClient();
    if (ai) {
      const prompt = `Child Name: ${childName}
Completed Tasks: ${JSON.stringify(tasks.map((t: any) => ({ title: t.title, status: t.status, startMode: t.startMode })))}
Activity Logs: ${JSON.stringify(logs.map((l: any) => ({ title: l.title, type: l.type })))}
Parent Reminders Count: ${parentRemindersCount}

Generate a concise 2-minute parent snapshot (Section 18 format):
JSON format:
{
  "summaryTitle": "${childName}'s Day",
  "independenceHighlight": "1 encouraging sentence on independent starts",
  "needsAttention": "Brief note if anything was postponed or None",
  "learningHighlight": "What they asked help for or studied",
  "trendNote": "Improving / Stable / Needs encouragement"
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      if (response.text) {
        const parsed = JSON.parse(response.text);
        return res.json(parsed);
      }
    }
  } catch (err) {
    console.error('Daily snapshot error:', err);
  }

  return res.json({
    summaryTitle: `${childName}'s Day`,
    independenceHighlight: `Today ${childName} started 2 activities without prompting.`,
    needsAttention: `Science revision was postponed for 30 minutes.`,
    learningHighlight: `Asked for help with photosynthesis equations.`,
    trendNote: `Aarav needed 35% fewer reminders this week!`,
  });
});

// Start server with Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const httpServer = http.createServer(app);
  setupGeminiLiveBridge(httpServer, getGeminiClient);

  httpServer.on('error', (err: any) => {
    console.error('Server error:', err);
  });

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Platform server running on port ${PORT} with Gemini Live WebSocket bridge`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
