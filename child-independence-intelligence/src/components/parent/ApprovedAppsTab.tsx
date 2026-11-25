import React, { useState } from 'react';
import { ShieldCheck, Check, Plus, Trash2, ExternalLink, Clock, PlaySquare } from 'lucide-react';
import { ApprovedApp, YouTubeItem } from '../../types';
import { approvedYouTubeVideos as initialVideos } from '../../data/initialData';

interface ApprovedAppsTabProps {
  approvedApps: ApprovedApp[];
  onToggleApp: (id: string, isAllowed: boolean) => void;
}

export const ApprovedAppsTab: React.FC<ApprovedAppsTabProps> = ({ approvedApps, onToggleApp }) => {
  const [videos, setVideos] = useState<YouTubeItem[]>(initialVideos);
  const [newVideoTitle, setNewVideoTitle] = useState('');
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [newVideoChannel, setNewVideoChannel] = useState('');
  const [showAddVideo, setShowAddVideo] = useState(false);

  const handleAddVideo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVideoTitle || !newVideoUrl) return;

    // Extract ID if youtube link
    let vidId = 'dQw4w9WgXcQ';
    const match = newVideoUrl.match(/(?:v=|\/embed\/|youtu\.be\/)([\w-]{11})/);
    if (match && match[1]) vidId = match[1];

    const newEntry: YouTubeItem = {
      id: `yt-${Date.now()}`,
      title: newVideoTitle,
      channel: newVideoChannel || 'Educational Resource',
      videoId: vidId,
      thumbnail: `https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=400&q=80`,
      duration: '10:00',
      allowed: true,
    };

    setVideos((v) => [...v, newEntry]);
    setShowAddVideo(false);
    setNewVideoTitle('');
    setNewVideoUrl('');
    setNewVideoChannel('');
  };

  const handleDeleteVideo = (id: string) => {
    setVideos((v) => v.filter((item) => item.id !== id));
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
            Boundaries & Freedoms
          </span>
        </div>
        <h2 className="text-lg sm:text-xl font-bold text-slate-900">
          Approved Apps & Safe Curiosity Channels
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          "Freedom within parent-defined boundaries." Your child can explore, draw, and watch without supervision inside this sandbox.
        </p>
      </div>

      {/* App permissions grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
        {approvedApps.map((app) => (
          <div
            key={app.id}
            className={`p-4 rounded-3xl border transition-all flex flex-col justify-between ${
              app.isAllowed
                ? 'bg-white border-slate-200/90 shadow-2xs'
                : 'bg-slate-50 border-slate-200 opacity-60'
            }`}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{app.icon}</span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 leading-tight">{app.name}</h3>
                  <span className="text-[10px] text-slate-500 uppercase">{app.category}</span>
                </div>
              </div>

              {/* Toggle switch */}
              <button
                onClick={() => onToggleApp(app.id, !app.isAllowed)}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                  app.isAllowed ? 'bg-purple-600' : 'bg-slate-300'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                    app.isAllowed ? 'right-1' : 'left-1'
                  }`}
                />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-3">
              {app.description || 'Child safe tool'}
            </p>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span>{app.isAllowed ? 'Enabled for child' : 'Disabled'}</span>
              {app.timeLimitMinutes && <span>Limit: {app.timeLimitMinutes}m / day</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Curated YouTube Whitelist */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900">
              Whitelisted YouTube Channels & Videos
            </h3>
            <p className="text-xs text-slate-500">
              Embedded in a distraction-free player. No external recommendations or comment sections.
            </p>
          </div>

          <button
            onClick={() => setShowAddVideo(true)}
            className="px-3.5 py-1.5 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Video</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {videos.map((vid) => (
            <div
              key={vid.id}
              className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2.5"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-12 h-9 rounded-lg bg-slate-200 overflow-hidden relative shrink-0">
                  <img
                    src={vid.thumbnail}
                    alt={vid.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-800 truncate">{vid.title}</p>
                  <p className="text-[11px] text-slate-500">{vid.channel}</p>
                </div>
              </div>

              <button
                onClick={() => handleDeleteVideo(vid.id)}
                title="Remove video"
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Add Video Modal */}
      {showAddVideo && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 animate-fadeIn">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Add Whitelisted YouTube Video</h3>
            <form onSubmit={handleAddVideo} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. How Space Stations Work"
                  value={newVideoTitle}
                  onChange={(e) => setNewVideoTitle(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">YouTube URL or ID</label>
                <input
                  type="text"
                  required
                  placeholder="https://youtube.com/watch?v=..."
                  value={newVideoUrl}
                  onChange={(e) => setNewVideoUrl(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Channel Name</label>
                <input
                  type="text"
                  placeholder="e.g. SciShow / Veritasium"
                  value={newVideoChannel}
                  onChange={(e) => setNewVideoChannel(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-200"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddVideo(false)}
                  className="px-3 py-1.5 rounded-xl font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold cursor-pointer"
                >
                  Add Video
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
