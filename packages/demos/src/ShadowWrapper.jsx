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

  // Step 1: Create the shadow root (and a fresh React root inside it) on
  // mount.
  //
  // Under React StrictMode, mount effects run twice (mount, cleanup, mount
  // again, all synchronously in one tick) specifically to surface effects
  // that don't tolerate being re-run — this one didn't, in two ways:
  //
  // 1. It guarded shadow-root creation on `!shadowRootRef.current` but never
  //    cleared that ref (or reactRootRef.current) in cleanup, so the second
  //    mount pass skipped recreating anything while step 2 below still
  //    tried to `.render()` into the root cleanup had just unmounted
  //    ("Cannot update an unmounted root").
  // 2. Fixing that by unmounting synchronously in cleanup trades it for a
  //    different warning ("attempted to synchronously unmount a root while
  //    React was already rendering") — a nested root's unmount can't happen
  //    synchronously inside the parent root's own render/commit, which is
  //    exactly when this cleanup runs. Deferring the unmount to a
  //    microtask avoids that, but then the *next* mount pass (still in the
  //    same synchronous tick, before that microtask has run) would call
  //    `createRoot()` again on the same container while the old root hasn't
  //    actually unmounted yet, which React also rejects.
  //
  // Fix for both: never reuse a container across a remount — a fresh one
  // each time sidesteps the createRoot-on-an-active-container check
  // entirely, and unmounting the old (by then detached, but still valid to
  // clean up) root is deferred to a microtask so it lands after the parent
  // root's current render/commit finishes.
  useEffect(() => {
    if (!hostRef.current) return;

    if (!shadowRootRef.current) {
      shadowRootRef.current = hostRef.current.attachShadow({ mode: 'open' });
    }

    const container = document.createElement('div');
    shadowRootRef.current.replaceChildren(container);

    reactRootRef.current = createRoot(container);
    setMounted(true);

    return () => {
      const root = reactRootRef.current;
      reactRootRef.current = null;
      if (root) queueMicrotask(() => root.unmount());
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
