import { ApiError } from "../api/client";
import type { ApiClient } from "../api/client";
import { fetchHealth } from "../api/health";

export type HealthViewState =
  | { phase: "loading" }
  | { phase: "reachable"; overall: string; database: string | null; checkedAt: number }
  | { phase: "unreachable"; message: string; checkedAt: number };

export const LOADING_STATE: HealthViewState = { phase: "loading" };

export function describeHealthError(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.code) {
      case "NETWORK":
        return "The backend could not be reached. Check that the QMSync backend is running.";
      case "TIMEOUT":
        return "The backend did not answer in time.";
      case "ABORTED":
        return "The status check was cancelled.";
      case "PARSE":
        return "The backend answered, but not with a health report. Check that the dev proxy forwards /actuator to the backend.";
      case "HTTP":
        return `The backend answered with HTTP status ${error.status}.`;
    }
  }
  return "The backend status could not be determined.";
}

/** Never throws: every outcome becomes a view state the dashboard can render. */
export async function loadHealth(client: ApiClient, now: () => number = Date.now): Promise<HealthViewState> {
  try {
    const report = await fetchHealth(client);
    return {
      phase: "reachable",
      overall: report.status,
      database: report.components?.db?.status ?? null,
      checkedAt: now(),
    };
  } catch (error) {
    return { phase: "unreachable", message: describeHealthError(error), checkedAt: now() };
  }
}
