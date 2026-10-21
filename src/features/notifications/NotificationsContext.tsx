import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "../../hooks/useAuth";
import { useLocale } from "../../i18n/LocaleProvider";
import { readLocalJson, writeLocalJson } from "../../lib/localStore";
import { useActivity } from "../activity/ActivityContext";
import { activityTitle } from "../activity/activityView";
import type { AppNotification } from "./notificationTypes";

type NotificationsContextValue = {
  notifications: AppNotification[];
  unreadCount: number;
  markRead: (id: string) => void;
  markAllRead: () => void;
};

/** Per-browser read state: everything up to `seenBefore` plus individually read ids. */
type ReadState = { seenBefore: string | null; ids: string[] };

const NotificationsContext = createContext<NotificationsContextValue | null>(
  null,
);

function storageKey(userId: string) {
  return `lunyon.notifications.${userId}`;
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { t } = useLocale();
  const { user } = useAuth();
  const userId = user?.id ?? "anonymous";
  const { activities } = useActivity();
  const [readState, setReadState] = useState<{ userId: string; state: ReadState }>(() => ({
    userId,
    state: readLocalJson<ReadState>(storageKey(userId)) ?? { seenBefore: null, ids: [] },
  }));

  // Reload the stored read state when the signed-in user changes.
  const current = useMemo(
    () =>
      readState.userId === userId
        ? readState.state
        : (readLocalJson<ReadState>(storageKey(userId)) ?? { seenBefore: null, ids: [] }),
    [readState, userId],
  );

  const persist = useCallback(
    (next: ReadState) => {
      setReadState({ userId, state: next });
      writeLocalJson(storageKey(userId), next);
    },
    [userId],
  );

  const notifications = useMemo<AppNotification[]>(() => {
    const seenBefore = current.seenBefore ? new Date(current.seenBefore).getTime() : 0;
    return activities
      .filter((item) => item.type === "workflow")
      .slice(0, 20)
      .map((item) => ({
        id: item.id,
        category: item.status === "failed" ? "automation_failed" : "workflow_completed",
        title: activityTitle(item, t),
        description:
          item.status === "failed"
            ? item.detail || t("app.notifications.failedHint")
            : t("app.notifications.completedHint"),
        createdAt: item.createdAt,
        read:
          new Date(item.createdAt).getTime() <= seenBefore || current.ids.includes(item.id),
      }));
  }, [activities, current, t]);

  const markRead = useCallback(
    (id: string) => {
      if (current.ids.includes(id)) return;
      persist({ ...current, ids: [...current.ids, id].slice(-100) });
    },
    [current, persist],
  );

  const markAllRead = useCallback(() => {
    const newest = notifications[0]?.createdAt ?? new Date().toISOString();
    persist({ seenBefore: newest, ids: [] });
  }, [notifications, persist]);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.read).length,
    [notifications],
  );

  const value = useMemo(
    () => ({ notifications, unreadCount, markRead, markAllRead }),
    [markAllRead, markRead, notifications, unreadCount],
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error("useNotifications must be used within NotificationsProvider");
  }
  return context;
}
