import { AppShell } from "./components/layout/AppShell";
import { findModuleByPath } from "./navigation/modules";
import { DashboardPage } from "./pages/DashboardPage";
import { ModulePage } from "./pages/ModulePage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { normalizePath } from "./router/match";
import { useRoute } from "./router/Router";

export function AppRoutes() {
  const { path } = useRoute();
  const current = normalizePath(path);

  if (current === "/") {
    return (
      <AppShell sectionLabel="Dashboard">
        <DashboardPage />
      </AppShell>
    );
  }

  const entry = findModuleByPath(current);
  if (entry) {
    return (
      <AppShell sectionLabel={entry.label}>
        <ModulePage entry={entry} />
      </AppShell>
    );
  }

  return (
    <AppShell sectionLabel="Page not found">
      <NotFoundPage />
    </AppShell>
  );
}
