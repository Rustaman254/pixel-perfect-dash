import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Failed to find the root element");

// Diagnostics: If you see this, the entry point is working!
console.log("Insights App Mounting...");

createRoot(rootElement).render(<App />);
