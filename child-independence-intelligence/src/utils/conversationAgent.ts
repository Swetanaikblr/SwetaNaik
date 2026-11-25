import {
  ConversationSessionState,
  ChildProfile,
  TimeScenario,
  ChatMessage,
  DailyObservation,
  OtherScheduleItem,
  TaskItem,
} from '../types';

// Decision engine action categories
export type ConversationalAction =
  | 'ACKNOWLEDGE'
  | 'FOLLOW_TOPIC'
  | 'ASK'
  | 'CLARIFY'
  | 'ENCOURAGE'
  | 'OFFER_CHOICE'
  | 'SUGGEST_ACTIVITY'
  | 'START_LEARNING'
  | 'SUGGEST_BREAK'
  | 'TRANSITION'
  | 'WAIT'
  | 'END';

export interface AgentTurnResult {
  reply: string;
  suggestedReplies: string[];
  action?: 'open_study' | 'open_drawing' | 'open_youtube' | 'open_move' | 'open_explore' | 'end_session' | null;
  observationRecord?: {
    title: string;
    detail: string;
    source: 'child_reported' | 'platform_observed';
    category: 'routine' | 'after_school' | 'learning' | 'responsibility' | 'mood';
  } | null;
  audioUrl?: string | null;
  updatedState: ConversationSessionState;
}

export function formatScenarioContext(scenario: TimeScenario): string {
  switch (scenario) {
    case 'morning':
      return '7:30 AM — Morning Prep';
    case 'after_school':
      return '3:30 PM — After School';
    case 'pre_study':
      return '4:50 PM — Pre-Study Buffer';
    case 'study_time':
      return '5:05 PM — Maths Homework Window';
    case 'free_time':
      return '6:15 PM — Free Play & Creative Time';
    case 'evening':
      return '8:00 PM — Evening Study';
    case 'bedtime':
      return '9:30 PM — Bedtime Routine';
    default:
      return '3:30 PM — After School';
  }
}

// 1. Create a persistent conversation session object
export function createInitialSessionState(
  childName: string,
  scenario: TimeScenario
): ConversationSessionState {
  return {
    sessionId: `sess-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    sessionActive: true,
    sessionStartedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    turnNumber: 0,
    currentTimeContext: formatScenarioContext(scenario),
    scenario,
    currentTopic: null,
    currentSubTopic: null,
    currentIntent: null,
    currentActivity: null,
    currentSubject: null,
    currentMood: null,
    lastChildUtterance: null,
    lastAIResponse: null,
    lastAIQuestion: null,
    knownFacts: [],
    discussedTopics: [],
    questionsAsked: [],
    questionsAnswered: [],
    unresolvedTopics: [],
    recentAIResponses: [],
    childPreferences: [],
    sessionOutcome: null,
    openingDelivered: false,
  };
}

// 2. Generate time-aware opening greeting (runs ONLY on turn 0, never loops)
export function getInitialGreeting(
  state: ConversationSessionState,
  childProfile: ChildProfile,
  scenario: TimeScenario
): { text: string; suggestedReplies: string[]; updatedState: ConversationSessionState } {
  let text = `Hey ${childProfile.name}! I'm Echo. What's on your mind?`;
  let suggestedReplies = ["I want to finish something 📝", "How was your day? 😊", "Tell me a riddle ❓", "I'm bored 🥱"];
  let openingQuestion = "What's on your mind?";
  let initialTopic = "general_checkin";

  if (scenario === 'morning') {
    text = `Good morning ${childProfile.name}! Did you get up on time today?`;
    suggestedReplies = ["Yes, woke up on time ⏰", "Around 6:45 😴", "Ready for breakfast 🥣"];
    openingQuestion = "Did you get up on time today?";
    initialTopic = "morning_wakeup";
  } else if (scenario === 'after_school') {
    text = `Hey ${childProfile.name}! You're back 😊 How was school?`;
    suggestedReplies = ["Good 👍", "We played football ⚽", "Lots of homework 📚", "Tiring 😴"];
    openingQuestion = "How was school?";
    initialTopic = "school";
  } else if (scenario === 'pre_study' || scenario === 'study_time') {
    text = `Hey ${childProfile.name}! What time did you get home today?`;
    suggestedReplies = ["Got home at 3:00 🕒", "Watched some TV 📺", "Ready for Maths ✏️"];
    openingQuestion = "What time did you get home today?";
    initialTopic = "after_school_arrival";
  }

  const updatedState: ConversationSessionState = {
    ...state,
    turnNumber: 1,
    openingDelivered: true,
    currentTopic: initialTopic,
    lastAIResponse: text,
    lastAIQuestion: openingQuestion,
    questionsAsked: [openingQuestion],
    recentAIResponses: [text],
    discussedTopics: [initialTopic],
  };

  return { text, suggestedReplies, updatedState };
}

