import { Dispatch, SetStateAction, useCallback, useEffect, useRef, useState } from 'react';

export type LoadStatus = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncResource<Data> {
  data: Data | null;
  status: LoadStatus;
  reload: () => void;
  /**
   * Re-fetches in the background: the current data stays on screen (no
   * loading state) and is replaced when the new result arrives; a failure is
   * ignored. Behaves like reload() while nothing has loaded yet.
   */
  refresh: () => void;
  /** Replaces the loaded data locally, e.g. with what a save returned, without reloading. */
  setData: Dispatch<SetStateAction<Data | null>>;
}

/**
 * Runs `load` and tracks its result. `load` must be memoised (useCallback):
 * it re-runs whenever `load` changes, whenever `enabled` turns true, and on
 * reload() / refresh(). Pass `load = null` when it can't run yet (e.g. no
 * account), which reports an error. Results from a superseded or unmounted
 * run are dropped.
 */
export function useAsyncResource<Data>(load: (() => Promise<Data>) | null, enabled = true): AsyncResource<Data> {
  const [data, setData] = useState<Data | null>(null);
  const [status, setStatus] = useState<LoadStatus>('idle');
  const [request, setRequest] = useState({ count: 0, isBackground: false });
  const hasDataRef = useRef(false);
  hasDataRef.current = data !== null;
  // The request the last run handled: only a run started by refresh() itself is silent, not a later
  // one caused by `load` or `enabled` changing while the last request happens to be a refresh.
  const handledRequestRef = useRef(request);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    if (!load) {
      setStatus('error');
      return;
    }

    let isCancelled = false;
    // A background refresh only stays silent when there's something to keep showing.
    const isBackground = request.isBackground && request !== handledRequestRef.current && hasDataRef.current;
    handledRequestRef.current = request;
    if (!isBackground) {
      setStatus('loading');
    }
    load()
      .then((result) => {
        if (!isCancelled) {
          setData(result);
          setStatus('success');
        }
      })
      .catch(() => {
        if (!isCancelled && !isBackground) {
          setStatus('error');
        }
      });
    return () => {
      isCancelled = true;
    };
  }, [load, enabled, request]);

  const reload = useCallback(() => setRequest(({ count }) => ({ count: count + 1, isBackground: false })), []);
  const refresh = useCallback(() => setRequest(({ count }) => ({ count: count + 1, isBackground: true })), []);

  return { data, status, reload, refresh, setData };
}
