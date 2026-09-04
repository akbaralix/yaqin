import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { FeedProvider } from "./context/FeedContext";
import { DataCacheProvider } from "./context/DataCacheContext";
import { NotificationProvider } from "./context/NotificationContext";
import "./index.css";
import "./App.css";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <FeedProvider>
            <DataCacheProvider>
              <App />
            </DataCacheProvider>
          </FeedProvider>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);

