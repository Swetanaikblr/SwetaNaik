import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, CheckCircle2, ChevronRight, Award, Flame, Sparkles } from 'lucide-react';
import { playChime, speakText } from '../../utils/speech';

export interface ExerciseGuide {
  id: string;
  title: string;
  subtitle: string;
  emoji: string;
  category: 'cardio' | 'mobility' | 'strength' | 'rest';
  targetReps?: number;
  durationSeconds?: number;
  formTips: string[];
  mistakesToAvoid: string[];
  encouragements: string[];
}

export const EXERCISE_GUIDES: ExerciseGuide[] = [
  {
    id: 'jumping_jacks',
    title: '20 Jumping Jacks',
    subtitle: 'Full-body oxygen boost & coordination',
    emoji: '⚡',
    category: 'cardio',
    targetReps: 20,
    durationSeconds: 40,
    formTips: [
      'Land softly on the balls of your feet to protect your knees.',
      'Bring arms all the way overhead until hands meet.',
      'Keep your core tight and eyes looking forward.',
    ],
    mistakesToAvoid: [
      'Avoid landing flat-footed with heavy thuds.',
      'Do not bend forward at the waist while jumping.',
    ],
    encouragements: ['Great rhythm!', 'Spring off your toes!', 'Halfway there, awesome energy!'],
  },
  {
    id: 'squats_reach',
    title: 'Squats & Sky Reach',
    subtitle: 'Leg power, spine extension & posture',
    emoji: '🏋️',
    category: 'strength',
    targetReps: 12,
    durationSeconds: 36,
    formTips: [
      'Keep feet shoulder-width apart, weight centered on your heels.',
      'Push your hips back as if sitting down into a chair.',
      'Explode upward and reach both hands tall into the sky!',
    ],
    mistakesToAvoid: [
      'Do not let your knees collapse inward.',
      'Do not lift your heels off the floor.',
    ],
    encouragements: ['Nice deep squat!', 'Reach for the stars!', 'Strong legs!'],
  },
  {
    id: 'neck_rolls',
    title: 'Neck & Shoulder Rolls',
    subtitle: 'Relieve desk tension and relax upper spine',
    emoji: '💆',
    category: 'mobility',
    durationSeconds: 30,
    formTips: [
      'Drop your chin gently toward your chest.',
      'Slowly circle your ear toward one shoulder, then back and around.',
      'Roll shoulders backward 5 times, then forward 5 times.',
    ],
    mistakesToAvoid: [
      'Never yank or force your neck into pain.',
      'Keep your breathing smooth and steady.',
    ],
    encouragements: ['Feel the tension melting away.', 'Slow and gentle circles.'],
  },
  {
    id: 'high_knees',
    title: 'High Knees Sprint',
    subtitle: 'Supercharge heart rate and core activation',
    emoji: '🏃',
    category: 'cardio',
    targetReps: 20,
    durationSeconds: 30,
    formTips: [
      'Drive each knee up toward your chest/hip level.',
      'Pump the opposite arm in rhythm with your legs.',
      'Stay light and bouncy on the balls of your feet.',
    ],
    mistakesToAvoid: [
      'Avoid leaning backward; maintain a slight forward lean.',
    ],
    encouragements: ['Pump those arms!', 'Knees up high!', 'Looking fast!'],
  },
  {
    id: 'windmill_stretches',
    title: 'Windmill Toe Touches',
    subtitle: 'Hamstring stretch and torso rotation',
    emoji: '🤸',
    category: 'mobility',
    targetReps: 10,
    durationSeconds: 30,
    formTips: [
      'Stand with feet wide apart and arms extended like a helicopter.',
      'Bend at hips to touch right hand to left foot; left arm points up.',
      'Return to center, then reach left hand to right foot.',
    ],
    mistakesToAvoid: [
      'Do not lock your knees tightly; keep a micro-bend.',
    ],
    encouragements: ['Feel that nice stretch!', 'Smooth helicopter turns!'],
  },
  {
    id: 'calming_breath',
    title: '20-20-20 Eye Rest & Deep Breath',
    subtitle: 'Optic nerve relaxation & nervous system reset',
    emoji: '🧘',
    category: 'rest',
    durationSeconds: 40,
    formTips: [
      'Look away from your screen at an object 20 feet away.',
      'Inhale slowly for 4 seconds as the circle expands.',
      'Hold 4 seconds, then exhale gently for 4 seconds.',
    ],
    mistakesToAvoid: [
      'Do not hold your breath to the point of strain.',
    ],
    encouragements: ['Breathe in calm...', 'Breathe out stress...'],
  },
];

