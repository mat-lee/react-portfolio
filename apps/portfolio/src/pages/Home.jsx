// The cranes are rendered by Scene3D (mounted in App.jsx) so they persist
// across route changes instead of remounting with this page.
export function Home() {
  return <div className="w-full h-full pointer-events-none" />;
}
