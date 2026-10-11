export function AuthCard({ title, intro, children }: { title: string; intro?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="band" style={{ padding: "64px 16px" }}>
      <div className="panel stack" style={{ maxWidth: 460, margin: "0 auto", gap: 20 }}>
        <h1 className="display" style={{ fontSize: 32 }}>{title}</h1>
        {intro && <div className="muted" style={{ lineHeight: 1.6 }}>{intro}</div>}
        {children}
      </div>
    </div>
  );
}
