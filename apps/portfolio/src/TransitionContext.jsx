import { createContext, useContext } from "react";

// Lets a page arbitrarily deep (About/Labs' own Back button) trigger the
// kami transition without prop-drilling it down from App.jsx, which owns
// the overlay itself.
const TransitionContext = createContext(undefined);

export function TransitionProvider({ triggerKami, children }) {
  return <TransitionContext.Provider value={{ triggerKami }}>{children}</TransitionContext.Provider>;
}

export function useTransition() {
  const ctx = useContext(TransitionContext);
  if (!ctx) throw new Error("useTransition must be used within TransitionProvider");
  return ctx;
}
