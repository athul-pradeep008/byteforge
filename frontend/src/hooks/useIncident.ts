import { useState, useEffect, useCallback, useRef } from "react";
import { Incident, HostPrediction } from "../types";
import { apiClient } from "../api/client";

interface UseIncidentReturn {
  incident: Incident | null;
  predictionsAfter: HostPrediction[];
  isLoading: boolean;
  approvedHost: string | null;         // the host that was isolated (for graph highlight)
  refresh: (id: string) => Promise<void>;
  setApprovedHost: (host: string | null) => void;
  setPredictionsAfter: (preds: HostPrediction[]) => void;
}

/**
 * useIncident — fetches the latest incident from the backend.
 * Exposes state needed by PredictionPanel, ResponseCards, and MemoryPanel.
 * The hook re-fetches every `pollIntervalMs` while `incidentId` is set.
 */
export function useIncident(
  incidentId: string | null,
  pollIntervalMs = 4000
): UseIncidentReturn {
  const [incident, setIncident] = useState<Incident | null>(null);
  const [predictionsAfter, setPredictionsAfter] = useState<HostPrediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [approvedHost, setApprovedHost] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refresh = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      const inc = await apiClient.getIncident(id);
      setIncident(inc);
    } catch (err) {
      console.error("useIncident: fetch failed", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!incidentId) return;

    let active = true;

    const poll = async () => {
      if (!active) return;
      await refresh(incidentId);
      if (active) {
        timerRef.current = setTimeout(poll, pollIntervalMs);
      }
    };

    poll();

    return () => {
      active = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [incidentId, pollIntervalMs, refresh]);

  return {
    incident,
    predictionsAfter,
    isLoading,
    approvedHost,
    refresh: (id) => refresh(id),
    setApprovedHost,
    setPredictionsAfter,
  };
}
