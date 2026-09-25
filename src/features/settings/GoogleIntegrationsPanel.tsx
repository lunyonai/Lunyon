import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useLocale } from "../../i18n/LocaleProvider";
import {
  api,
  ApiError,
  type CalendarEventSummary,
  type GmailMessageSummary,
  type GoogleStatus,
} from "../../lib/api";

export default function GoogleIntegrationsPanel() {
  const { t } = useLocale();
  const [params, setParams] = useSearchParams();
  const [status, setStatus] = useState<GoogleStatus | null>(null);
  const [loadError, setLoadError] = useState("");
  const [banner, setBanner] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<GmailMessageSummary[]>([]);
  const [events, setEvents] = useState<CalendarEventSummary[]>([]);
  const [mailError, setMailError] = useState("");
  const [calError, setCalError] = useState("");
  const [range, setRange] = useState<"today" | "next7">("next7");

  useEffect(() => {
    const flag = params.get("google");
    if (!flag) return;
    if (flag === "connected") setBanner(t("app.settings.googleConnected"));
    if (flag === "denied") setBanner(t("app.settings.googleDenied"));
    if (flag === "error") setBanner(t("app.settings.googleError"));
    params.delete("google");
    setParams(params, { replace: true });
  }, [params, setParams, t]);

  async function loadStatus() {
    try {
      const next = await api.googleStatus();
      setStatus(next);
      setLoadError("");
      return next;
    } catch (err) {
      setStatus(null);
      setLoadError(
        err instanceof ApiError && err.status === 503
          ? t("app.settings.googleNotConfigured")
          : t("app.settings.googleLoadError"),
      );
      return null;
    }
  }

  async function loadData(connected: boolean, nextRange: "today" | "next7") {
    if (!connected) {
      setMessages([]);
      setEvents([]);
      return;
    }
    try {
      setMailError("");
      setMessages(await api.gmailMessages(8));
    } catch {
      setMailError(t("app.settings.gmailError"));
      setMessages([]);
    }
    try {
      setCalError("");
      setEvents(await api.calendarEvents(nextRange));
    } catch {
      setCalError(t("app.settings.calendarError"));
      setEvents([]);
    }
  }

  useEffect(() => {
    let cancelled = false;
    loadStatus().then((next) => {
      if (!cancelled && next?.connected) void loadData(true, range);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleConnect() {
    if (busy) return;
    setBusy(true);
    try {
      const { url } = await api.googleConnect();
      window.location.assign(url);
    } catch (err) {
      setBusy(false);
      setBanner(
        err instanceof ApiError && err.status === 503
          ? t("app.settings.googleNotConfigured")
          : t("app.settings.googleConnectError"),
      );
    }
  }

  async function handleDisconnect() {
    if (busy) return;
    setBusy(true);
    try {
      const next = await api.googleDisconnect();
      setStatus(next);
      setMessages([]);
      setEvents([]);
      setBanner("");
    } catch {
      setBanner(t("app.settings.googleDisconnectError"));
    } finally {
      setBusy(false);
    }
  }

  async function handleRange(next: "today" | "next7") {
    setRange(next);
    if (status?.connected) await loadData(true, next);
  }

  const connected = Boolean(status?.connected && status.email);

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
      <h2 className="text-base font-semibold text-white">
        {t("app.settings.integrationsSection")}
      </h2>
      <p className="mt-2 text-sm text-slate-400">{t("app.settings.integrationsHint")}</p>

      <div className="mt-5 rounded-xl border border-slate-800 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-white">{t("app.settings.googleName")}</p>
            <p className="mt-1 text-sm text-slate-400">
              {connected
                ? t("app.settings.googleConnectedAs", { email: status?.email ?? "" })
                : t("app.settings.googleDisconnected")}
            </p>
            {connected && (
              <p className="mt-1 text-xs text-slate-500">
                {t("app.settings.googleCapabilities")}
              </p>
            )}
          </div>
          {connected ? (
            <button
              type="button"
              onClick={() => void handleDisconnect()}
              disabled={busy}
              className="flex h-10 items-center rounded-xl border border-slate-800 px-4 text-sm font-medium text-slate-300 transition hover:bg-slate-900 disabled:opacity-60"
            >
              {t("app.settings.googleDisconnect")}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void handleConnect()}
              disabled={busy}
              className="flex h-10 items-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-60"
            >
              {t("app.settings.googleConnect")}
            </button>
          )}
        </div>
      </div>

      {loadError && <p className="mt-3 text-sm text-red-400">{loadError}</p>}
      {banner && <p className="mt-3 text-sm text-slate-300">{banner}</p>}

      {connected && (
        <div className="mt-6 grid gap-4">
          <div>
            <p className="text-xs font-semibold tracking-wider text-slate-500">
              {t("app.settings.gmailRecent")}
            </p>
            {mailError && <p className="mt-2 text-sm text-red-400">{mailError}</p>}
            {!mailError && messages.length === 0 && (
              <p className="mt-2 text-sm text-slate-500">{t("app.settings.gmailEmpty")}</p>
            )}
            <ul className="mt-3 space-y-2">
              {messages.map((item) => (
                <li
                  key={item.id}
                  className="rounded-xl border border-slate-800 px-3 py-2"
                >
                  <p className="text-sm text-white">{item.subject || "—"}</p>
                  <p className="mt-1 text-xs text-slate-500">{item.from}</p>
                  {item.snippet && (
                    <p className="mt-1 text-xs text-slate-400">{item.snippet}</p>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold tracking-wider text-slate-500">
                {t("app.settings.calendarUpcoming")}
              </p>
              <div className="flex gap-1">
                {(["today", "next7"] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => void handleRange(value)}
                    className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                      range === value
                        ? "bg-blue-600 text-white"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {value === "today"
                      ? t("app.settings.calendarRangeToday")
                      : t("app.settings.calendarRangeWeek")}
                  </button>
                ))}
              </div>
            </div>
            {calError && <p className="mt-2 text-sm text-red-400">{calError}</p>}
            {!calError && events.length === 0 && (
              <p className="mt-2 text-sm text-slate-500">
                {t("app.settings.calendarEmpty")}
              </p>
            )}
            <ul className="mt-3 space-y-2">
              {events.map((item) => (
                <li
                  key={item.id}
                  className="rounded-xl border border-slate-800 px-3 py-2"
                >
                  <p className="text-sm text-white">{item.title || "—"}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {[item.start, item.location].filter(Boolean).join(" · ")}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}
