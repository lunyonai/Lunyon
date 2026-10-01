import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { useLocale } from "../../i18n/LocaleProvider";
import { useNotifications } from "./NotificationsContext";

export default function NotificationsPopover() {
  const { t } = useLocale();
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onPointer(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    if (!open) return;
    window.addEventListener("mousedown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label={t("app.nav.notifications")}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((value) => !value)}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 text-slate-400 transition hover:bg-slate-900 hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-500 px-1 text-[10px] font-semibold text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={t("app.notifications.title")}
          className="absolute right-0 z-50 mt-2 w-[min(22rem,calc(100vw-2.5rem))] rounded-2xl border border-slate-800 bg-slate-950 p-4 shadow-2xl shadow-black/50"
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-white">
              {t("app.notifications.title")}
            </p>
            {notifications.length > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-xs font-medium text-blue-400 transition hover:text-blue-300"
              >
                {t("app.notifications.markAll")}
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="px-1 py-8 text-center">
              <p className="text-sm font-medium text-slate-300">
                {t("app.notifications.empty")}
              </p>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                {t("app.notifications.emptyHint")}
              </p>
            </div>
          ) : (
            <ul className="mt-3 max-h-80 space-y-1 overflow-y-auto">
              {notifications.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => markRead(item.id)}
                    className="flex w-full flex-col rounded-xl px-3 py-2.5 text-left transition hover:bg-slate-900"
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-white">
                        {item.title}
                      </span>
                      {!item.read && (
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
                      )}
                    </span>
                    <span className="mt-1 text-xs text-slate-500">
                      {item.description}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
