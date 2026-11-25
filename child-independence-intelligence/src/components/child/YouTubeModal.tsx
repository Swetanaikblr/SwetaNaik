import React, { useState } from 'react';
import { X, Play, Clock, Sparkles, CheckCircle2 } from 'lucide-react';
import { YouTubeItem } from '../../types';
import { approvedYouTubeVideos } from '../../data/initialData';

interface YouTubeModalProps {
  onClose: () => void;
  onLogWatch?: (title: string) => void;
}

export const YouTubeModal: React.FC<YouTubeModalProps> = ({ onClose, onLogWatch }) => {
  const [selectedVideo, setSelectedVideo] = useState<YouTubeItem>(approvedYouTubeVideos[0]);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleSelectVideo = (vid: YouTubeItem) => {
    setSelectedVideo(vid);
    setIsPlaying(true);
    if (onLogWatch) {
      onLogWatch(vid.title);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-fadeIn">
      <div className="bg-white w-full max-w-4xl h-[90vh] max-h-[800px] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center text-sm font-bold">
              ▶️
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">Approved Watch Space</h2>
              <p className="text-[11px] text-slate-500">Curated educational & curiosity channels</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Player & Selection */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Main Player */}
          <div className="flex-1 bg-black flex flex-col justify-center items-center relative overflow-hidden">
            {selectedVideo && isPlaying ? (
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${selectedVideo.videoId}?autoplay=1&rel=0`}
                title={selectedVideo.title}
                className="w-full h-full border-none"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="relative w-full h-full flex items-center justify-center bg-slate-950">
                <img
                  src={selectedVideo.thumbnail}
                  alt={selectedVideo.title}
                  className="absolute inset-0 w-full h-full object-cover opacity-40 blur-xs"
                />
                <div className="relative z-10 text-center p-6 max-w-md">
                  <div className="w-16 h-16 rounded-3xl bg-rose-600 text-white flex items-center justify-center mx-auto mb-4 shadow-xl cursor-pointer hover:scale-105 transition-transform"
                    onClick={() => {
                      setIsPlaying(true);
                      if (onLogWatch) onLogWatch(selectedVideo.title);
                    }}
                  >
                    <Play className="w-8 h-8 fill-current ml-1" />
                  </div>
                  <h3 className="text-white text-base sm:text-lg font-bold mb-2">
                    {selectedVideo.title}
                  </h3>
                  <p className="text-slate-300 text-xs">{selectedVideo.channel} • {selectedVideo.duration}</p>
                </div>
              </div>
            )}
          </div>

          {/* Playlist Sidebar */}
          <div className="w-full md:w-80 lg:w-88 border-t md:border-t-0 md:border-l border-slate-200 bg-slate-50 flex flex-col overflow-hidden">
            <div className="p-3 border-b border-slate-200 bg-white">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Parent-Approved Videos ({approvedYouTubeVideos.length})
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {approvedYouTubeVideos.map((vid) => (
                <div
                  key={vid.id}
                  onClick={() => handleSelectVideo(vid)}
                  className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex gap-2.5 ${
                    selectedVideo.id === vid.id
                      ? 'bg-rose-50/80 border-rose-300 shadow-xs'
                      : 'bg-white border-slate-200/80 hover:border-slate-300'
                  }`}
                >
                  <div className="w-20 h-14 rounded-xl overflow-hidden bg-slate-200 relative shrink-0">
                    <img
                      src={vid.thumbnail}
                      alt={vid.title}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[9px] px-1 rounded-sm font-mono">
                      {vid.duration}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-800 line-clamp-2 leading-tight">
                      {vid.title}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">{vid.channel}</p>
                    {vid.subject && (
                      <span className="inline-block mt-1 text-[9px] font-semibold text-rose-700 bg-rose-100/70 px-1.5 py-0.2 rounded-sm">
                        {vid.subject}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
