import { useDocumentMeta } from "../lib/useDocumentMeta";

// The cranes are rendered by Scene3D (mounted in App.jsx) so they persist
// across route changes instead of remounting with this page.
export function Home() {
  useDocumentMeta(
    "Matthew Lee",
    "Matthew Lee — Computer Science & Mathematics student at UNC Chapel Hill, building ML/RL systems. Projects, writeups, and contact."
  );
  return <div className="w-full h-full pointer-events-none" />;
}
