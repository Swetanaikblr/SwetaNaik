import React, { useState } from 'react';
import { X, Play, RotateCcw, CheckCircle2 } from 'lucide-react';
import { ExerciseDemonstrationViewer } from './ExerciseDemonstrationViewer';

interface MoveBreakModalProps {
  onClose: () => void;
  onLogMove?: (minutes: number) => void;
  initialExerciseId?: string;
}

export const MoveBreakModal: React.FC<MoveBreakModalProps> = ({
  onClose,
  onLogMove,
  initialExerciseId = 'jumping_jacks',
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 animate-fadeIn">
      <div className="relative max-w-xl w-full">
        <ExerciseDemonstrationViewer
          initialExerciseId={initialExerciseId}
          onClose={onClose}
          onCompleteExercise={(exerciseId, durationMinutes) => {
            if (onLogMove) onLogMove(durationMinutes || 5);
          }}
        />
      </div>
    </div>
  );
};
