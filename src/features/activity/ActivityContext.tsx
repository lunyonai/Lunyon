import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "../../hooks/useAuth";
import { api, type ActivityRecord, type ActivityStats } from "../../lib/api";
import { userTimezone } from "../../lib/aiErrors";

const POLL_MS = 2 * 60 * 1000;

type ActivityContextValue = {
  activities: ActivityRecord[];
  stats: ActivityStats | null;
  loading: boolean;
  /** True when the API could not return activity (e.g. migration not applied yet). */
  unavailable: boolean;
  refresh: () => Promise<void>;
};

const ActivityContext = createContext<ActivityContextValue | null>(null);

export function ActivityProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id;
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [stats, setStats] = useState<ActivityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);

  /** Fetches and applies; every state update happens after the request resolves. */
  const load = useCallback(async () => {
    if (!userId) return;
    try {
      const [items, nextStats] = await Promise.all([
        api.activity({ limit: 30 }),
        api.activityStats(userTimezone()),
      ]);
      setActivities(items);
      setStats(nextStats);
      setUnavailable(false);
    } catch {
      setUnavailable(true);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const refresh = useCallback(async () => {
    setLoading(true);
    await load();
  }, [load]);

  useEffect(() => {
    let cancelled = false;
    if (userId) {
      Promise.resolve().then(() => {
        if (!cancelled) void load();
      });
    }
    // Scheduled workflow runs finish without user action; poll so they reach notifications.
    const timer = window.setInterval(() => {
      if (userId && document.visibilityState === "visible") void load();
    }, POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [load, userId]);

  const value = useMemo(
    () => ({
      activities: userId ? activities : [],
      stats: userId ? stats : null,
      loading: Boolean(userId) && loading,
      unavailable,
      refresh,
    }),
    [activities, loading, refresh, stats, unavailable, userId],
  );

  return (
    <ActivityContext.Provider value={value}>
      {children}
    </ActivityContext.Provider>
  );
}

export function useActivity() {
  const context = useContext(ActivityContext);

  if (!context) {
    throw new Error("useActivity must be used within an ActivityProvider");
  }

  return context;
}
