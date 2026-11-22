/** Small corner badge marking Phase 2 screens as UI previews with mock data. */
export function PreviewBanner({ note = 'Mock data — not connected to the backend yet' }: { note?: string }) {
  return (
    <p className="p2-badge" role="note" title={note}>
      <span className="p2-badge-dot" aria-hidden="true" />
      <strong>Phase 2 preview</strong>
      <span className="p2-badge-note">{note}</span>
    </p>
  );
}
