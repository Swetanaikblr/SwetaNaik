import { useStore } from '../store/useStore';
import { Modal } from './Modal';

/** Calm interstitial for anything external. Prototype only: it never navigates. */
export function ExternalInterstitial() {
  const external = useStore((s) => s.external);
  const set = useStore((s) => s.set);
  if (!external) return null;
  const close = () => set({ external: null });
  return (
    <Modal title="This opens outside CII" onClose={close}>
      <p className="text-ink">
        <span className="font-semibold">{external.name}</span> would open outside CII. Things out there have their own links and suggestions.
      </p>
      <p className="mt-2 text-sm text-muted">Prototype only: nothing will actually open.</p>
      <div className="mt-5 flex flex-wrap justify-end gap-3">
        <button className="btn-primary" onClick={close}>Stay in CII</button>
        <button className="btn-ghost" onClick={close}>Continue (does nothing here)</button>
      </div>
    </Modal>
  );
}
