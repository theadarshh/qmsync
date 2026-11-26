import { strict as assert } from "node:assert";
import { describe, test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { AppRoutes } from "./App";
import { createApiClient } from "./api/client";
import { ApiClientProvider } from "./api/context";
import { HealthStatusCard } from "./components/HealthStatusCard";
import { MODULES } from "./navigation/modules";
import { Router } from "./router/Router";
import type { HealthViewState } from "./state/healthState";

// Server-side rendering exercises real React components and the real route table without a DOM.
// Effects do not run during server rendering, so no network call happens here; the API client is
// given a fetch that fails the test if anything tries to use it.
function renderApp(path: string): string {
  const client = createApiClient({
    fetchImpl: async () => {
      throw new Error("The network must not be used while rendering.");
    },
  });
  return renderToStaticMarkup(
    <ApiClientProvider client={client}>
      <Router initialPath={path}>
        <AppRoutes />
      </Router>
    </ApiClientProvider>,
  );
}

function renderCard(state: HealthViewState): string {
  return renderToStaticMarkup(<HealthStatusCard state={state} onRefresh={() => undefined} />);
}

function count(haystack: string, needle: string): number {
  return haystack.split(needle).length - 1;
}

describe("application shell", () => {
  test("renders the page landmarks and a skip link", () => {
    const html = renderApp("/");

    assert.match(html, /<a class="skip-link" href="#main-content">Skip to main content<\/a>/);
    assert.match(html, /<nav[^>]*aria-label="Primary"/);
    assert.match(html, /<main[^>]*id="main-content"/);
    assert.match(html, /<header class="topbar">/);
    assert.match(html, /aria-controls="primary-navigation"/);
  });

  test("lists the dashboard and every planned module in the sidebar", () => {
    const html = renderApp("/");
    const nav = html.slice(html.indexOf("<nav"), html.indexOf("</nav>"));

    assert.equal(count(nav, 'class="nav-link'), MODULES.length + 1);
    for (const label of ["Dashboard", ...MODULES.map((entry) => entry.label)]) {
      assert.ok(nav.includes(`<span>${label}</span>`), `missing navigation label: ${label}`);
    }
    for (const entry of MODULES) {
      assert.ok(nav.includes(`href="${entry.path}"`), `missing navigation link: ${entry.path}`);
    }
    for (const group of ["Quality workflow", "Insights", "Administration"]) {
      assert.ok(nav.includes(group), `missing navigation group: ${group}`);
    }
  });

  test("marks only the current route with aria-current", () => {
    const html = renderApp("/ncmr");

    assert.equal(count(html, 'aria-current="page"'), 1);
    const link = /<a[^>]*href="\/ncmr"[^>]*>/.exec(html);
    assert.ok(link);
    assert.match(link[0], /aria-current="page"/);
    assert.match(link[0], /is-active/);
  });

  test("marks the dashboard link on the home route", () => {
    const html = renderApp("/");
    const link = /<a[^>]*href="\/"[^>]*>/.exec(html);

    assert.equal(count(html, 'aria-current="page"'), 1);
    assert.ok(link);
    assert.match(link[0], /aria-current="page"/);
  });

  test("the user area states that nobody is signed in", () => {
    const html = renderApp("/");

    assert.match(html, /Guest/);
    assert.match(html, /Not signed in\. Authentication is planned for Module B\./);
  });
});

describe("dashboard", () => {
  test("shows honest empty states instead of sample data", () => {
    const html = renderApp("/");

    assert.match(html, /<h1 class="page-header__title">Dashboard<\/h1>/);
    assert.match(html, /Nothing has been recorded yet/);
    assert.equal(count(html, 'class="kpi"'), 7);
    assert.equal(count(html, "No data yet."), 7);
    assert.match(html, /Checking the backend/);
  });

  test("lists the connected quality workflow in order", () => {
    const html = renderApp("/");
    const labels = [
      "Production Entry",
      "Rejection Recording",
      "Non-Conformance (NCMR)",
      "Corrective and Preventive Action (CAPA)",
      "Training",
      "Evidence Management",
      "Audit Center",
    ];
    const section = html.slice(html.indexOf('class="workflow"'));

    assert.equal(count(html, 'class="workflow__step"'), labels.length);
    let cursor = -1;
    for (const label of labels) {
      const position = section.indexOf(`>${label}</a>`);
      assert.ok(position > cursor, `workflow step missing or out of order: ${label}`);
      cursor = position;
    }
  });
});

describe("module placeholder pages", () => {
  test("state plainly that nothing is implemented", () => {
    const html = renderApp("/capa");

    assert.match(html, /<h1 class="page-header__title">CAPA<\/h1>/);
    assert.match(html, /CAPA is not implemented yet/);
    assert.match(html, /Module F: Corrective and Preventive Action \(CAPA\)/);
    assert.match(html, /Effectiveness verification/);
    assert.match(html, /badge--planned/);
    assert.equal(count(html, 'class="kpi"'), 0);
  });

  test("exist for every planned module", () => {
    for (const entry of MODULES) {
      const html = renderApp(entry.path);
      assert.ok(html.includes(`${entry.label} is not implemented yet`), `no placeholder for ${entry.path}`);
    }
  });

  test("treat a trailing slash as the same route", () => {
    assert.match(renderApp("/capa/"), /CAPA is not implemented yet/);
  });

  test("unknown routes render a not-found page inside the shell", () => {
    const html = renderApp("/does-not-exist");

    assert.match(html, /<h1 class="page-header__title">Page not found<\/h1>/);
    assert.match(html, /<nav[^>]*aria-label="Primary"/);
    assert.equal(count(html, 'aria-current="page"'), 0);
  });
});

describe("HealthStatusCard", () => {
  test("loading state disables the refresh button", () => {
    const html = renderCard({ phase: "loading" });

    assert.match(html, /Checking the backend/);
    assert.match(html, /<button[^>]*disabled/);
  });

  test("an UP backend and database are shown as success", () => {
    const html = renderCard({ phase: "reachable", overall: "UP", database: "UP", checkedAt: 0 });

    assert.equal(count(html, "badge--success"), 2);
    assert.doesNotMatch(html, /<button[^>]*disabled/);
  });

  test("a DOWN backend is shown as a danger status", () => {
    const html = renderCard({ phase: "reachable", overall: "DOWN", database: "DOWN", checkedAt: 0 });

    assert.equal(count(html, "badge--danger"), 2);
    assert.equal(count(html, "badge--success"), 0);
  });

  test("a database status the backend does not report is stated honestly", () => {
    const html = renderCard({ phase: "reachable", overall: "UP", database: null, checkedAt: 0 });

    assert.match(html, /Not reported/);
    assert.equal(count(html, "badge--success"), 1);
  });

  test("an unreachable backend shows the reason", () => {
    const html = renderCard({ phase: "unreachable", message: "The backend did not answer in time.", checkedAt: 0 });

    assert.match(html, /Backend status unavailable/);
    assert.match(html, /The backend did not answer in time\./);
  });
});
