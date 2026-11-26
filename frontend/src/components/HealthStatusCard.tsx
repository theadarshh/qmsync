import type { HealthViewState } from "../state/healthState";
import { Badge } from "./ui/Badge";

function toneFor(status: string): "success" | "danger" | "warning" {
  if (status === "UP") {
    return "success";
  }
  if (status === "DOWN" || status === "OUT_OF_SERVICE") {
    return "danger";
  }
  return "warning";
}

function formatCheckedAt(epochMs: number): string {
  return new Date(epochMs).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

/** Presentational: shows a real health reading from the backend (loading, reachable or unreachable). */
export function HealthStatusCard({ state, onRefresh }: { state: HealthViewState; onRefresh: () => void }) {
  return (
    <section className="card" aria-labelledby="health-title">
      <div className="card__head">
        <h2 id="health-title" className="card__title">
          Backend status
        </h2>
        <button
          type="button"
          className="button button--secondary"
          onClick={onRefresh}
          disabled={state.phase === "loading"}
        >
          Check again
        </button>
      </div>
      <div className="health" role="status" aria-live="polite">
        {state.phase === "loading" ? <p className="muted">Checking the backend...</p> : null}
        {state.phase === "reachable" ? (
          <dl className="facts">
            <div className="facts__row">
              <dt>Application</dt>
              <dd>
                <Badge tone={toneFor(state.overall)}>{state.overall}</Badge>
              </dd>
            </div>
            <div className="facts__row">
              <dt>Database</dt>
              <dd>
                {state.database === null ? "Not reported" : <Badge tone={toneFor(state.database)}>{state.database}</Badge>}
              </dd>
            </div>
            <div className="facts__row">
              <dt>Last checked</dt>
              <dd>{formatCheckedAt(state.checkedAt)}</dd>
            </div>
          </dl>
        ) : null}
        {state.phase === "unreachable" ? (
          <div>
            <p className="error-text">Backend status unavailable</p>
            <p className="muted">{state.message}</p>
            <p className="muted">Last checked at {formatCheckedAt(state.checkedAt)}.</p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
