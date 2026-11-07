import { useCallback, useEffect, useState } from "react";
import { api } from "./client";
export function useRead<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null),
    [pending, setPending] = useState(!!path),
    [error, setError] = useState(""),
    [attempt, setAttempt] = useState(0);
  const reload = useCallback(() => setAttempt((n) => n + 1), []);
  useEffect(() => {
    if (!path) {
      setData(null);
      setPending(false);
      setError("");
      return;
    }
    const controller = new AbortController();
    setPending(true);
    setError("");
    api<T>(path, { signal: controller.signal })
      .then((value) => {
        if (!controller.signal.aborted) setData(value);
      })
      .catch((reason) => {
        if (!controller.signal.aborted) setError(reason.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setPending(false);
      });
    return () => controller.abort();
  }, [path, attempt]);
  return { data, setData, pending, error, reload };
}
