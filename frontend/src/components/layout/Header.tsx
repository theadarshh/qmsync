import { UserArea } from "./UserArea";

export function Header({
  sectionLabel,
  navOpen,
  onToggleNav,
}: {
  sectionLabel: string;
  navOpen: boolean;
  onToggleNav: () => void;
}) {
  return (
    <header className="topbar">
      <button
        type="button"
        className="topbar__menu"
        aria-controls="primary-navigation"
        aria-expanded={navOpen}
        onClick={onToggleNav}
      >
        <span className="topbar__menu-icon" aria-hidden="true" />
        <span className="sr-only">{navOpen ? "Close navigation" : "Open navigation"}</span>
      </button>
      <p className="topbar__section">{sectionLabel}</p>
      <UserArea />
    </header>
  );
}
