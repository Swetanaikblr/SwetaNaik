// Express + WebSocket Live API Bridge (server/services/geminiLiveBridge.ts)
import { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI, LiveServerMessage, Modality, FunctionDeclaration, Type } from '@google/genai';

// Gemini Function Declarations for Structured Tool Calling
export const GEMINI_LIVE_TOOLS: FunctionDeclaration[] = [
  {
    name: 'openStudySession',
    description:
      'Open the child homework study studio for mathematics, biology, or school notes when the child wants to study or asks about homework.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        subject: {
          type: Type.STRING,
          description: 'Subject name such as Mathematics, Science, or English.',
        },
        topic: {
          type: Type.STRING,
          description: 'Specific topic such as Linear Equations or Photosynthesis.',
        },
        focusNotes: {
          type: Type.STRING,
          description: 'Brief encouraging note on what will be covered.',
        },
      },
      required: ['subject'],
    },
  },
  {
    name: 'openDrawingStudio',
    description:
      'Open the creative digital drawing and sketch studio when the child wants to doodle, draw, paint, or express creativity.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        prompt: {
          type: Type.STRING,
          description: 'Suggested doodle starter or creative inspiration.',
        },
        theme: {
          type: Type.STRING,
          description: 'Visual theme such as Space, Animals, Football, or Nature.',
        },
      },
    },
  },
  {
    name: 'openMovementBreak',
    description:
      'Open a 5-minute energetic stretching and movement break to recharge the child.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        durationMinutes: {
          type: Type.NUMBER,
          description: 'Duration in minutes, typically 3 to 5.',
        },
        activityType: {
          type: Type.STRING,
          description: 'Type of movement: jumping_jacks, desk_stretch, soccer_warmup, or breathing.',
        },
      },
    },
  },
  {
    name: 'openEducationalVideos',
    description:
      'Open curated educational video viewer (e.g. Kurzgesagt, SciShow Kids, National Geographic).',
    parameters: {
      type: Type.OBJECT,
      properties: {
        topic: {
          type: Type.STRING,
          description: 'Topic to search or explore.',
        },
      },
      required: ['topic'],
    },
  },
  {
    name: 'openCuriosityExplorer',
    description:
      'Open science and world exploration modal for deep-dive curiosity questions.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        topic: {
          type: Type.STRING,
          description: 'Curiosity topic such as Black Holes, Deep Oceans, or Dinosaurs.',
        },
      },
      required: ['topic'],
    },
  },
  {
    name: 'recordObservation',
    description:
      'Passively record a structured factual observation for the parent dashboard without alerting or patronizing the child.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: {
          type: Type.STRING,
          description: 'Short headline of the observation.',
        },
        detail: {
          type: Type.STRING,
          description: 'Contextual factual note.',
        },
        category: {
          type: Type.STRING,
          description: 'Category: routine, learning, wellbeing, after_school, or responsibility.',
        },
        confidence: {
          type: Type.NUMBER,
          description: 'Confidence score from 0.0 to 1.0.',
        },
        source: {
          type: Type.STRING,
          description: 'Source: child_reported, behavioral_inference, routine_check, or timer_trigger.',
        },
        rawChildQuote: {
          type: Type.STRING,
          description: 'Direct quotation of what the child stated.',
        },
      },
      required: ['title', 'detail', 'category'],
    },
  },
  {
    name: 'scheduleWellnessBreak',
    description:
      'Schedule or trigger an activity-aware screen-time wellness pause (20-20-20 eye rest or posture stretch).',
    parameters: {
      type: Type.OBJECT,
      properties: {
        delayMinutes: {
          type: Type.NUMBER,
          description: 'Minutes to wait before triggering break (0 for immediate).',
        },
        reason: {
          type: Type.STRING,
          description: 'Gentle child-friendly explanation.',
        },
        breakType: {
          type: Type.STRING,
          description: 'eye_rest_20, posture_stretch, hydration, or movement_recharge.',
        },
      },
      required: ['reason'],
    },
  },
  {
    name: 'setTimer',
    description: 'Set a countdown timer or reminder for the child (e.g. 1 minute, 5 minutes, 30 seconds).',
    parameters: {
      type: Type.OBJECT,
      properties: {
        durationSeconds: {
          type: Type.NUMBER,
          description: 'Duration in seconds (e.g. 60 for 1 minute).',
        },
        minutes: {
          type: Type.NUMBER,
          description: 'Duration in minutes.',
        },
        label: {
          type: Type.STRING,
          description: 'Short friendly reminder label (e.g. "1-minute reminder").',
        },
      },
      required: ['durationSeconds'],
    },
  },
  {
    name: 'demonstrateExercise',
    description: 'Open the visual animated exercise demonstration viewer for jumping jacks, squats, high knees, neck rolls, or breathing.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        exerciseId: {
          type: Type.STRING,
          description: 'Exercise ID: jumping_jacks, squats_reach, high_knees, neck_rolls, or calming_breath.',
        },
      },
    },
  },
];

