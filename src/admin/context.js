import { createContext, useCallback, useContext, useEffect, useState } from 'react';

export const AdminContext = createContext(null);

export const useAdmin = () => useContext(AdminContext);

// Loads data from an admin call. If the server says the session is no longer
// valid (or not an administrator's), the whole area falls back to the login.
export function useAdminData(load, deps = []) {
  const { onExpired } = useContext(AdminContext);
  const [state, setState] = useState({ data: null, loading: true, failed: false });
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let active = true;
    setState((current) => ({ ...current, loading: true, failed: false }));
    load()
      .then((data) => active && setState({ data, loading: false, failed: false }))
      .catch((error) => {
        if (!active) return;
        if (error.unauthorized) onExpired();
        else setState((current) => ({ ...current, loading: false, failed: true }));
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, version]);

  const reload = useCallback(() => setVersion((value) => value + 1), []);
  return { ...state, reload };
}
