import React from 'react';
import { BookOpen, Palette, PlaySquare, Activity, MessageSquare, Compass, Sparkles } from 'lucide-react';

interface ActivityChoicesGridProps {
  onSelectActivity: (activity: 'study' | 'drawing' | 'youtube' | 'move' | 'chat' | 'explore') => void;
}

export const ActivityChoicesGrid: React.FC<ActivityChoicesGridProps> = ({ onSelectActivity }) => {
  const activities = [
    {
      id: 'study' as const,
      label: 'Study',
      emoji: '📚',
      desc: 'Textbooks & notes',
      color: 'bg-blue-50/80 border-blue-200 text-blue-900 hover:bg-blue-100/70',
      badge: 'Current focus',
    },
    {
      id: 'drawing' as const,
      label: 'Draw',
      emoji: '🎨',
      desc: 'Freehand sketchpad',
      color: 'bg-purple-50/80 border-purple-200 text-purple-900 hover:bg-purple-100/70',
    },
    {
      id: 'youtube' as const,
      label: 'Watch',
      emoji: '▶️',
      desc: 'Approved videos',
      color: 'bg-rose-50/80 border-rose-200 text-rose-900 hover:bg-rose-100/70',
    },
    {
      id: 'move' as const,
      label: 'Move',
      emoji: '🏃',
      desc: '5-min stretch break',
      color: 'bg-emerald-50/80 border-emerald-200 text-emerald-900 hover:bg-emerald-100/70',
    },
    {
      id: 'chat' as const,
      label: 'Ask Guide',
      emoji: '💬',
      desc: 'Socratic learning help',
      color: 'bg-amber-50/80 border-amber-200 text-amber-900 hover:bg-amber-100/70',
    },
    {
      id: 'explore' as const,
      label: 'Explore',
      emoji: '🔍',
      desc: 'Calculator & reads',
      color: 'bg-cyan-50/80 border-cyan-200 text-cyan-900 hover:bg-cyan-100/70',
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          What are you in the mood for?
        </h3>
        <span className="text-[11px] text-slate-400 font-medium">Safe personal space</span>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
        {activities.map((act) => (
          <button
            key={act.id}
            id={`act-btn-${act.id}`}
            onClick={() => onSelectActivity(act.id)}
            className={`flex flex-col items-center text-center p-3 rounded-2xl border transition-all duration-150 active:scale-95 cursor-pointer shadow-2xs ${act.color}`}
          >
            <div className="text-2xl mb-1.5 transform transition-transform group-hover:scale-110">
              {act.emoji}
            </div>
            <span className="text-xs font-bold leading-tight line-clamp-1">{act.label}</span>
            <span className="text-[10px] opacity-75 leading-tight mt-0.5 hidden sm:inline">
              {act.desc}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
