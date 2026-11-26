import { ApiError } from "./client";
import type { ApiClient } from "./client";

export const HEALTH_PATH = "/actuator/health";

export interface HealthComponent {
  status: string;
}

/** The subset of the Spring Boot Actuator health document this application reads. */
export interface HealthReport {
  status: string;
  components?: Record<string, HealthComponent>;
}

export function isHealthReport(value: unknown): value is HealthReport {
  return typeof value === "object" && value !== null && typeof (value as { status?: unknown }).status === "string";
}

/**
 * Actuator answers HTTP 503 with a valid health document when the application is DOWN. That is a
 * successful health reading (the answer is "DOWN"), so it is returned instead of thrown.
 * Anything else that is not a health document is an error.
 */
export async function fetchHealth(client: ApiClient): Promise<HealthReport> {
  try {
    const payload = await client.get<unknown>(HEALTH_PATH);
    if (!isHealthReport(payload)) {
      throw new ApiError("The health endpoint returned an unexpected response.", 200, "PARSE", payload);
    }
    return payload;
  } catch (error) {
    if (error instanceof ApiError && error.status === 503 && isHealthReport(error.payload)) {
      return error.payload;
    }
    throw error;
  }
}
