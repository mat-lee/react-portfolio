export function Callout({ type = "note", title, children }) {
  return (
    <aside className={`callout callout-${type}`}>
      <div className="callout-title">{title ?? type}</div>
      {children}
    </aside>
  );
}
