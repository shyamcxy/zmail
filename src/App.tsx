import { useEffect } from "react";
import { useMailStore } from "./stores/mailStore";
import { AppShell } from "./components/layout/AppShell";

export function App() {
  const init = useMailStore((state) => state.init);
  const setComposeOpen = useMailStore((state) => state.setComposeOpen);

  useEffect(() => {
    init();

    const handleKeyDown = (e: KeyboardEvent) => {
      // Global shortcut: 'c' opens compose (when not in input)
      if (
        e.key.toLowerCase() === "c" &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        setComposeOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [init, setComposeOpen]);

  return <AppShell />;
}

export default App;
