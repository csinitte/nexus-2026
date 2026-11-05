/** Re-mounts on every navigation so each page gets a short fade-in transition. */
export default function SiteTemplate({ children }: { children: React.ReactNode }) {
  return <div className="page-transition">{children}</div>;
}
