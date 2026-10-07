import { useState, useEffect, useCallback, useRef } from "react";
import {
  TelemetryEvent,
  Anomaly,
  AgentStep,
  AttackStep,
  HostPrediction,
} from "../types";

const SSE_URL = "http://localhost:8000/api/stream";

export function useEventStream() {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);
  const [events, setEvents] = useState<TelemetryEvent[]>([]);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [agentSteps, setAgentSteps] = useState<AgentStep[]>([]);
  const [attackChain, setAttackChain] = useState<AttackStep[]>([]);
  const [predictions, setPredictions] = useState<HostPrediction[]>([]);

  const eventSourceRef = useRef<EventSource | null>(null);

  const clearStream = useCallback(() => {
    setEvents([]);
    setAnomalies([]);
    setAgentSteps([]);
    setAttackChain([]);
    setPredictions([]);
  }, []);

  useEffect(() => {
    let es: EventSource | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

    const connect = () => {
      try {
        es = new EventSource(SSE_URL);
        eventSourceRef.current = es;

        es.onopen = () => {
          setIsConnected(true);
          setIsError(false);
        };

        es.onerror = () => {
          setIsConnected(false);
          setIsError(true);
          es?.close();
          // Try to reconnect every 10 seconds if disconnected
          reconnectTimeout = setTimeout(connect, 10000);
        };

        es.addEventListener("ping", () => {
          setIsConnected(true);
          setIsError(false);
        });

        es.addEventListener("events", (e: MessageEvent) => {
          try {
            const batch: TelemetryEvent[] = JSON.parse(e.data);
            setEvents((prev) => [...prev, ...batch]);
          } catch (err) {
            console.error("Failed to parse SSE events data:", err);
          }
        });

        es.addEventListener("anomalies", (e: MessageEvent) => {
          try {
            const batch: Anomaly[] = JSON.parse(e.data);
            setAnomalies((prev) => [...prev, ...batch]);
          } catch (err) {
            console.error("Failed to parse SSE anomalies data:", err);
          }
        });

        es.addEventListener("agent_step", (e: MessageEvent) => {
          try {
            const step: AgentStep = JSON.parse(e.data);
            setAgentSteps((prev) => [...prev, step]);
          } catch (err) {
            console.error("Failed to parse SSE agent_step data:", err);
          }
        });

        es.addEventListener("chain_update", (e: MessageEvent) => {
          try {
            const chain: AttackStep[] = JSON.parse(e.data);
            setAttackChain(chain);
          } catch (err) {
            console.error("Failed to parse SSE chain_update data:", err);
          }
        });

        es.addEventListener("prediction", (e: MessageEvent) => {
          try {
            const preds: HostPrediction[] = JSON.parse(e.data);
            setPredictions(preds);
          } catch (err) {
            console.error("Failed to parse SSE prediction data:", err);
          }
        });

        es.addEventListener("reset", () => {
          clearStream();
        });
      } catch {
        setIsConnected(false);
        setIsError(true);
      }
    };

    connect();

    return () => {
      if (es) es.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [clearStream]);

  return {
    isConnected,
    isError,
    events,
    anomalies,
    agentSteps,
    attackChain,
    predictions,
    clearStream,
  };
}
