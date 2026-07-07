import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { storyblokInit, apiPlugin } from "@storyblok/react";
import { Page, Teaser, Feature, Grid } from "./storyblok/index.ts";
import "./styles.css";

storyblokInit({
  accessToken: import.meta.env.VITE_STORYBLOK_DELIVERY_API_TOKEN,
  use: [apiPlugin],
  apiOptions: {
    region: import.meta.env.VITE_STORYBLOK_REGION,
  },
  bridge: true,
  components: {
    page: Page,
    teaser: Teaser,
    feature: Feature,
    grid: Grid,
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
