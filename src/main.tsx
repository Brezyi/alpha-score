import { createRoot } from "react-dom/client";
import { Capacitor } from "@capacitor/core";
import App from "./App.tsx";
import "./index.css";

// Initialize app
const initApp = async () => {
  // Add platform-specific classes to document
  const platform = Capacitor.getPlatform();
  const isNative = Capacitor.isNativePlatform();
  
  document.documentElement.classList.add(`platform-${platform}`);
  if (isNative) {
    document.documentElement.classList.add("native-app");
  }

  // Render the app
  createRoot(document.getElementById("root")!).render(<App />);
};

initApp();
