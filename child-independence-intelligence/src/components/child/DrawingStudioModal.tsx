import React, { useRef, useState, useEffect } from 'react';
import {
  X,
  RotateCcw,
  Download,
  Trash2,
  Eraser,
  PenTool,
  Highlighter,
  Sparkles,
  Palette,
} from 'lucide-react';

interface DrawingStudioModalProps {
  onClose: () => void;
  onLogDrawing?: (minutes: number) => void;
}

export const DrawingStudioModal: React.FC<DrawingStudioModalProps> = ({ onClose, onLogDrawing }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#3b82f6');
  const [lineWidth, setLineWidth] = useState(5);
  const [tool, setTool] = useState<'pen' | 'highlighter' | 'eraser'>('pen');
  const [history, setHistory] = useState<ImageData[]>([]);
  const startTimeRef = useRef<number>(Date.now());

  const colors = [
    '#1e293b', // slate
    '#ef4444', // red
    '#f97316', // orange
    '#eab308', // yellow
    '#10b981', // green
    '#06b6d4', // cyan
    '#3b82f6', // blue
    '#8b5cf6', // purple
    '#ec4899', // pink
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, rect.width, rect.height);
    saveState();

    return () => {
      if (onLogDrawing) {
        const elapsedMinutes = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 60000));
        onLogDrawing(elapsedMinutes);
      }
    };
  }, []);

  const saveState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory((prev) => [...prev.slice(-10), data]);
  };

  const undo = () => {
    if (history.length <= 1) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const newHist = history.slice(0, -1);
    const prevState = newHist[newHist.length - 1];
    ctx.putImageData(prevState, 0, 0);
    setHistory(newHist);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, rect.width, rect.height);
    saveState();
  };

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (tool === 'eraser') {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = lineWidth * 2.5;
    } else if (tool === 'highlighter') {
      ctx.strokeStyle = `${color}55`;
      ctx.lineWidth = lineWidth * 2.5;
    } else {
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
    }

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    saveState();
  };

  const downloadDrawing = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `my-drawing-${Date.now()}.png`;
    link.href = url;
    link.click();
  };

  const addSticker = (emoji: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.font = '48px serif';
    ctx.textAlign = 'center';
    ctx.fillText(emoji, rect.width / 2, rect.height / 2);
    saveState();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-fadeIn">
      <div className="bg-white w-full max-w-4xl h-[90vh] max-h-[800px] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center text-sm font-bold">
              🎨
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">Drawing Studio</h2>
              <p className="text-[11px] text-slate-500">Express, sketch, and unwind</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={undo}
              disabled={history.length <= 1}
              title="Undo last stroke"
              className="p-1.5 rounded-xl bg-white border border-slate-200 text-slate-600 disabled:opacity-40 hover:bg-slate-100 cursor-pointer transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={clearCanvas}
              title="Clear canvas"
              className="p-1.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-red-600 hover:bg-red-50 cursor-pointer transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={downloadDrawing}
              title="Save image"
              className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Save</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="p-2.5 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Tool selector */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setTool('pen')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all ${
                tool === 'pen' ? 'bg-white text-purple-700 shadow-2xs' : 'text-slate-600'
              }`}
            >
              <PenTool className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Pen</span>
            </button>
            <button
              onClick={() => setTool('highlighter')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all ${
                tool === 'highlighter' ? 'bg-white text-purple-700 shadow-2xs' : 'text-slate-600'
              }`}
            >
              <Highlighter className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Marker</span>
            </button>
            <button
              onClick={() => setTool('eraser')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all ${
                tool === 'eraser' ? 'bg-white text-purple-700 shadow-2xs' : 'text-slate-600'
              }`}
            >
              <Eraser className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Eraser</span>
            </button>
          </div>

          {/* Color palette */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
            {colors.map((c) => (
              <button
                key={c}
                onClick={() => {
                  setColor(c);
                  if (tool === 'eraser') setTool('pen');
                }}
                className={`w-6 h-6 rounded-full border-2 transition-transform cursor-pointer ${
                  color === c && tool !== 'eraser' ? 'scale-125 border-slate-900 shadow-xs' : 'border-white'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>

          {/* Size slider & Stickers */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500 hidden sm:inline">Size:</span>
            <input
              type="range"
              min="2"
              max="30"
              value={lineWidth}
              onChange={(e) => setLineWidth(Number(e.target.value))}
              className="w-20 accent-purple-600 cursor-pointer"
            />
            {/* Quick Stickers */}
            <div className="flex items-center gap-1 ml-1">
              {['🚀', '⭐', '✨', '🍕'].map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => addSticker(emoji)}
                  title={`Stamp ${emoji}`}
                  className="p-1 rounded-md hover:bg-slate-100 text-sm cursor-pointer"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Canvas Workspace */}
        <div className="flex-1 bg-slate-100 p-2 sm:p-4 overflow-hidden flex items-center justify-center">
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className="w-full h-full bg-white rounded-2xl shadow-md border border-slate-200 cursor-crosshair touch-none"
          />
        </div>
      </div>
    </div>
  );
};
