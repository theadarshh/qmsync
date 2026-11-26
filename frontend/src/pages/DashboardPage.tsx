import { HealthStatusCard } from "../components/HealthStatusCard";
import { Badge } from "../components/ui/Badge";
import { PageHeader } from "../components/ui/PageHeader";
import { useBackendHealth } from "../hooks/useBackendHealth";
import { usePageTitle } from "../hooks/usePageTitle";
import { requireModule } from "../navigation/modules";
import { Link } from "../router/Router";

const KPI_CARDS = [
  { moduleId: "production", title: "Production entries" },
  { moduleId: "rejections", title: "Rejection rate" },
  { moduleId: "ncmr", title: "Open NCMRs" },
  { moduleId: "capa", title: "Open CAPAs" },
  { moduleId: "training", title: "Training compliance" },
  { moduleId: "evidence", title: "Evidence records" },
  { moduleId: "audits", title: "Audit readiness" },
] as const;

const WORKFLOW_STEPS = [
  { moduleId: "production", label: "Production Entry" },
  { moduleId: "rejections", label: "Rejection Recording" },
  { moduleId: "ncmr", label: "Non-Conformance (NCMR)" },
  { moduleId: "capa", label: "Corrective and Preventive Action (CAPA)" },
  { moduleId: "training", label: "Training" },
  { moduleId: "evidence", label: "Evidence Management" },
  { moduleId: "audits", label: "Audit Center" },
] as const;

export function DashboardPage() {
  usePageTitle("Dashboard");
  const { state, refresh } = useBackendHealth();

  return (
    <div className="page">
      <PageHeader
        title="Dashboard"
        subtitle="Overview of quality operations"
        badge={<Badge tone="planned">Milestone 1: application shell</Badge>}
      />

      <div className="callout" role="note">
        <strong>Nothing has been recorded yet.</strong> This milestone delivers the application shell only. Business
        workflows, authentication and tenant isolation are not implemented, so every indicator below is intentionally
        empty instead of showing sample data.
      </div>

      <HealthStatusCard state={state} onRefresh={refresh} />

      <section className="section" aria-labelledby="kpi-title">
        <h2 id="kpi-title" className="section__title">
          Quality indicators
        </h2>
        <ul className="kpi-grid">
          {KPI_CARDS.map((card) => {
            const entry = requireModule(card.moduleId);
            return (
              <li key={card.moduleId} className="kpi">
                <h3 className="kpi__title">{card.title}</h3>
                <p className="kpi__value">
                  <span aria-hidden="true">-</span>
                  <span className="sr-only">No data</span>
                </p>
                <p className="kpi__note">
                  No data yet. {entry.label} (Module {entry.moduleCode}) is planned.
                </p>
                <Link to={entry.path} className="kpi__link">
                  View the module plan
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="section" aria-labelledby="workflow-title">
        <h2 id="workflow-title" className="section__title">
          Connected quality workflow
        </h2>
        <p className="muted">
          The planned flow from the shop floor to the audit. Each step becomes a working module in a later milestone.
        </p>
        <ol className="workflow">
          {WORKFLOW_STEPS.map((step) => (
            <li key={step.moduleId} className="workflow__step">
              <Link to={requireModule(step.moduleId).path} className="workflow__link">
                {step.label}
              </Link>
              <Badge tone="planned">Planned</Badge>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