// 3. Central Context-Aware Decision Engine
export async function processConversationTurn(
  currentState: ConversationSessionState,
  utterance: string,
  childProfile: ChildProfile,
  tasks: TaskItem[],
  otherSchedules?: OtherScheduleItem[],
  conversationHistory: ChatMessage[] = []
): Promise<AgentTurnResult> {
  const childName = childProfile.name;
  const rawText = utterance.trim();
  const lower = rawText.toLowerCase();

  // Create working clone of state
  const state: ConversationSessionState = {
    ...currentState,
    turnNumber: currentState.turnNumber + 1,
    lastChildUtterance: rawText,
  };

  // STEP 1-7: Intent, Topic, Mood, and Context Analysis
  let nextAction: ConversationalAction = 'ACKNOWLEDGE';
  let replyText = '';
  let suggestedReplies: string[] = ['Tell me a riddle ❓', 'What should I do? 🤔', 'Draw something 🎨'];
  let actionTrigger: AgentTurnResult['action'] = null;
  let observationRecord: AgentTurnResult['observationRecord'] = null;
  let askedQuestion: string | null = null;

  // Check 1: Child says "Stop", "Bye", "That's enough", "I don't want to talk"
  if (
    lower === 'stop' ||
    lower.includes('stop talking') ||
    lower.includes("don't want to talk") ||
    lower.includes('dont want to talk') ||
    lower.includes("that's enough") ||
    lower.includes('thats enough') ||
    lower === 'bye' ||
    lower.includes('leave me alone')
  ) {
    replyText = "That's okay. I'm here if you feel like talking later.";
    suggestedReplies = ['👋 See you later', 'Talk later'];
    state.sessionOutcome = 'STOPPED_BY_CHILD';
    state.sessionActive = false;
    state.currentTopic = 'session_end';
    actionTrigger = 'end_session';

    return {
      reply: replyText,
      suggestedReplies,
      action: actionTrigger,
      updatedState: {
        ...state,
        lastAIResponse: replyText,
        lastAIQuestion: null,
      },
    };
  }

  // PRIMARY PATH: Server-Side Gemini 3.8 Flash AI Engine (Childindi V2 Architect)
  try {
    const chatPromise = fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        childName,
        userMessage: rawText,
        scenario: state.scenario,
        simulatedTime: state.currentTimeContext,
        parentDescription: childProfile.normalDayDescription,
        conversationHistory: conversationHistory.slice(-6).map((m) => ({
          sender: m.sender,
          text: m.text,
        })),
        sessionState: {
          turnNumber: state.turnNumber,
          questionsAsked: state.questionsAsked,
          knownFacts: state.knownFacts,
          discussedTopics: state.discussedTopics,
          currentTopic: state.currentTopic,
          currentMood: state.currentMood,
        },
        tasks: tasks.map((t) => ({
          title: t.title,
          time: `${t.startTime || ''} - ${t.endTime || ''}`,
          category: t.category,
        })),
        otherSchedules: otherSchedules?.map((s) => ({
          title: s.title,
          days: s.days?.join(', ') || '',
          time: `${s.startTime || ''} - ${s.endTime || ''}`,
          category: s.category,
        })),
      }),
    });

    const timeoutPromise = new Promise<Response>((_, reject) =>
      setTimeout(() => reject(new Error('Server /api/chat timeout')), 3800)
    );

    const res = await Promise.race([chatPromise, timeoutPromise]);
    if (res.ok) {
      const data = await res.json();
      if (data && data.reply) {
        let serverReply = data.reply.trim();
        let serverAction = data.action || null;
        let serverObs = data.observationRecord || null;
        let serverSuggestions =
          data.suggestedReplies && data.suggestedReplies.length > 0
            ? data.suggestedReplies
            : ['📚 Learn', '🎨 Draw', '▶️ Watch', '🏃 Move'];

        // Question tracking and anti-loop enforcement
        const questionMatch = serverReply.match(/([^.?!]*\?)/);
        let extractedQuestion = questionMatch ? questionMatch[1].trim() : null;

        if (extractedQuestion && state.questionsAsked.includes(extractedQuestion)) {
          // Suppress duplicate question
          serverReply = serverReply.replace(extractedQuestion, '').trim() || 'Awesome 😊';
          extractedQuestion = null;
        }

        const updatedQuestions = extractedQuestion
          ? Array.from(new Set([...state.questionsAsked, extractedQuestion]))
          : state.questionsAsked;

        const updatedFacts = serverObs
          ? Array.from(new Set([...state.knownFacts, serverObs.title]))
          : state.knownFacts;

        const updatedState: ConversationSessionState = {
          ...state,
          lastAIResponse: serverReply,
          lastAIQuestion: extractedQuestion,
          questionsAsked: updatedQuestions,
          knownFacts: updatedFacts,
          recentAIResponses: [...state.recentAIResponses.slice(-4), serverReply],
          sessionActive: serverAction !== 'end_session',
          sessionOutcome: serverAction === 'end_session' ? 'STOPPED_BY_CHILD' : state.sessionOutcome,
        };

        return {
          reply: serverReply,
          suggestedReplies: serverSuggestions,
          action: serverAction,
          observationRecord: serverObs,
          audioUrl: data.audioUrl || null,
          updatedState,
        };
      }
    }
  } catch (apiErr) {
    // Network or API unavailable; seamlessly fall back to local V2 rule engine
  }

  // FALLBACK PATH: Deterministic Local V2 Rule Engine (Offline Resilience)
  // Check 2: Mood - Tired or Exhausted
  if (
    lower.includes('tired') ||
    lower.includes('exhausted') ||
    lower.includes('sleepy') ||
    lower.includes('long day')
  ) {
    state.currentMood = 'tired';
    state.knownFacts = Array.from(new Set([...state.knownFacts, 'Child feels tired']));
    replyText = "Sounds like you've had a long day. Want to take a short break?";
    askedQuestion = "Want to take a short break?";
    suggestedReplies = ['Yes, short break ⏸️', 'Grab a snack 🥤', 'No, keep going 🚀'];
    nextAction = 'SUGGEST_BREAK';
  }
  // Check 3: Break confirmation ("Yes" after break suggestion)
  else if (
    (lower === 'yes' || lower === 'yeah' || lower === 'sure' || lower.includes('short break')) &&
    state.lastAIQuestion?.includes('break')
  ) {
    replyText = "Okay. Take a little breather. Tell me when you're ready.";
    suggestedReplies = ["I'm ready now! 🚀", "Tell me a fun fact 💡", "Open drawing 🎨"];
    askedQuestion = null; // Deliberate pause! No immediate interrogation
    nextAction = 'WAIT';
  }
  // Check 4: Mood - Bored
  else if (lower.includes('bored') || lower.includes('boring')) {
    state.currentMood = 'bored';
    state.knownFacts = Array.from(new Set([...state.knownFacts, 'Child feels bored']));
    replyText = "Fair enough 😄 Want to switch things up or take a break?";
    askedQuestion = "Want to switch things up or take a break?";
    suggestedReplies = ['🎨 Draw', '▶️ Watch something', '🏃 Move', '⏸️ Take a break'];
    nextAction = 'OFFER_CHOICE';
    observationRecord = {
      title: 'Child reported feeling bored',
      detail: 'Expressed boredom during interaction; offered creative or active alternatives',
      source: 'child_reported',
      category: 'mood',
    };
  }
  // Check 5: Intent - Maths / Study
  else if (
    lower.includes('math') ||
    lower.includes('maths') ||
    lower.includes('homework') ||
    lower.includes('study') ||
    (lower.includes('finish something') && !lower.includes('notes'))
  ) {
    state.currentIntent = 'study';
    state.currentSubject = 'Maths';
    state.currentTopic = 'maths';
    state.discussedTopics = Array.from(new Set([...state.discussedTopics, 'maths']));

    if (state.lastAIResponse?.includes('What are you working on') || lower.includes('notes') || lower.includes('fractions')) {
      replyText = "Okay. Show me the notes you're working on.";
      suggestedReplies = ['Open Chapter 4 📖', 'Fractions practice ✏️', 'Help on question 5 ❓'];
      actionTrigger = 'open_study';
      askedQuestion = null;
    } else {
      replyText = "Sure. Maths it is. What are you working on?";
      askedQuestion = "What are you working on?";
      suggestedReplies = ['My notes 📝', 'Chapter 4 Fractions 📐', 'Page 42 homework 📚'];
    }
    nextAction = 'START_LEARNING';
  }
  // Check 6: Intent - Notes or Fractions specifically
  else if (lower.includes('my notes') || lower.includes('notes') || lower.includes('fractions')) {
    state.currentIntent = 'study';
    state.currentSubTopic = lower.includes('fraction') ? 'fractions' : 'notes';
    state.knownFacts = Array.from(new Set([...state.knownFacts, 'Working on Maths notes/fractions']));
    replyText = "Okay. Show me the notes you're working on.";
    askedQuestion = null;
    actionTrigger = 'open_study';
    suggestedReplies = ['Open Chapter 4 📖', 'Read with me 🎙️', 'I will work on it ✏️'];
    nextAction = 'START_LEARNING';
  }
  // Check 7: Drawing / Creativity
  else if (
    lower.includes('draw') ||
    lower.includes('drawing') ||
    lower.includes('sketch') ||
    lower.includes('car') ||
    lower.includes('art')
  ) {
    state.currentIntent = 'draw';
    state.currentActivity = 'drawing';
    state.currentTopic = 'drawing';
    state.discussedTopics = Array.from(new Set([...state.discussedTopics, 'drawing']));

    if (lower.includes('car') || lower.includes('racecar')) {
      replyText = "Cool! What kind of car? A sports car or something futuristic?";
      askedQuestion = "What kind of car?";
      suggestedReplies = ['Futuristic hover car 🚀', 'Classic race car 🏎️', 'Electric SUV ⚡'];
    } else {
      replyText = "Sure! What do you want to draw?";
      askedQuestion = "What do you want to draw?";
      suggestedReplies = ['A cool car 🚗', 'A robot companion 🤖', 'Space galaxy 🌌'];
    }
    actionTrigger = 'open_drawing';
    nextAction = 'FOLLOW_TOPIC';
  }
  // Check 8: Movement / Brain Break
  else if (lower.includes('move') || lower.includes('stretch') || lower.includes('break') || lower.includes('brain break')) {
    state.currentIntent = 'move';
    state.currentActivity = 'movement_break';
    replyText = "Let's do it! A quick 5-minute movement break to recharge.";
    askedQuestion = null;
    actionTrigger = 'open_move';
    suggestedReplies = ['Stretches 🧘', 'Jumping jacks ⚡', 'Dancing 💃'];
    nextAction = 'SUGGEST_ACTIVITY';
  }
  // Check 9: Videos / YouTube
  else if (lower.includes('watch') || lower.includes('video') || lower.includes('youtube')) {
    state.currentIntent = 'watch';
    state.currentActivity = 'video';
    replyText = "Sure! Let's check out an approved learning video.";
    actionTrigger = 'open_youtube';
    suggestedReplies = ['Life Processes 🧬', 'Volcanoes 🌋', 'Fractions video 📐'];
    nextAction = 'SUGGEST_ACTIVITY';
  }
  // Check 10: Specific Sports / Football (from test scenarios!)
  else if (lower.includes('football') || lower.includes('soccer') || lower.includes('match')) {
    state.currentTopic = 'football';
    state.knownFacts = Array.from(new Set([...state.knownFacts, 'Played football today']));
    state.discussedTopics = Array.from(new Set([...state.discussedTopics, 'football']));

    // Check if we already asked if they won
    if (state.questionsAsked.some((q) => q.toLowerCase().includes('win') || q.toLowerCase().includes('match'))) {
      replyText = "Awesome! It's great getting outside on the field.";
      askedQuestion = null;
      suggestedReplies = ['I want Maths 📐', 'Draw a soccer ball ⚽', 'I\'m tired 😴'];
    } else {
      replyText = "Oh nice! Did you win?";
      askedQuestion = "Did you win?";
      suggestedReplies = ['Yes! 🏆', 'It was a tie 🤝', 'No, but had fun ⚽'];
    }
    nextAction = 'FOLLOW_TOPIC';
  }
  // Check 11: Child says "Yes" after winning football
  else if (
    (lower === 'yes' || lower === 'yeah' || lower === 'we won' || lower.includes('won')) &&
    state.lastAIQuestion?.toLowerCase().includes('win')
  ) {
    state.knownFacts = Array.from(new Set([...state.knownFacts, 'Won the football match']));
    replyText = "Awesome 😄";
    askedQuestion = null; // No interrogation! Warm acknowledgment
    suggestedReplies = ['I want Maths 📐', 'I want to draw 🎨', 'I\'m tired 😴', 'Tell me a riddle ❓'];
    nextAction = 'ACKNOWLEDGE';
  }
  // Check 12: School Science / Volcano scenario (Test 2)
  else if (lower.includes('volcano')) {
    state.currentTopic = 'volcano';
    state.knownFacts = Array.from(new Set([...state.knownFacts, 'Teacher demonstrated a volcano in class']));
    replyText = "Really? What happened?";
    askedQuestion = "What happened?";
    suggestedReplies = ['It exploded! 💥', 'Lots of red foam 🌋', 'Vinegar & soda reaction 🧪'];
    nextAction = 'FOLLOW_TOPIC';
  } else if (lower.includes('exploded') && state.currentTopic === 'volcano') {
    replyText = "That sounds fun 😄 Was it a model volcano?";
    askedQuestion = "Was it a model volcano?";
    suggestedReplies = ['Yeah 🌋', 'Made of clay 🏺', 'Everyone got to try 🧪'];
    nextAction = 'FOLLOW_TOPIC';
  } else if (
    (lower === 'yeah' || lower === 'yes' || lower === 'it was') &&
    state.currentTopic === 'volcano' &&
    state.lastAIQuestion?.includes('model')
  ) {
    replyText = "Did everyone get to try it?";
    askedQuestion = "Did everyone get to try it?";
    suggestedReplies = ['Yes, in groups 👥', 'Just the teacher 👨‍🏫', 'We took notes 📝'];
    nextAction = 'FOLLOW_TOPIC';
  }
  // Check 13: Time of arrival / TV (Scenario pre_study / late arrival)
  else if (lower.includes('tv') || lower.includes('watched tv')) {
    state.knownFacts = Array.from(new Set([...state.knownFacts, 'Watched TV after school']));
    replyText = "Got it. Ready to do something now?";
    askedQuestion = "Ready to do something now?";
    suggestedReplies = ['📚 Study Maths', '🎨 Draw', '🏃 Brain break'];
    observationRecord = {
      title: 'Watched TV after school',
      detail: 'Child reported watching TV after school until 5:00 PM',
      source: 'child_reported',
      category: 'after_school',
    };
    nextAction = 'OFFER_CHOICE';
  } else if (lower.includes('3:00') || lower.includes('3:30') || lower.includes('3 pm')) {
    state.knownFacts = Array.from(new Set([...state.knownFacts, `Got home at ${rawText}`]));
    replyText = "Got it. What did you get up to after you got home?";
    askedQuestion = "What did you get up to after you got home?";
    suggestedReplies = ['📺 Watched TV', '⚽ Played outside', '🎮 Relaxed a bit'];
    observationRecord = {
      title: 'Arrived home from school',
      detail: `Child reported returning home at ${rawText}`,
      source: 'child_reported',
      category: 'after_school',
    };
    nextAction = 'ASK';
  }
  // Check 14: Wake-up time reported in morning
  else if (lower.includes('6:30') || lower.includes('6:45') || lower.includes('7:00')) {
    state.knownFacts = Array.from(new Set([...state.knownFacts, `Woke up at ${rawText}`]));
    replyText = "Nice! Have you had breakfast yet?";
    askedQuestion = "Have you had breakfast yet?";
    suggestedReplies = ['Had breakfast 🥞', 'Having it now 🥣', 'Not yet'];
    observationRecord = {
      title: 'Morning wake-up',
      detail: `Reported by child: ${rawText}`,
      source: 'child_reported',
      category: 'routine',
    };
    nextAction = 'ASK';
  }
  // Check 15: Breakfast reported
  else if (lower.includes('breakfast') || lower.includes('ate') || lower.includes('had food')) {
    state.knownFacts = Array.from(new Set([...state.knownFacts, 'Had breakfast']));
    replyText = "Awesome. Ready for school today?";
    askedQuestion = "Ready for school today?";
    suggestedReplies = ['All ready! 🚀', 'Need to pack bag 🎒', 'Water bottle filled 💧'];
    observationRecord = {
      title: 'Morning breakfast',
      detail: 'Child reported having breakfast',
      source: 'child_reported',
      category: 'routine',
    };
    nextAction = 'ASK';
  }
  // Check 16: Answers to "How was school?" -> "Good", "Fine", "Okay"
  else if (
    (lower === 'good' || lower === 'fine' || lower === 'okay' || lower === 'great' || lower === 'fun') &&
    (state.lastAIQuestion?.toLowerCase().includes('school') || state.currentTopic === 'school')
  ) {
    state.knownFacts = Array.from(new Set([...state.knownFacts, `School was ${rawText}`]));
    state.questionsAnswered = Array.from(new Set([...state.questionsAnswered, 'How was school?']));
    
    // Check if we haven't asked about interesting events
    if (!state.questionsAsked.some((q) => q.toLowerCase().includes('interesting'))) {
      replyText = "Nice. Anything interesting happen?";
      askedQuestion = "Anything interesting happen?";
      suggestedReplies = ['We played football ⚽', 'Teacher showed a volcano 🌋', 'Just normal classes 📚', 'I want to draw 🎨'];
    } else {
      replyText = "Nice 😊";
      askedQuestion = null; // Deliberate pause!
      suggestedReplies = ['I want Maths 📐', 'I want to draw 🎨', 'Tell me a riddle ❓', 'I\'m tired 😴'];
    }
    nextAction = 'FOLLOW_TOPIC';
  }
  // Check 17: Riddles
  else if (lower.includes('riddle')) {
    state.currentTopic = 'riddle';
    replyText = "Here's one: What has hands, but can't clap? ... A clock! ⏰ Want another?";
    askedQuestion = "Want another?";
    suggestedReplies = ['Tell me another! 😄', 'I want to do Maths 📐', 'Drawing studio 🎨'];
    nextAction = 'FOLLOW_TOPIC';
  }
  // Check 18: Jokes
  else if (lower.includes('joke')) {
    state.currentTopic = 'joke';
    replyText = "Why did the maths book look sad? Because it had too many problems! 😆 What do you feel like doing next?";
    askedQuestion = "What do you feel like doing next?";
    suggestedReplies = ['Another joke! 😆', 'Work on Maths 📐', 'Draw something 🎨'];
    nextAction = 'FOLLOW_TOPIC';
  }
  // Check 19: Scientific question / Moon
  else if (lower.includes('moon') || lower.includes('space') || lower.includes('planet')) {
    state.currentTopic = 'science_explore';
    replyText = "That's because as the moon orbits Earth, the sunlight hits it from different angles, so we see different phases! Pretty neat, right?";
    askedQuestion = "Pretty neat, right?";
    suggestedReplies = ['Yeah! 🌙', 'Can we draw space? 🎨', 'Read science notes 🔬'];
    actionTrigger = 'open_explore';
    nextAction = 'FOLLOW_TOPIC';
  }
  // Default natural contextual response
  else {
    replyText = `Got it, ${childName}! What's on your mind right now?`;
    askedQuestion = "What's on your mind right now?";
    suggestedReplies = ['Work on Maths 📐', 'Draw a picture 🎨', 'Brain break 🏃', 'Tell me a riddle ❓'];
    nextAction = 'ASK';
  }

  // Quality check & Loop Prevention:
  // Ensure we NEVER repeat a question in questionsAsked, and NEVER re-deliver opening greeting!
  if (askedQuestion && state.questionsAsked.includes(askedQuestion)) {
    // Suppress repetitive question!
    replyText = replyText.replace(askedQuestion, '').trim() || "Awesome 😊";
    askedQuestion = null;
  }

  // Update questionsAsked and recentAIResponses
  if (askedQuestion) {
    state.questionsAsked = Array.from(new Set([...state.questionsAsked, askedQuestion]));
  }
  state.recentAIResponses = [...state.recentAIResponses.slice(-4), replyText];
  state.lastAIResponse = replyText;
  state.lastAIQuestion = askedQuestion;

  // Try fetching high-fidelity AI audio or server enhancement asynchronously
  let audioUrl: string | null = null;
  try {
    const ttsRes = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: replyText, voice: 'Puck' }),
    });
    if (ttsRes.ok) {
      const ttsData = await ttsRes.json();
      if (ttsData.audioUrl) {
        audioUrl = ttsData.audioUrl;
      }
    }
  } catch {}

  return {
    reply: replyText,
    suggestedReplies,
    action: actionTrigger,
    observationRecord,
    audioUrl,
    updatedState: state,
  };
}
