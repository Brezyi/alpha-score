import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Performance: Mark initial render time
if (typeof window !== 'undefined' && window.performance?.mark) {
  window.performance.mark('react-init');
}

// Disable console in production for performance
if (import.meta.env.PROD) {
  console.log = () => {};
  console.debug = () => {};
}

const container = document.getElementById("root");

if (container) {
  const root = createRoot(container);
  
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );
  
  // Performance: Mark when React has rendered
  if (typeof window !== 'undefined' && window.performance?.mark) {
    requestAnimationFrame(() => {
      window.performance.mark('react-rendered');
      try {
        window.performance.measure('react-startup', 'react-init', 'react-rendered');
      } catch {
        // Ignore
      }
    });
  }
}
