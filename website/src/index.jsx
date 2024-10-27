import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "@root/src/App";
import { Auth0ProviderWithNavigate } from "providers/Auth0ProviderWithNavigate";
import SettingsProvider from "providers/SettingsProvider";
import { MapProvider } from "react-map-gl";
import "./styles/styles.css";

const container = document.getElementById("root");
const root = createRoot(container);

root.render(
  <StrictMode>
    <BrowserRouter>
      <MapProvider>
        <SettingsProvider>
          <Auth0ProviderWithNavigate>
            <App />
          </Auth0ProviderWithNavigate>
        </SettingsProvider>
      </MapProvider>
    </BrowserRouter>
  </StrictMode>
);