interface ExerciseDemonstrationViewerProps {
  initialExerciseId?: string;
  onCompleteExercise?: (exerciseId: string, durationMinutes: number) => void;
  onClose?: () => void;
}

export const ExerciseDemonstrationViewer: React.FC<ExerciseDemonstrationViewerProps> = ({
  initialExerciseId = 'jumping_jacks',
  onCompleteExercise,
  onClose,
}) => {
  const [selectedId, setSelectedId] = useState(initialExerciseId);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState<0.5 | 1.0>(1.0);
  const [voiceCoachEnabled, setVoiceCoachEnabled] = useState(true);
  const [activeRep, setActiveRep] = useState(0);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [formCheckTab, setFormCheckTab] = useState<'tips' | 'avoid'>('tips');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const phaseRef = useRef<number>(0);

  const currentExercise =
    EXERCISE_GUIDES.find((e) => e.id === selectedId) || EXERCISE_GUIDES[0];

  // Reset state when switching exercises
  useEffect(() => {
    setActiveRep(0);
    setTimerSeconds(currentExercise.durationSeconds || 30);
    setIsCompleted(false);
  }, [selectedId]);

  // Countdown timer when playing
  useEffect(() => {
    let timer: any = null;
    if (isPlaying && timerSeconds > 0 && !isCompleted) {
      timer = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            setIsCompleted(true);
            try {
              playChime('celebrate');
            } catch {}
            if (voiceCoachEnabled) {
              speakText(`Awesome workout! You crushed the ${currentExercise.title}!`);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isPlaying, timerSeconds, isCompleted, currentExercise, voiceCoachEnabled]);

  // Main Canvas Animation Engine for demonstrating human exercise movement
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastTime = performance.now();

    const render = (time: number) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;

      if (isPlaying) {
        // Increment phase based on exercise speed
        const speedMultiplier = speed === 0.5 ? 1.5 : 3.0;
        phaseRef.current += dt * speedMultiplier;
      }

      const p = phaseRef.current;
      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);

      // Background ambient gym floor & lighting
      const grad = ctx.createRadialGradient(w / 2, h / 2, 20, w / 2, h / 2, w / 1.5);
      grad.addColorStop(0, '#f8fafc');
      grad.addColorStop(1, '#e2e8f0');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Floor shadow ring
      ctx.beginPath();
      ctx.ellipse(w / 2, h - 35, 70, 14, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.08)';
      ctx.fill();

      // Draw specific animated demonstration figure
      if (selectedId === 'jumping_jacks') {
        drawJumpingJacks(ctx, w, h, p);
      } else if (selectedId === 'squats_reach') {
        drawSquats(ctx, w, h, p);
      } else if (selectedId === 'neck_rolls') {
        drawNeckRolls(ctx, w, h, p);
      } else if (selectedId === 'high_knees') {
        drawHighKnees(ctx, w, h, p);
      } else if (selectedId === 'windmill_stretches') {
        drawWindmill(ctx, w, h, p);
      } else {
        drawBreathingGuide(ctx, w, h, p);
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [selectedId, isPlaying, speed]);

  // --- DRAWING FUNCTIONS FOR DEMONSTRATIONS ---

  function drawJumpingJacks(ctx: CanvasRenderingContext2D, w: number, h: number, phase: number) {
    const cycle = (Math.sin(phase) + 1) / 2; // 0 (closed) to 1 (fully open)
    const bounce = Math.abs(Math.sin(phase)) * 20;

    const centerX = w / 2;
    const groundY = h - 45 - bounce;

    // Head & Face
    const headY = groundY - 140;
    ctx.beginPath();
    ctx.arc(centerX, headY, 18, 0, Math.PI * 2);
    ctx.fillStyle = '#4f46e5';
    ctx.fill();

    // Friendly face eyes
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(centerX - 6, headY - 2, 3, 0, Math.PI * 2);
    ctx.arc(centerX + 6, headY - 2, 3, 0, Math.PI * 2);
    ctx.fill();

    // Torso
    const shoulderY = headY + 18;
    const hipY = groundY - 70;
    ctx.beginPath();
    ctx.moveTo(centerX, shoulderY);
    ctx.lineTo(centerX, hipY);
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#6366f1';
    ctx.stroke();

    // Legs: Spread from 15px to 55px width
    const legSpread = 15 + cycle * 45;
    ctx.lineWidth = 10;
    ctx.strokeStyle = '#3b82f6';

    // Left Leg
    ctx.beginPath();
    ctx.moveTo(centerX - 4, hipY);
    ctx.lineTo(centerX - legSpread, groundY);
    ctx.stroke();

    // Right Leg
    ctx.beginPath();
    ctx.moveTo(centerX + 4, hipY);
    ctx.lineTo(centerX + legSpread, groundY);
    ctx.stroke();

    // Feet / Shoes
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.ellipse(centerX - legSpread - 4, groundY, 8, 4, 0, 0, Math.PI * 2);
    ctx.ellipse(centerX + legSpread + 4, groundY, 8, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Arms: Sweeping overhead arc
    const armAngle = -Math.PI / 4 + cycle * (Math.PI * 0.85); // Down to high-V
    const armLen = 48;

    // Left Arm
    const leftElbowX = centerX - Math.cos(armAngle) * armLen * 0.6;
    const leftElbowY = shoulderY - Math.sin(armAngle) * armLen * 0.6;
    const leftHandX = centerX - Math.cos(armAngle) * armLen;
    const leftHandY = shoulderY - Math.sin(armAngle) * armLen;

    ctx.strokeStyle = '#818cf8';
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(centerX - 6, shoulderY);
    ctx.lineTo(leftElbowX, leftElbowY);
    ctx.lineTo(leftHandX, leftHandY);
    ctx.stroke();

    // Right Arm
    const rightElbowX = centerX + Math.cos(armAngle) * armLen * 0.6;
    const rightElbowY = shoulderY - Math.sin(armAngle) * armLen * 0.6;
    const rightHandX = centerX + Math.cos(armAngle) * armLen;
    const rightHandY = shoulderY - Math.sin(armAngle) * armLen;

    ctx.beginPath();
    ctx.moveTo(centerX + 6, shoulderY);
    ctx.lineTo(rightElbowX, rightElbowY);
    ctx.lineTo(rightHandX, rightHandY);
    ctx.stroke();

    // Overhead Clap Sparkle when cycle > 0.85
    if (cycle > 0.85) {
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(centerX, shoulderY - armLen - 6, 6, 0, Math.PI * 2);
      ctx.fill();
    }

    // Dynamic Form Annotation Badge
    drawAnnotationBadge(
      ctx,
      centerX,
      h - 15,
      cycle > 0.5 ? '⚡ Arms High & Feet Wide' : '⚡ Feet In & Arms Down'
    );
  }

  function drawSquats(ctx: CanvasRenderingContext2D, w: number, h: number, phase: number) {
    const cycle = (Math.sin(phase) + 1) / 2; // 0 (up) to 1 (deep squat)
    const centerX = w / 2;
    const groundY = h - 45;

    const squatDrop = cycle * 38;
    const hipY = groundY - 65 + squatDrop;
    const headY = hipY - 60;
    const shoulderY = headY + 16;

    // Head
    ctx.beginPath();
    ctx.arc(centerX - cycle * 8, headY, 18, 0, Math.PI * 2);
    ctx.fillStyle = '#059669';
    ctx.fill();

    // Torso with natural squat hip hinge
    ctx.beginPath();
    ctx.moveTo(centerX - cycle * 8, shoulderY);
    ctx.lineTo(centerX - cycle * 16, hipY);
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#10b981';
    ctx.stroke();

    // Legs with bent knees
    const kneeX = centerX + 12 - cycle * 2;
    const kneeY = (hipY + groundY) / 2 + cycle * 12;

    ctx.lineWidth = 10;
    ctx.strokeStyle = '#047857';

    // Left/Right Leg
    ctx.beginPath();
    ctx.moveTo(centerX - cycle * 16, hipY);
    ctx.lineTo(kneeX - 10, kneeY);
    ctx.lineTo(centerX - 18, groundY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(centerX - cycle * 16, hipY);
    ctx.lineTo(kneeX + 10, kneeY);
    ctx.lineTo(centerX + 18, groundY);
    ctx.stroke();

    // Arms: Counterbalance forward when down, sky reach when up
    const armReachY = cycle > 0.5 ? shoulderY : shoulderY - 45;
    const armReachX = cycle > 0.5 ? centerX + 40 : centerX;

    ctx.strokeStyle = '#34d399';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(centerX, shoulderY);
    ctx.lineTo(armReachX, armReachY);
    ctx.stroke();

    drawAnnotationBadge(
      ctx,
      centerX,
      h - 15,
      cycle > 0.6 ? '🏋️ Deep Squat (Knees 90°)' : '🏋️ Explode Up & Reach Tall!'
    );
  }

  function drawNeckRolls(ctx: CanvasRenderingContext2D, w: number, h: number, phase: number) {
    const centerX = w / 2;
    const centerY = h / 2 - 10;

    const rollRadius = 14;
    const headOffsetX = Math.cos(phase * 0.7) * rollRadius;
    const headOffsetY = Math.sin(phase * 0.7) * rollRadius;

    // Shoulder base
    ctx.lineWidth = 16;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#0284c7';
    ctx.beginPath();
    ctx.moveTo(centerX - 50, centerY + 50);
    ctx.lineTo(centerX + 50, centerY + 50);
    ctx.stroke();

    // Neck
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY + 45);
    ctx.lineTo(centerX + headOffsetX * 0.4, centerY + 10 + headOffsetY * 0.4);
    ctx.stroke();

    // Head
    ctx.fillStyle = '#0369a1';
    ctx.beginPath();
    ctx.arc(centerX + headOffsetX, centerY - 10 + headOffsetY, 26, 0, Math.PI * 2);
    ctx.fill();

    // Circular flow indicator guide
    ctx.strokeStyle = 'rgba(14, 165, 233, 0.3)';
    ctx.lineWidth = 3;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(centerX, centerY - 10, rollRadius + 14, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    drawAnnotationBadge(ctx, centerX, h - 15, '💆 Gentle Circular Roll (Breathe Slow)');
  }

  function drawHighKnees(ctx: CanvasRenderingContext2D, w: number, h: number, phase: number) {
    const centerX = w / 2;
    const groundY = h - 45;
    const bounce = Math.abs(Math.sin(phase * 1.5)) * 12;

    const isLeftUp = Math.sin(phase) > 0;
    const liftAmount = Math.abs(Math.sin(phase)) * 42;

    const headY = groundY - 140 - bounce;
    const shoulderY = headY + 18;
    const hipY = groundY - 70 - bounce;

    // Head
    ctx.fillStyle = '#ea580c';
    ctx.beginPath();
    ctx.arc(centerX, headY, 18, 0, Math.PI * 2);
    ctx.fill();

    // Torso
    ctx.lineWidth = 14;
    ctx.strokeStyle = '#f97316';
    ctx.beginPath();
    ctx.moveTo(centerX, shoulderY);
    ctx.lineTo(centerX, hipY);
    ctx.stroke();

    // High Knee Legs
    ctx.lineWidth = 10;
    ctx.strokeStyle = '#c2410c';

    if (isLeftUp) {
      // Left knee high
      ctx.beginPath();
      ctx.moveTo(centerX - 4, hipY);
      ctx.lineTo(centerX - 24, hipY - liftAmount);
      ctx.lineTo(centerX - 24, hipY - liftAmount + 35);
      ctx.stroke();

      // Right leg straight
      ctx.beginPath();
      ctx.moveTo(centerX + 4, hipY);
      ctx.lineTo(centerX + 12, groundY);
      ctx.stroke();
    } else {
      // Right knee high
      ctx.beginPath();
      ctx.moveTo(centerX + 4, hipY);
      ctx.lineTo(centerX + 24, hipY - liftAmount);
      ctx.lineTo(centerX + 24, hipY - liftAmount + 35);
      ctx.stroke();

      // Left leg straight
      ctx.beginPath();
      ctx.moveTo(centerX - 4, hipY);
      ctx.lineTo(centerX - 12, groundY);
      ctx.stroke();
    }

    drawAnnotationBadge(ctx, centerX, h - 15, '🏃 Drive Knees to Hip Level!');
  }

  function drawWindmill(ctx: CanvasRenderingContext2D, w: number, h: number, phase: number) {
    const cycle = Math.sin(phase * 0.8); // -1 (left toe) to +1 (right toe)
    const centerX = w / 2;
    const groundY = h - 45;

    const hipY = groundY - 60;
    const legSpread = 45;

    // Wide legs
    ctx.lineWidth = 10;
    ctx.strokeStyle = '#7c3aed';
    ctx.beginPath();
    ctx.moveTo(centerX, hipY);
    ctx.lineTo(centerX - legSpread, groundY);
    ctx.moveTo(centerX, hipY);
    ctx.lineTo(centerX + legSpread, groundY);
    ctx.stroke();

    // Torso rotating
    const torsoY = hipY - 20;
    const shoulderX = centerX + cycle * 20;
    const shoulderY = torsoY - 25;

    ctx.lineWidth = 14;
    ctx.strokeStyle = '#8b5cf6';
    ctx.beginPath();
    ctx.moveTo(centerX, hipY);
    ctx.lineTo(shoulderX, shoulderY);
    ctx.stroke();

    // Head
    ctx.fillStyle = '#6d28d9';
    ctx.beginPath();
    ctx.arc(shoulderX, shoulderY - 14, 16, 0, Math.PI * 2);
    ctx.fill();

    // Windmill arms diagonal
    const armSpan = 55;
    const armAngle = cycle * (Math.PI / 3);

    ctx.lineWidth = 8;
    ctx.strokeStyle = '#a78bfa';
    ctx.beginPath();
    ctx.moveTo(shoulderX - Math.cos(armAngle) * armSpan, shoulderY - Math.sin(armAngle) * armSpan);
    ctx.lineTo(shoulderX + Math.cos(armAngle) * armSpan, shoulderY + Math.sin(armAngle) * armSpan);
    ctx.stroke();

    drawAnnotationBadge(ctx, centerX, h - 15, '🤸 Alternate Hand-to-Toe Rotation');
  }

  function drawBreathingGuide(ctx: CanvasRenderingContext2D, w: number, h: number, phase: number) {
    const cycle = (Math.sin(phase * 0.5) + 1) / 2; // 0 to 1 smooth breath
    const centerX = w / 2;
    const centerY = h / 2 - 10;

    const baseRadius = 35;
    const currentRadius = baseRadius + cycle * 45;

    // Glowing outer halo
    const halo = ctx.createRadialGradient(centerX, centerY, baseRadius, centerX, centerY, currentRadius + 20);
    halo.addColorStop(0, 'rgba(56, 189, 248, 0.4)');
    halo.addColorStop(1, 'rgba(56, 189, 248, 0.0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(centerX, centerY, currentRadius + 20, 0, Math.PI * 2);
    ctx.fill();

    // Expanding breathing ring
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(centerX, centerY, currentRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Inner calm orb
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(centerX, centerY, baseRadius * 0.8, 0, Math.PI * 2);
    ctx.fill();

    // Breath text
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(cycle > 0.5 ? 'Inhale 🌬️' : 'Exhale 😌', centerX, centerY + 4);

    drawAnnotationBadge(ctx, centerX, h - 15, '🧘 Rest Eyes & Breathe Deeply');
  }

  function drawAnnotationBadge(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    text: string
  ) {
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    const metrics = ctx.measureText(text);
    const bgWidth = metrics.width + 24;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.beginPath();
    ctx.roundRect(x - bgWidth / 2, y - 14, bgWidth, 20, 10);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, x, y);
  }

  return (
    <div className="bg-white rounded-3xl p-5 shadow-2xl border border-slate-200 max-w-xl w-full mx-auto relative overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center text-xl shadow-inner">
            {currentExercise.emoji}
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              {currentExercise.title}
            </h3>
            <p className="text-xs text-slate-500 font-medium">{currentExercise.subtitle}</p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            ✕
          </button>
        )}
      </div>

      {/* Exercise Selection Carousel / Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3 scrollbar-none">
        {EXERCISE_GUIDES.map((ex) => (
          <button
            key={ex.id}
            onClick={() => setSelectedId(ex.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedId === ex.id
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span>{ex.emoji}</span>
            <span>{ex.title.split(' ')[0]}</span>
          </button>
        ))}
      </div>

      {/* Interactive Demonstration Visual Canvas */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-inner bg-slate-50 mb-4">
        <canvas
          ref={canvasRef}
          width={480}
          height={260}
          className="w-full h-[220px] sm:h-[250px] object-contain block mx-auto"
        />

        {/* Floating Top Controls: Speed & Voice Coach */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          <button
            onClick={() => setSpeed(speed === 1.0 ? 0.5 : 1.0)}
            className="px-2.5 py-1 rounded-xl bg-white/90 backdrop-blur-xs border border-slate-200 text-[11px] font-bold text-slate-700 hover:bg-white shadow-2xs cursor-pointer"
            title="Toggle normal speed vs slow-motion form breakdown"
          >
            Speed: {speed === 1.0 ? '1.0x Real-time' : '0.5x Slow Form Guide'}
          </button>

          <button
            onClick={() => setVoiceCoachEnabled(!voiceCoachEnabled)}
            className={`p-1.5 rounded-xl border text-xs cursor-pointer transition-colors ${
              voiceCoachEnabled
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                : 'bg-white/90 border-slate-200 text-slate-400'
            }`}
            title="Toggle companion voice coach cues"
          >
            {voiceCoachEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Floating Top Right: Countdown / Reps */}
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-xs border border-slate-200 px-3 py-1 rounded-xl shadow-2xs flex items-center gap-1.5">
          <span className="text-xs font-black text-slate-800 font-mono">
            {timerSeconds}s left
          </span>
        </div>
      </div>

      {/* Main Playback & Interactive Action Controls */}
      <div className="flex items-center justify-between gap-2 mb-4 bg-slate-50 p-3 rounded-2xl border border-slate-100">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            <span>{isPlaying ? 'Pause Demo' : 'Play Demo'}</span>
          </button>

          <button
            onClick={() => {
              setTimerSeconds(currentExercise.durationSeconds || 30);
              setIsCompleted(false);
              setIsPlaying(true);
            }}
            className="p-2 rounded-xl bg-white hover:bg-slate-200 text-slate-600 border border-slate-200 cursor-pointer"
            title="Reset demonstration timer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        <button
          onClick={() => {
            setIsCompleted(true);
            if (onCompleteExercise) {
              onCompleteExercise(currentExercise.id, 5);
            }
          }}
          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>I Finished This ✓</span>
        </button>
      </div>

      {/* Form Check & Instructions Breakdown Tabs */}
      <div className="border border-slate-200 rounded-2xl p-3.5 bg-slate-50/50">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setFormCheckTab('tips')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                formCheckTab === 'tips'
                  ? 'bg-indigo-100 text-indigo-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              ✓ Form Cues ({currentExercise.formTips.length})
            </button>
            <button
              onClick={() => setFormCheckTab('avoid')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                formCheckTab === 'avoid'
                  ? 'bg-rose-100 text-rose-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              ⚠️ Common Mistakes
            </button>
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Safe Kid Form
          </span>
        </div>

        {formCheckTab === 'tips' ? (
          <ul className="space-y-1.5 text-xs text-slate-700">
            {currentExercise.formTips.map((tip, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold shrink-0 mt-0.5">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        ) : (
          <ul className="space-y-1.5 text-xs text-slate-700">
            {currentExercise.mistakesToAvoid.map((mistake, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-rose-500 font-bold shrink-0 mt-0.5">✕</span>
                <span>{mistake}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Completion celebratory banner */}
      {isCompleted && (
        <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-emerald-600" />
            <span className="text-xs font-bold text-emerald-900">
              Exercise completed! 5-minute movement break logged.
            </span>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl cursor-pointer"
            >
              Done ✓
            </button>
          )}
        </div>
      )}
    </div>
  );
};
