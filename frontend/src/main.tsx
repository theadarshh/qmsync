import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AppRoutes } from "./App";
import { Router } from "./router/Router";
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/layout.css";
import "./styles/components.css";

const container = document.getElementById("root");
if (container === null) {
  throw new Error("The #root element is missing from index.html.");
}

createRoot(container).render(
  <StrictMode>
    <Router>
      <AppRoutes />
    </Router>
  </StrictMode>,
);