export function setupGeminiLiveBridge(
  httpServer: HttpServer,
  getGeminiClient: () => GoogleGenAI | null
): WebSocketServer {
  const wss = new WebSocketServer({ noServer: true });

  // Attach upgrade handler to HTTP server
  httpServer.on('upgrade', (request, socket, head) => {
    const pathname = new URL(request.url || '', `http://${request.headers.host}`).pathname;

    if (pathname === '/api/live' || pathname === '/live') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
  });

  wss.on('connection', async (clientWs: WebSocket) => {
    console.log('[GeminiLiveBridge] Client connected to Live Voice WebSocket');

    let geminiLiveSession: any = null;
    let companionVoice = 'Puck';
    let childName = 'Aarav';
    let systemInstruction = `You are a supportive, warm, conversational companion for a 10-year-old child named ${childName}.
Your responses should be 1-2 spoken sentences maximum. Speak with a natural, friendly pacing.
Never act like a robotic drillmaster or nagging authority figure.
Use your declared tools to open study sessions, drawing studios, or suggest breaks when natural.`;

    const cleanupSession = () => {
      if (geminiLiveSession) {
        try {
          geminiLiveSession.close();
        } catch {}
        geminiLiveSession = null;
      }
    };

    clientWs.on('message', async (data) => {
      try {
        const payload = JSON.parse(data.toString());

        // 1. Session initialization
        if (payload.type === 'init') {
          companionVoice = payload.voiceName || 'Puck';
          childName = payload.childName || 'Aarav';

          if (payload.systemInstructionAddendum) {
            systemInstruction += `\n${payload.systemInstructionAddendum}`;
          }

          const ai = getGeminiClient();
          if (ai && (ai as any).live) {
            try {
              cleanupSession();
              geminiLiveSession = await (ai as any).live.connect({
                model: 'gemini-3.8-live',
                config: {
                  responseModalities: [Modality.AUDIO],
                  speechConfig: {
                    voiceConfig: {
                      prebuiltVoiceConfig: { voiceName: companionVoice },
                    },
                  },
                  outputAudioTranscription: {},
                  inputAudioTranscription: {},
                  systemInstruction,
                  tools: [{ functionDeclarations: GEMINI_LIVE_TOOLS }],
                },
                callbacks: {
                  onmessage: (message: LiveServerMessage) => {
                    // 1. Forward model audio chunks (24kHz PCM)
                    const audio =
                      message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                    if (audio && clientWs.readyState === WebSocket.OPEN) {
                      clientWs.send(JSON.stringify({ audio }));
                    }

                    // 2. Forward streaming transcriptions
                    const outputText = (message.serverContent as any)?.outputTranscription?.text;
                    if (outputText && clientWs.readyState === WebSocket.OPEN) {
                      clientWs.send(
                        JSON.stringify({
                          transcript: outputText,
                          isUser: false,
                          isFinal: false,
                        })
                      );
                    }

                    const inputText = (message.serverContent as any)?.inputTranscription?.text;
                    if (inputText && clientWs.readyState === WebSocket.OPEN) {
                      clientWs.send(
                        JSON.stringify({
                          transcript: inputText,
                          isUser: true,
                          isFinal: false,
                        })
                      );
                    }

                    // 3. Turn complete
                    if (message.serverContent?.turnComplete && clientWs.readyState === WebSocket.OPEN) {
                      clientWs.send(JSON.stringify({ turnComplete: true }));
                    }

                    // 4. Forward barge-in interruption from model
                    if (message.serverContent?.interrupted && clientWs.readyState === WebSocket.OPEN) {
                      clientWs.send(JSON.stringify({ interrupted: true }));
                    }

                    // 5. Handle tool calls from model
                    const toolCall = (message as any).toolCall;
                    if (toolCall && clientWs.readyState === WebSocket.OPEN) {
                      for (const call of toolCall.functionCalls || []) {
                        clientWs.send(
                          JSON.stringify({
                            type: 'tool_call',
                            name: call.name,
                            args: call.args,
                            callId: call.id,
                          })
                        );

                        // Send acknowledgement back to Gemini Live
                        if (geminiLiveSession?.sendToolResponse) {
                          geminiLiveSession.sendToolResponse({
                            functionResponses: [
                              {
                                id: call.id,
                                response: { output: { success: true, message: 'Action executed' } },
                              },
                            ],
                          });
                        }
                      }
                    }
                  },
                  onerror: (err: any) => {
                    console.warn('[GeminiLiveBridge] Live session warning:', err?.message || err);
                  },
                  onclose: () => {
                    console.log('[GeminiLiveBridge] Gemini Live session closed');
                  },
                },
              });
              console.log('[GeminiLiveBridge] Connected to gemini-3.8-live with voice', companionVoice);
            } catch (liveErr) {
              console.warn('[GeminiLiveBridge] Could not establish native Gemini Live session:', liveErr);
            }
          }
          return;
        }

        // 2. Realtime input PCM audio from client
        if (payload.type === 'audio' && payload.audio) {
          if (geminiLiveSession && geminiLiveSession.sendRealtimeInput) {
            geminiLiveSession.sendRealtimeInput({
              audio: { data: payload.audio, mimeType: 'audio/pcm;rate=16000' },
            });
          }
          return;
        }

        // 3. Text prompt input from client (starter chips or typing)
        if (payload.type === 'text' && payload.text) {
          if (geminiLiveSession && geminiLiveSession.sendClientContent) {
            try {
              geminiLiveSession.sendClientContent({
                turns: [{ role: 'user', parts: [{ text: payload.text }] }],
                turnComplete: true,
              });
              return;
            } catch (liveSendErr) {
              console.warn('[GeminiLiveBridge] Error sending to live session:', liveSendErr);
            }
          }

          // Resilient fallback: Generate reply directly if live session is unavailable
          let reply = `Got it, ${childName}! What do you feel like doing right now?`;
          let suggestedReplies = ['Tell me a riddle ❓', '🎨 Drawing studio', '🏃 Movement break', '📚 Check tasks'];
          let action: string | null = null;
          let timerData: any = null;

          const lowerText = (payload.text || '').toLowerCase().trim();

          // 1. Timer / Reminder commands
          const timerMatch =
            lowerText.match(/(?:timer|remind|alarm).*?(\d+(?:\.\d+)?)\s*(min(?:ute)?s?|sec(?:ond)?s?)/i) ||
            lowerText.match(/(\d+(?:\.\d+)?)\s*(min(?:ute)?s?|sec(?:ond)?s?)\s*(?:timer|reminder)?/i);

          if (
            timerMatch ||
            lowerText.includes('remind after') ||
            lowerText.includes('remind me') ||
            lowerText.includes('set timer')
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
            reply = `Timer set for ${mins === 1 ? '1 minute' : mins + ' minutes'}! ⏱️ I'll count down and let you know the second it's up.`;
            suggestedReplies = ['⏱️ How much time left?', '⏹️ Cancel timer', '🎨 Draw while waiting', '🏃 Movement break'];
            action = 'set_timer';
            timerData = { durationSeconds: seconds, label, minutes: mins };
          }
          // 2. Exercise Demonstration commands
          else if (
            lowerText.includes('demonstrat') ||
            lowerText.includes('show exercise') ||
            lowerText.includes('jumping jack') ||
            lowerText.includes('how to do') ||
            lowerText === 'exercise'
          ) {
            reply = `Here is the animated demonstration for Jumping Jacks! ⚡ Watch the form guide on screen and let's jump together!`;
            suggestedReplies = ['⚡ Start 20 Jacks', 'Try Squats next 🏋️', 'Done! Feeling energized ✓'];
            action = 'demonstrate_exercise';
          } else if (lowerText.includes('bored') || lowerText.includes('boring')) {
            reply = `Aw, I hear you—being bored is no fun at all 😄 Want to hear a goofy riddle, doodle something cool, or do a quick 5-minute movement break?`;
            suggestedReplies = ['Tell me a riddle ❓', '🎨 Draw something', '🏃 Movement break', 'Tell me a joke 😂'];
          } else if (lowerText.includes('tired') || lowerText.includes('exhausted')) {
            reply = `Sounds like you've had a long day! Want to take a short breather, grab a snack, or should I set a 5-minute rest timer?`;
            suggestedReplies = ['⏱️ Remind after 5 minutes', '🥤 Grab a snack', 'Tell me a riddle ❓', '😌 Just chill'];
          } else if (lowerText.includes('football') || lowerText.includes('match') || lowerText.includes('won')) {
            reply = `Nice! Playing sports after school is awesome. Did you have fun?`;
            suggestedReplies = ['We won! 🏆', 'It was close ⚽', 'Tired now 😴'];
          } else if (lowerText.includes('riddle')) {
            reply = `Here's a good one: What has keys, but no locks; space, but no room; and you can enter, but can't go inside? ... Think you know?`;
            suggestedReplies = ['Reveal the answer! 💡', 'Give me a hint 🔍', 'Tell me a joke 😂'];
          } else if (lowerText.includes('joke')) {
            reply = `Why did the scarecrow win an award? Because he was outstanding in his field! 😄 Want another joke, or something else?`;
            suggestedReplies = ['Haha another joke! 😆', 'Tell me a riddle ❓', '🎨 Draw something'];
          } else if (lowerText.includes('draw') || lowerText.includes('sketch')) {
            reply = `Awesome! I've opened up the drawing studio for you. What are you going to draw?`;
            suggestedReplies = ['A race car 🏎️', 'A space rocket 🚀', 'An animal 🦁'];
            action = 'open_drawing';
          } else if (lowerText.includes('math') || lowerText.includes('study')) {
            reply = `Got it! Let's take a look at your Maths notes together. Opening study studio now!`;
            suggestedReplies = ['Open Maths 📐', 'Help with Question 5 ❓', 'Later ⏳'];
            action = 'open_study';
          }

          const ai = getGeminiClient();
          if (ai && !action) {
            try {
              const res = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: `Child ${childName}: "${payload.text}". Reply warmly in 1-2 spoken sentences as companion Echo. Do not repeat greeting.`,
              });
              if (res.text?.trim()) {
                reply = res.text.trim();
              }
            } catch (genErr) {
              // Gracefully use contextual reply
            }
          }

          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ transcript: reply, isUser: false, suggestedReplies, action, timerData }));
            clientWs.send(JSON.stringify({ turnComplete: true, suggestedReplies, action, timerData }));
          }
          return;
        }

        // 4. Barge-in user interrupt
        if (payload.type === 'interrupt') {
          // Send realtime input interrupt to native session if supported
          return;
        }

        // 5. Companion or Voice switch
        if (payload.type === 'set_companion' || payload.type === 'set_voice') {
          companionVoice = payload.voiceName || 'Puck';
          console.log(`[GeminiLiveBridge] Voice switched to: ${companionVoice}`);
          cleanupSession();
          const ai = getGeminiClient();
          if (ai && (ai as any).live) {
            try {
              geminiLiveSession = await (ai as any).live.connect({
                model: 'gemini-3.8-live',
                config: {
                  responseModalities: [Modality.AUDIO],
                  speechConfig: {
                    voiceConfig: {
                      prebuiltVoiceConfig: { voiceName: companionVoice },
                    },
                  },
                  outputAudioTranscription: {},
                  inputAudioTranscription: {},
                  systemInstruction: systemInstruction + `\n${payload.systemInstructionAddendum || ''}`,
                  tools: [{ functionDeclarations: GEMINI_LIVE_TOOLS }],
                },
                callbacks: {
                  onmessage: (message: LiveServerMessage) => {
                    const audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                    if (audio && clientWs.readyState === WebSocket.OPEN) {
                      clientWs.send(JSON.stringify({ audio }));
                    }
                    const outputText = (message.serverContent as any)?.outputTranscription?.text;
                    if (outputText && clientWs.readyState === WebSocket.OPEN) {
                      clientWs.send(
                        JSON.stringify({
                          transcript: outputText,
                          isUser: false,
                          isFinal: false,
                        })
                      );
                    }
                    if (message.serverContent?.turnComplete && clientWs.readyState === WebSocket.OPEN) {
                      clientWs.send(JSON.stringify({ turnComplete: true }));
                    }
                  },
                },
              });
            } catch (err) {
              console.warn('[GeminiLiveBridge] Failed to reconnect with new voice:', err);
            }
          }
        }
      } catch (parseErr) {
        console.warn('[GeminiLiveBridge] Error parsing client message:', parseErr);
      }
    });

    clientWs.on('close', () => {
      console.log('[GeminiLiveBridge] Client disconnected');
      cleanupSession();
    });

    clientWs.on('error', (err) => {
      console.warn('[GeminiLiveBridge] Client socket error:', err);
      cleanupSession();
    });
  });

  return wss;
}
