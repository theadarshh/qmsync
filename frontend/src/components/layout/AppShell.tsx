import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useRoute } from "../../router/Router";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

export function AppShell({ sectionLabel, children }: { sectionLabel: string; children: ReactNode }) {
  const [navOpen, setNavOpen] = useState(false);
  const { path } = useRoute();

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setNavOpen(false);
  }, [path]);

  // Escape closes the mobile drawer.
  useEffect(() => {
    if (!navOpen) {
      return undefined;
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setNavOpen(false);
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [navOpen]);

  const closeNav = useCallback(() => setNavOpen(false), []);
  const toggleNav = useCallback(() => setNavOpen((open) => !open), []);

  return (
    <div className="shell">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <Sidebar open={navOpen} onNavigate={closeNav} />
      {navOpen ? <button type="button" className="shell__scrim" aria-label="Close navigation" onClick={closeNav} /> : null}
      <div className="shell__body">
        <Header sectionLabel={sectionLabel} navOpen={navOpen} onToggleNav={toggleNav} />
        <main id="main-content" className="shell__main" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}
