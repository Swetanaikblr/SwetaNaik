import React, { useState } from 'react';
import {
  Plus,
  BookOpen,
  Link2,
  FileText,
  Image as ImageIcon,
  Camera,
  Trash2,
  ExternalLink,
  Sparkles,
  ChevronRight,
  FolderOpen,
} from 'lucide-react';
import { LearningMaterial, Subject, MaterialType } from '../../types';

interface LearningMaterialsTabProps {
  materials: LearningMaterial[];
  subjects: Subject[];
  onAddMaterial: (newMat: Omit<LearningMaterial, 'id' | 'createdAt'>) => void;
  onDeleteMaterial: (id: string) => void;
}

export const LearningMaterialsTab: React.FC<LearningMaterialsTabProps> = ({
  materials,
  subjects,
  onAddMaterial,
  onDeleteMaterial,
}) => {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // Add Material Form State
  const [formSubjectId, setFormSubjectId] = useState(subjects[0]?.id || 'math');
  const [formChapter, setFormChapter] = useState('');
  const [formTopic, setFormTopic] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formType, setFormType] = useState<MaterialType>('pdf');
  const [formUrl, setFormUrl] = useState('');
  const [formContentText, setFormContentText] = useState('');
  const [isExtractingOcr, setIsExtractingOcr] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const filteredMaterials =
    selectedSubjectId === 'all'
      ? materials
      : materials.filter((m) => m.subjectId === selectedSubjectId);

  const handleSimulatePhotoUpload = async (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      setPreviewImage(base64);
      setIsExtractingOcr(true);

      try {
        const res = await fetch('/api/ocr-extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: base64,
            fallbackTopic: formTopic || 'Extracted Topic',
          }),
        });
        const data = await res.json();
        if (data.extractedText) {
          setFormContentText(data.extractedText);
          if (data.topic && !formTopic) setFormTopic(data.topic);
          if (data.chapter && !formChapter) setFormChapter(data.chapter);
          if (data.summary && !formTitle) setFormTitle(data.chapter || data.topic);
        }
      } catch (err) {
        console.error('OCR Extraction error:', err);
      } finally {
        setIsExtractingOcr(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formChapter.trim()) return;

    onAddMaterial({
      subjectId: formSubjectId,
      chapter: formChapter,
      topic: formTopic || 'Key Concepts',
      title: formTitle,
      type: formType,
      url: formUrl || undefined,
      contentText: formContentText || 'Textbook excerpt digitized for AI reference.',
      imageUrl: previewImage || undefined,
      summary: formContentText.slice(0, 100) + '...',
    });

    // Reset & close
    setShowAddModal(false);
    setFormChapter('');
    setFormTopic('');
    setFormTitle('');
    setFormUrl('');
    setFormContentText('');
    setPreviewImage(null);
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Header & Add Button */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 rounded-3xl p-5 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
              My Child's Learning
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900">
            Textbooks, Notes & Learning Materials
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Organized by Subject → Chapter → Topic. The AI assistant uses these as its source of truth.
          </p>
        </div>

        <button
          id="btn-add-material-open"
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-xs active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add Learning Material</span>
        </button>
      </div>

      {/* Subject Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setSelectedSubjectId('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
            selectedSubjectId === 'all'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
          }`}
        >
          All Subjects ({materials.length})
        </button>
        {subjects.map((sub) => {
          const count = materials.filter((m) => m.subjectId === sub.id).length;
          return (
            <button
              key={sub.id}
              onClick={() => setSelectedSubjectId(sub.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 ${
                selectedSubjectId === sub.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span>{sub.name}</span>
              <span className="text-[10px] opacity-75">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Organized Materials List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {filteredMaterials.map((mat) => {
          const subject = subjects.find((s) => s.id === mat.subjectId);
          return (
            <div
              key={mat.id}
              className="bg-white border border-slate-200/90 rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col justify-between hover:border-blue-300 transition-all"
            >
              <div>
                {/* Hierarchy Breadcrumb: Subject -> Chapter -> Topic */}
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 mb-2 truncate">
                  <span className="text-blue-600 uppercase">{subject?.name || 'General'}</span>
                  <ChevronRight className="w-3 h-3 text-slate-400" />
                  <span className="text-slate-700 truncate">{mat.chapter}</span>
                  <ChevronRight className="w-3 h-3 text-slate-400" />
                  <span className="text-slate-500 truncate">{mat.topic}</span>
                </div>

                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                    {mat.title}
                  </h3>
                  <span className="text-[10px] uppercase font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md shrink-0">
                    {mat.type}
                  </span>
                </div>

                {mat.imageUrl && (
                  <div className="w-full h-32 rounded-xl overflow-hidden bg-slate-100 mb-3 border border-slate-200">
                    <img
                      src={mat.imageUrl}
                      alt={mat.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed mb-3">
                  {mat.contentText}
                </p>
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                {mat.url ? (
                  <a
                    href={mat.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <span>View Link</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span className="text-slate-400 text-[11px]">
                    Indexed for AI tutor
                  </span>
                )}

                <button
                  onClick={() => onDeleteMaterial(mat.id)}
                  title="Remove material"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Material Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 animate-fadeIn">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                Add Learning Material
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-5 overflow-y-auto space-y-4">
              {/* Method selector */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  How would you like to add material?
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'link', label: 'Link / URL', icon: Link2 },
                    { id: 'pdf', label: 'Upload PDF', icon: FileText },
                    { id: 'photo', label: 'Photo / Page', icon: ImageIcon },
                    { id: 'notes', label: 'Class Notes', icon: BookOpen },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setFormType(m.id as MaterialType)}
                      className={`p-2.5 rounded-xl border text-center flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
                        formType === m.id
                          ? 'bg-blue-50 border-blue-400 text-blue-700 font-bold'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <m.icon className="w-4 h-4" />
                      <span className="text-[10px] leading-tight">{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Subject</label>
                <select
                  value={formSubjectId}
                  onChange={(e) => setFormSubjectId(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Chapter & Topic */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Chapter Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Chapter 4: Linear Equations"
                    value={formChapter}
                    onChange={(e) => setFormChapter(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Topic</label>
                  <input
                    type="text"
                    placeholder="e.g. Solving Word Problems"
                    value={formTopic}
                    onChange={(e) => setFormTopic(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Title / Description
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Exercises 1–10 & Formula Sheet"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              {/* URL field if link */}
              {formType === 'link' && (
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Textbook or Resource URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://khanacademy.org/..."
                    value={formUrl}
                    onChange={(e) => setFormUrl(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
              )}

              {/* Photo or Note Upload with OCR */}
              {(formType === 'photo' || formType === 'notes' || formType === 'pdf') && (
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Upload File / Take Picture (Text Extraction Enabled)
                  </label>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleSimulatePhotoUpload(file);
                    }}
                    className="w-full text-xs file:mr-2 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                  />
                  {isExtractingOcr && (
                    <div className="flex items-center gap-2 text-xs text-blue-600 mt-2">
                      <Sparkles className="w-3.5 h-3.5 animate-spin" />
                      <span>Extracting readable text via Gemini OCR...</span>
                    </div>
                  )}
                </div>
              )}

              {/* Content Textarea */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Extracted Text / Key Concepts (Used by AI Guide)
                </label>
                <textarea
                  rows={4}
                  placeholder="Paste or review textbook problems, hints, or formula definitions here..."
                  value={formContentText}
                  onChange={(e) => setFormContentText(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer shadow-xs"
                >
                  Save Material
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
