import React, { useState } from 'react';
import { X, Calculator, BookOpen, ExternalLink, Sparkles, Plus, Minus, X as Multiply, Divide } from 'lucide-react';
import { ApprovedApp } from '../../types';

interface ExploreAppsModalProps {
  onClose: () => void;
  approvedApps: ApprovedApp[];
}

export const ExploreAppsModal: React.FC<ExploreAppsModalProps> = ({ onClose, approvedApps }) => {
  const [activeTab, setActiveTab] = useState<'calc' | 'reading' | 'apps'>('calc');

  // Calculator State
  const [calcDisplay, setCalcDisplay] = useState('0');
  const [calcPrev, setCalcPrev] = useState<number | null>(null);
  const [calcOp, setCalcOp] = useState<string | null>(null);

  const handleDigit = (digit: string) => {
    setCalcDisplay((prev) => (prev === '0' ? digit : prev + digit));
  };

  const handleOp = (op: string) => {
    setCalcPrev(parseFloat(calcDisplay));
    setCalcOp(op);
    setCalcDisplay('0');
  };

  const handleEqual = () => {
    if (calcPrev === null || !calcOp) return;
    const current = parseFloat(calcDisplay);
    let result = 0;
    if (calcOp === '+') result = calcPrev + current;
    if (calcOp === '-') result = calcPrev - current;
    if (calcOp === '×') result = calcPrev * current;
    if (calcOp === '÷') result = current !== 0 ? calcPrev / current : 0;
    setCalcDisplay(result.toString());
    setCalcPrev(null);
    setCalcOp(null);
  };

  const clearCalc = () => {
    setCalcDisplay('0');
    setCalcPrev(null);
    setCalcOp(null);
  };

  const articles = [
    {
      title: 'How Stars Are Born & Where Elements Come From',
      topic: 'Astronomy & Physics',
      readTime: '3 min read',
      snippet:
        'Every single atom of calcium in your bones and iron in your blood was forged inside the heart of an ancient exploding star billions of years ago...',
    },
    {
      title: 'The Mystery of Zero: How Ancient Mathematicians Invented Nothing',
      topic: 'History of Math',
      readTime: '4 min read',
      snippet:
        'Before the concept of zero was invented in ancient India by Brahmagupta, mathematicians struggled to do complex multiplication or represent empty placeholders...',
    },
    {
      title: 'How Your Body Converts a Slice of Pizza into Pure Energy',
      topic: 'Human Biology',
      readTime: '3 min read',
      snippet:
        'From the moment salivary amylase begins touching the crust in your mouth to cellular respiration in mitochondria, your cells break carbohydrates into ATP molecules...',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-fadeIn">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 max-h-[85vh]">
        {/* Header */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-600 text-white flex items-center justify-center text-sm font-bold">
              🔍
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">Explore Space</h2>
              <p className="text-[11px] text-slate-500">Calculator, quick reads & approved apps</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 text-xs">
              <button
                onClick={() => setActiveTab('calc')}
                className={`px-3 py-1 rounded-lg font-semibold cursor-pointer transition-all ${
                  activeTab === 'calc' ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-600'
                }`}
              >
                Calculator
              </button>
              <button
                onClick={() => setActiveTab('reading')}
                className={`px-3 py-1 rounded-lg font-semibold cursor-pointer transition-all ${
                  activeTab === 'reading' ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-600'
                }`}
              >
                Reading Nook
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-5 overflow-y-auto">
          {activeTab === 'calc' && (
            <div className="max-w-xs mx-auto bg-slate-900 rounded-3xl p-5 shadow-xl text-white">
              {/* Display */}
              <div className="bg-slate-800/80 rounded-2xl p-4 mb-4 text-right">
                <span className="text-[11px] text-slate-400 block h-4">
                  {calcPrev !== null ? `${calcPrev} ${calcOp || ''}` : ''}
                </span>
                <span className="font-mono text-3xl font-bold tracking-wider truncate block">
                  {calcDisplay}
                </span>
              </div>

              {/* Grid buttons */}
              <div className="grid grid-cols-4 gap-2">
                <button
                  onClick={clearCalc}
                  className="p-3 rounded-xl bg-slate-700 text-red-400 font-bold text-sm hover:bg-slate-600 cursor-pointer"
                >
                  C
                </button>
                <button
                  onClick={() => setCalcDisplay((p) => (parseFloat(p) * -1).toString())}
                  className="p-3 rounded-xl bg-slate-700 text-slate-200 font-bold text-sm hover:bg-slate-600 cursor-pointer"
                >
                  ±
                </button>
                <button
                  onClick={() => setCalcDisplay((p) => (parseFloat(p) / 100).toString())}
                  className="p-3 rounded-xl bg-slate-700 text-slate-200 font-bold text-sm hover:bg-slate-600 cursor-pointer"
                >
                  %
                </button>
                <button
                  onClick={() => handleOp('÷')}
                  className="p-3 rounded-xl bg-cyan-600 text-white font-bold text-base hover:bg-cyan-500 cursor-pointer"
                >
                  ÷
                </button>

                {['7', '8', '9'].map((n) => (
                  <button
                    key={n}
                    onClick={() => handleDigit(n)}
                    className="p-3 rounded-xl bg-slate-800 text-white font-bold text-sm hover:bg-slate-700 cursor-pointer"
                  >
                    {n}
                  </button>
                ))}
                <button
                  onClick={() => handleOp('×')}
                  className="p-3 rounded-xl bg-cyan-600 text-white font-bold text-base hover:bg-cyan-500 cursor-pointer"
                >
                  ×
                </button>

                {['4', '5', '6'].map((n) => (
                  <button
                    key={n}
                    onClick={() => handleDigit(n)}
                    className="p-3 rounded-xl bg-slate-800 text-white font-bold text-sm hover:bg-slate-700 cursor-pointer"
                  >
                    {n}
                  </button>
                ))}
                <button
                  onClick={() => handleOp('-')}
                  className="p-3 rounded-xl bg-cyan-600 text-white font-bold text-base hover:bg-cyan-500 cursor-pointer"
                >
                  -
                </button>

                {['1', '2', '3'].map((n) => (
                  <button
                    key={n}
                    onClick={() => handleDigit(n)}
                    className="p-3 rounded-xl bg-slate-800 text-white font-bold text-sm hover:bg-slate-700 cursor-pointer"
                  >
                    {n}
                  </button>
                ))}
                <button
                  onClick={() => handleOp('+')}
                  className="p-3 rounded-xl bg-cyan-600 text-white font-bold text-base hover:bg-cyan-500 cursor-pointer"
                >
                  +
                </button>

                <button
                  onClick={() => handleDigit('0')}
                  className="col-span-2 p-3 rounded-xl bg-slate-800 text-white font-bold text-sm hover:bg-slate-700 cursor-pointer"
                >
                  0
                </button>
                <button
                  onClick={() => handleDigit('.')}
                  className="p-3 rounded-xl bg-slate-800 text-white font-bold text-sm hover:bg-slate-700 cursor-pointer"
                >
                  .
                </button>
                <button
                  onClick={handleEqual}
                  className="p-3 rounded-xl bg-emerald-500 text-white font-bold text-base hover:bg-emerald-400 cursor-pointer"
                >
                  =
                </button>
              </div>
            </div>
          )}

          {activeTab === 'reading' && (
            <div className="space-y-3">
              {articles.map((art, idx) => (
                <div
                  key={idx}
                  className="bg-slate-50 border border-slate-200 p-4 rounded-2xl hover:border-cyan-300 transition-all"
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[10px] font-bold text-cyan-700 bg-cyan-100/70 px-2 py-0.5 rounded-full">
                      {art.topic}
                    </span>
                    <span className="text-[11px] text-slate-400">{art.readTime}</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mb-1">{art.title}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">{art.snippet}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
