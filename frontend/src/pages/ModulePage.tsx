import { EmptyState } from "../components/ui/EmptyState";
import { Badge } from "../components/ui/Badge";
import { PageHeader } from "../components/ui/PageHeader";
import { usePageTitle } from "../hooks/usePageTitle";
import type { QmsModule } from "../navigation/modules";
import { Link } from "../router/Router";

/** Navigation placeholder for a planned module. It creates and shows no records. */
export function ModulePage({ entry }: { entry: QmsModule }) {
  usePageTitle(entry.label);

  return (
    <div className="page">
      <PageHeader
        title={entry.label}
        subtitle={`Module ${entry.moduleCode}: ${entry.moduleName}`}
        badge={<Badge tone="planned">Planned</Badge>}
      />

      <div className="card">
        <EmptyState
          title={`${entry.label} is not implemented yet`}
          action={
            <Link to="/" className="button button--secondary">
              Back to the dashboard
            </Link>
          }
        >
          <p>{entry.summary}</p>
          <p>
            No records can be created or viewed here yet. This page only marks where the module will live in the
            navigation.
          </p>
        </EmptyState>
      </div>

      <section className="card" aria-labelledby="capabilities-title">
        <h2 id="capabilities-title" className="card__title">
          Planned capabilities
        </h2>
        <ul className="plain-list">
          {entry.capabilities.map((capability) => (
            <li key={capability}>{capability}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
