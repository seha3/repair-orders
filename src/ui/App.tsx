import { useEffect } from "react";
import { ensureAppState } from "../infrastructure/storage/initAppState";
import { AppRouter } from "../ui/router/AppRouter";

export default function App() {
  useEffect(() => {
    ensureAppState();
  }, []);

  return <AppRouter />;
}
