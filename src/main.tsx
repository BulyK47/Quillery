import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ThemeProvider } from "./hooks/useTheme";
import { ErrorBoundary } from "./components/ErrorBoundary";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="system">
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </ThemeProvider>
  </React.StrictMode>,
);
