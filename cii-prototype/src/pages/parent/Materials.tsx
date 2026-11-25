import { useRef, useState } from 'react';
import { ParentLayout } from '../../components/ParentLayout';
import { HonestNote, ReviewNote, SampleLabel } from '../../components/Badges';
import { Toggle } from '../../components/Toggle';
import { SUPPORTED_TYPES } from '../../data/materials';
import { newId, useStore } from '../../store/useStore';
import type { ImportStatus, Material } from '../../types';

const STATUS_CLS: Record<ImportStatus, string> = {
  Imported: 'bg-accent-soft text-accent',
  Importing: 'bg-sky-50 text-sky-800',
  Unsupported: 'bg-slate-100 text-slate-700',
  Failed: 'bg-red-50 text-danger',
};
const STATUS_MSG: Partial<Record<ImportStatus, string>> = {
  Unsupported: "This file type isn't supported in the prototype. Try PDF, text or an image.",
  Failed: "This file couldn't be imported. You could try adding it again.",
};

function guessFormat(name: string): Material['format'] {
  const n = name.toLowerCase();
  if (n.endsWith('.pdf')) return 'PDF';
  if (/notes?/.test(n)) return 'Notes';
  if (/list/.test(n)) return 'Reading list';
  return 'Other';
}

export default function Materials() {
  const materials = useStore((s) => s.materials);
  const addMaterial = useStore((s) => s.addMaterial);
  const updateMaterial = useStore((s) => s.updateMaterial);
  const removeMaterial = useStore((s) => s.removeMaterial);
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const onFile = (f: File | undefined) => {
    if (!f) return;
    // Only the file NAME and TYPE are kept. The file is never read or parsed.
    const supported = SUPPORTED_TYPES.includes(f.type);
    const id = newId();
    addMaterial({ id, title: f.name.slice(0, 80), format: guessFormat(f.name), fileType: f.type || 'unknown', importStatus: supported ? 'Importing' : 'Unsupported', availableToChild: false, isSample: false });
    setMsg(supported ? `Adding "${f.name}"…` : STATUS_MSG.Unsupported!);
    if (supported) {
      window.setTimeout(() => {
        updateMaterial(id, { importStatus: 'Imported' });
        setMsg(`"${f.name}" added. It's off for your child until you turn it on.`);
      }, 1500);
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <ParentLayout title="Learning Materials" status="existing" intro="Things your child can open in Study. They only see items you make available.">
      <div className="card">
        <div className="flex flex-wrap items-center gap-3">
          <input ref={fileRef} id="upload" type="file" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} />
          <label htmlFor="upload" className="btn-parent cursor-pointer">⬆️ Add a file (simulated)</label>
          <span className="text-sm text-muted">Only the name and type are stored, in this browser. Nothing is uploaded.</span>
        </div>
        {msg && <p role="status" className="mt-3 text-sm font-semibold text-parent">{msg}</p>}
        <HonestNote>Files are not automatically understood by AI.</HonestNote>
      </div>

      {materials.length === 0 ? (
        <p className="card mt-4 text-muted">No materials yet. Your child will see a friendly empty state in Study.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {materials.map((m) => (
            <li key={m.id} className="card flex flex-wrap items-center gap-4">
              <div className="min-w-[200px] flex-1">
                <p className="font-bold">{m.title} {m.isSample && <SampleLabel />}</p>
                <p className="text-sm text-muted">{m.format}{m.fileType ? ` · ${m.fileType}` : ''}</p>
                {STATUS_MSG[m.importStatus] && <p className="mt-1 text-sm text-danger">{STATUS_MSG[m.importStatus]}</p>}
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS_CLS[m.importStatus]}`}>{m.importStatus}</span>
              <div className="w-56">
                <Toggle
                  checked={m.availableToChild}
                  disabled={m.importStatus !== 'Imported'}
                  onChange={(v) => updateMaterial(m.id, { availableToChild: v })}
                  label="Available to child"
                />
              </div>
              {(m.importStatus === 'Failed' || m.importStatus === 'Unsupported') && (
                <button className="btn-ghost text-sm" onClick={() => removeMaterial(m.id)}>Remove</button>
              )}
            </li>
          ))}
        </ul>
      )}
      <ReviewNote>Upload is simulated: the file contents are never read. Uploaded items show a "can't show contents" message in Study. Content parsing, AI understanding and curriculum mapping are unvalidated.</ReviewNote>
    </ParentLayout>
  );
}
