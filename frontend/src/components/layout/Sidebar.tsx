import { DASHBOARD_PATH, NAV_GROUPS, modulesInGroup } from "../../navigation/modules";
import { NavLink } from "../../router/Router";
import { Icon } from "../ui/Icon";

export function Sidebar({ open, onNavigate }: { open: boolean; onNavigate: () => void }) {
  return (
    <aside className="sidebar" data-open={open}>
      <div className="sidebar__brand">
        <span className="sidebar__logo" aria-hidden="true">
          Q
        </span>
        <span className="sidebar__name">QMSync</span>
      </div>
      <nav id="primary-navigation" className="sidebar__nav" aria-label="Primary">
        <ul className="nav-list">
          <li>
            <NavLink to={DASHBOARD_PATH} className="nav-link" onClick={onNavigate}>
              <Icon name="dashboard" />
              <span>Dashboard</span>
            </NavLink>
          </li>
        </ul>
        {NAV_GROUPS.map((group) => (
          <div key={group.id} className="nav-group">
            <h2 className="nav-group__label">{group.label}</h2>
            <ul className="nav-list">
              {modulesInGroup(group.id).map((entry) => (
                <li key={entry.id}>
                  <NavLink to={entry.path} className="nav-link" onClick={onNavigate}>
                    <Icon name={entry.icon} />
                    <span>{entry.label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
      <p className="sidebar__footer">Milestone 1: application shell</p>
    </aside>
  );
}
