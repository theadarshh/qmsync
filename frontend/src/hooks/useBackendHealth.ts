import { useCallback, useEffect, useState } from "react";
import { useApiClient } from "../api/context";
import { LOADING_STATE, loadHealth } from "../state/healthState";
import type { HealthViewState } from "../state/healthState";

export function useBackendHealth(): { state: HealthViewState; refresh: () => void } {
  const client = useApiClient();
  const [state, setState] = useState<HealthViewState>(LOADING_STATE);
  const [requestId, setRequestId] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState(LOADING_STATE);
    void loadHealth(client).then((next) => {
      if (!cancelled) {
        setState(next);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [client, requestId]);

  const refresh = useCallback(() => setRequestId((id) => id + 1), []);
  return { state, refresh };
}
