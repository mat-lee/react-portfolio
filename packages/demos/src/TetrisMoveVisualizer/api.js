const getApiUrl = () => {
  // Check for Vite env var
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  // Development fallback - direct to API server (CORS configured for localhost)
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:8000';
  }
  // Production fallback
  return 'https://api.codebymatthewlee.com';
};

export const API_BASE_URL = getApiUrl();

export async function generateMoves(board, piece, algorithm) {
  const res = await fetch(`${API_BASE_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ board, piece, algorithm }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
