import "./App.css";
import AppRouter from "./Routes/Routes";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";
import { useEffect } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ensurePwaServiceWorker } from "./Hooks/pwa/usePWAInstall";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 10 * 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  // Register SW early so the site meets PWA install criteria
  useEffect(() => {
    ensurePwaServiceWorker();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AppRouter />
      <ToastContainer />
    </QueryClientProvider>
  );
}

export default App;
