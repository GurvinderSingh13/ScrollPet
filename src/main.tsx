import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Global error handling to catch crashes during hydration/render
if (typeof window !== "undefined") {
  window.onerror = function(message, source, lineno, colno, error) {
    console.error("GLOBAL ERROR CAUGHT:", message, source, lineno, colno, error);
    // You could optionally show a UI overlay here if ErrorBoundary fails
  };

  window.onunhandledrejection = function(event) {
    console.error("UNHANDLED REJECTION:", event.reason);
  };
}

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Failed to find root element with id 'root'. Check index.html.");
}

createRoot(rootElement).render(<App />);
