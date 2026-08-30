import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App";
import "./index.css";

import { ActivityProvider } from "./features/activity/ActivityContext";
import { AuthProvider } from "./contexts/AuthContext";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ActivityProvider>
          <App />
        </ActivityProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);