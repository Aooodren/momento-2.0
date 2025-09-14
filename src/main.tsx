
  import { createRoot } from "react-dom/client";
  import App from "./App.tsx";
  import "./index.css";
  import { SpeedInsights } from "@vercel/speed-insights/react";
  import { NotificationProvider } from "./components/ui/notifications";

  createRoot(document.getElementById("root")!).render(
    <>
      <NotificationProvider>
        <App />
        <SpeedInsights />
      </NotificationProvider>
    </>
  );
  