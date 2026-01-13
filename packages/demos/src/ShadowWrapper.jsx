import { useRef, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

/**
 * ShadowWrapper - Renders children inside a Shadow DOM for style isolation.
 *
 * Why? Shadow DOM creates a boundary where CSS can't cross:
 * - Tailwind styles inside won't affect Docusaurus
 * - Docusaurus/Infima styles won't break our component
 *
 * @param {string} css - CSS to inject into the shadow root
 * @param {React.ReactNode} children - Component(s) to render inside
 */
export default function ShadowWrapper({ css, children }) {
  const hostRef = useRef(null);
  const shadowRootRef = useRef(null);
  const reactRootRef = useRef(null);
  const [mounted, setMounted] = useState(false);

  // Step 1: Create the shadow root (runs once on mount)
  useEffect(() => {
    if (hostRef.current && !shadowRootRef.current) {
      // Attach shadow DOM to our host div
      shadowRootRef.current = hostRef.current.attachShadow({ mode: 'open' });

      // Create a container div inside shadow for React to render into
      const container = document.createElement('div');
      shadowRootRef.current.appendChild(container);

      // Create React root inside shadow DOM
      reactRootRef.current = createRoot(container);

      setMounted(true);
    }

    // Cleanup on unmount
    return () => {
      if (reactRootRef.current) {
        reactRootRef.current.unmount();
      }
    };
  }, []);

  // Step 2: Render children into shadow DOM (runs when children/css change)
  useEffect(() => {
    if (mounted && reactRootRef.current) {
      reactRootRef.current.render(
        <>
          {/* Inject CSS into shadow DOM */}
          <style>{css}</style>
          {/* Render the actual component */}
          {children}
        </>
      );
    }
  }, [mounted, css, children]);

  // The host element - shadow DOM attaches to this
  return <div ref={hostRef} />;
}
