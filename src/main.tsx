import "./init.js";
import ReactDOM from "react-dom/client";
import App from "./components/App.tsx";
import "./index.css";
import { StrictMode } from "react";
import { Buffer } from "buffer";
globalThis.Buffer = Buffer;
ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
