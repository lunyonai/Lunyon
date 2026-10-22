import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { iconButtonClass, popoverClass, cx } from "../../components/ui/styles";
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
        className={iconButtonClass({ className: cx("relative", open && "bg-surface-2 text-fg") })}
      >
        <Bell />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-fg ring-2 ring-canvas">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={t("app.notifications.title")}
          className={cx(popoverClass, "absolute right-0 z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] p-0")}
        >
          <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
            <p className="text-sm font-semibold text-fg">{t("app.notifications.title")}</p>
            {notifications.length > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-xs font-medium text-primary-text transition-colors hover:text-fg"
              >
                {t("app.notifications.markAll")}
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <div className="mx-auto mb-3 flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-surface-2 text-fg-subtle">
                <Bell className="h-4 w-4" aria-hidden="true" />
              </div>
              <p className="text-sm font-medium text-fg">{t("app.notifications.empty")}</p>
              <p className="mt-1 text-xs leading-5 text-fg-subtle">{t("app.notifications.emptyHint")}</p>
            </div>
          ) : (
            <ul className="max-h-80 space-y-0.5 overflow-y-auto p-1">
              {notifications.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => markRead(item.id)}
                    className="flex w-full flex-col rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-surface-2"
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className={cx("text-sm", item.read ? "text-fg-muted" : "font-medium text-fg")}>
                        {item.title}
                      </span>
                      {!item.read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
                    </span>
                    <span className="mt-0.5 text-xs text-fg-subtle">{item.description}</span>
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
