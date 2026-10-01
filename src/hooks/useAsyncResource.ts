import { useCallback, useEffect, useState } from 'react';

export type LoadStatus = 'idle' | 'loading' | 'success' | 'error';

interface AsyncResource<Data> {
  data: Data | null;
  status: LoadStatus;
  reload: () => void;
}

/**
 * Runs `load` and tracks its result. `load` must be memoised (useCallback):
 * it re-runs whenever `load` changes, whenever `enabled` turns true, and on
 * reload(). Pass `load = null` when it can't run yet (e.g. no account), which
 * reports an error. Results from a superseded or unmounted run are dropped.
 */
export function useAsyncResource<Data>(load: (() => Promise<Data>) | null, enabled = true): AsyncResource<Data> {
  const [data, setData] = useState<Data | null>(null);
  const [status, setStatus] = useState<LoadStatus>('idle');
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    if (!load) {
      setStatus('error');
      return;
    }

    let isCancelled = false;
    setStatus('loading');
    load()
      .then((result) => {
        if (!isCancelled) {
          setData(result);
          setStatus('success');
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setStatus('error');
        }
      });
    return () => {
      isCancelled = true;
    };
  }, [load, enabled, reloadCount]);

  const reload = useCallback(() => setReloadCount((count) => count + 1), []);

  return { data, status, reload };
}
