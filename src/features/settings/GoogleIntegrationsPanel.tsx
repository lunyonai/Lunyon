import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useLocale } from "../../i18n/LocaleProvider";
import {
  api,
  ApiError,
  type GmailStatus,
  type GoogleCalendarListItem,
  type GoogleStatus,
} from "../../lib/api";

export default function GoogleIntegrationsPanel() {
  const { t } = useLocale();
  const [params, setParams] = useSearchParams();
  const [status, setStatus] = useState<GoogleStatus | null>(null);
  const [gmail, setGmail] = useState<GmailStatus | null>(null);
  const [calendars, setCalendars] = useState<GoogleCalendarListItem[]>([]);
  const [loadError, setLoadError] = useState("");
  const [banner, setBanner] = useState("");
  const [busy, setBusy] = useState(false);
  const [gmailBusy, setGmailBusy] = useState(false);
  const [savingCalendars, setSavingCalendars] = useState(false);
  const [listError, setListError] = useState("");

  useEffect(() => {
    const flag = params.get("google");
    const gmailFlag = params.get("gmail");
    if (!flag && !gmailFlag) return;
    if (flag === "connected") setBanner(t("app.settings.googleConnected"));
    if (flag === "denied") setBanner(t("app.settings.googleDenied"));
    if (flag === "error") setBanner(t("app.settings.googleError"));
    if (gmailFlag === "connected") setBanner(t("app.settings.gmailConnected"));
    if (gmailFlag === "send") setBanner(t("app.settings.gmailSendEnabled"));
    if (gmailFlag === "denied") setBanner(t("app.settings.gmailDenied"));
    if (gmailFlag === "error") setBanner(t("app.settings.gmailOAuthError"));
    params.delete("google");
    params.delete("gmail");
    setParams(params, { replace: true });
  }, [params, setParams, t]);

  async function loadCalendars() {
    try {
      const next = await api.googleCalendars();
      setCalendars(next);
      setListError("");
    } catch (err) {
      setCalendars([]);
      if (err instanceof ApiError && (err.status === 403 || err.code === "CALENDAR_LIST_SCOPE")) {
        setListError(t("app.settings.calendarsReauthHint"));
      } else {
        setListError(t("app.settings.calendarsLoadError"));
      }
    }
  }

  async function loadStatus() {
    setLoadError("");
    const [calendarResult, gmailResult] = await Promise.allSettled([
      api.googleStatus(),
      api.gmailStatus(),
    ]);

    if (calendarResult.status === "fulfilled") {
      setStatus(calendarResult.value);
      if (calendarResult.value.connected) await loadCalendars();
      else setCalendars([]);
    } else {
      setStatus(null);
      setCalendars([]);
      const err = calendarResult.reason;
      setLoadError(
        err instanceof ApiError && (err.status === 503 || err.code === "API_UNCONFIGURED")
          ? t("app.settings.googleNotConfigured")
          : t("app.settings.googleLoadError"),
      );
    }

    if (gmailResult.status === "fulfilled") {
      setGmail(gmailResult.value);
    } else {
      setGmail(null);
    }
  }

  useEffect(() => {
    void loadStatus();
  }, []);

  async function handleConnect(write = false) {
    if (busy) return;
    setBusy(true);
    try {
      const { url } = await api.googleConnect(write);
      window.location.assign(url);
    } catch (err) {
      setBusy(false);
      setBanner(
        err instanceof ApiError && (err.status === 503 || err.code === "API_UNCONFIGURED")
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
      setCalendars([]);
      setBanner("");
    } catch {
      setBanner(t("app.settings.googleDisconnectError"));
    } finally {
      setBusy(false);
    }
  }

  async function handleGmailConnect(send = false) {
    if (gmailBusy) return;
    setGmailBusy(true);
    try {
      const { url } = await api.gmailConnect(send);
      window.location.assign(url);
    } catch (err) {
      setGmailBusy(false);
      setBanner(
        err instanceof ApiError && (err.status === 503 || err.code === "API_UNCONFIGURED")
          ? t("app.settings.googleNotConfigured")
          : t("app.settings.gmailConnectError"),
      );
    }
  }

  async function handleGmailDisconnect() {
    if (gmailBusy) return;
    setGmailBusy(true);
    try {
      const next = await api.gmailDisconnect();
      setGmail(next);
      setBanner("");
    } catch {
      setBanner(t("app.settings.gmailDisconnectError"));
    } finally {
      setGmailBusy(false);
    }
  }

  function toggleCalendar(id: string) {
    setCalendars((current) =>
      current.map((item) =>
        item.id === id ? { ...item, enabled: !item.enabled } : item,
      ),
    );
  }

  async function handleSaveCalendars() {
    if (savingCalendars) return;
    setSavingCalendars(true);
    try {
      const saved = await api.saveGoogleCalendars(
        calendars.filter((item) => item.enabled).map((item) => item.id),
      );
      setCalendars(saved);
      setBanner(t("app.settings.calendarsSaved"));
      setListError("");
    } catch {
      setBanner(t("app.settings.calendarsSaveError"));
    } finally {
      setSavingCalendars(false);
    }
  }

  const connected = Boolean(status?.connected && status.email);
  const needsReauth = Boolean(status?.needsReauth) || Boolean(listError);

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
                {status?.canWrite
                  ? t("app.settings.googleCapabilitiesWrite")
                  : t("app.settings.googleCapabilities")}
              </p>
            )}
          </div>
          {connected ? (
            <div className="flex flex-wrap gap-2">
              {!status?.canWrite && (
                <button
                  type="button"
                  onClick={() => void handleConnect(true)}
                  disabled={busy}
                  className="flex h-10 items-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-60"
                >
                  {t("app.settings.googleGrantWrite")}
                </button>
              )}
              <Link
                to="/calendar"
                className="flex h-10 items-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-500"
              >
                {t("app.settings.googleViewCalendar")}
              </Link>
              <button
                type="button"
                onClick={() => void handleDisconnect()}
                disabled={busy}
                className="flex h-10 items-center rounded-xl border border-slate-800 px-4 text-sm font-medium text-slate-300 transition hover:bg-slate-900 disabled:opacity-60"
              >
                {t("app.settings.googleDisconnect")}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => void handleConnect()}
              disabled={busy}
              className="flex h-10 items-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-60"
            >
              {busy ? t("login.loading") : t("app.settings.googleConnect")}
            </button>
          )}
        </div>

        {connected && (
          <div className="mt-5 border-t border-slate-800 pt-4">
            <p className="text-sm font-medium text-white">{t("app.settings.calendarsTitle")}</p>
            <p className="mt-1 text-xs text-slate-500">{t("app.settings.calendarsHint")}</p>
            {needsReauth && (
              <div className="mt-3">
                <p className="text-sm text-slate-400">{t("app.settings.calendarsReauthHint")}</p>
                <button
                  type="button"
                  onClick={() => void handleConnect()}
                  disabled={busy}
                  className="mt-3 flex h-10 items-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-60"
                >
                  {t("app.settings.calendarsReauth")}
                </button>
              </div>
            )}
            {!needsReauth && calendars.length > 0 && (
              <>
                <ul className="mt-3 space-y-2">
                  {calendars.map((item) => (
                    <li key={item.id}>
                      <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-800 px-3 py-2">
                        <input
                          type="checkbox"
                          checked={item.enabled}
                          onChange={() => toggleCalendar(item.id)}
                          className="h-4 w-4 accent-[var(--lunyo-primary)]"
                        />
                        <span
                          className="h-3 w-3 shrink-0 rounded-full"
                          style={{ backgroundColor: item.backgroundColor || "#64748b" }}
                          aria-hidden="true"
                        />
                        <span className="min-w-0 flex-1 text-sm text-slate-200">
                          {item.summary}
                          {item.primary ? (
                            <span className="ml-2 text-xs text-slate-500">
                              {t("app.settings.calendarPrimary")}
                            </span>
                          ) : null}
                          {item.writable === false ? (
                            <span className="ml-2 text-xs text-slate-500">
                              {t("app.settings.calendarReadOnly")}
                            </span>
                          ) : null}
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => void handleSaveCalendars()}
                  disabled={savingCalendars}
                  className="mt-3 flex h-10 items-center rounded-xl border border-slate-800 px-4 text-sm font-medium text-slate-200 transition hover:bg-slate-900 disabled:opacity-60"
                >
                  {savingCalendars ? t("login.loading") : t("app.settings.calendarsSave")}
                </button>
              </>
            )}
            {listError && !status?.needsReauth && (
              <p className="mt-3 text-sm text-red-400">{listError}</p>
            )}
          </div>
        )}
      </div>

      <div className="mt-5 rounded-xl border border-slate-800 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-white">{t("app.settings.gmailName")}</p>
            <p className="mt-1 text-sm text-slate-400">
              {gmail?.connected && gmail.email
                ? t("app.settings.gmailConnectedAs", { email: gmail.email })
                : t("app.settings.gmailDisconnected")}
            </p>
            <p className="mt-1 text-xs text-slate-500">{t("app.settings.gmailHint")}</p>
            {gmail?.connected && (
              <div className="mt-2 space-y-1 text-xs text-slate-500">
                <p>
                  {t("app.settings.gmailReadAccess")}:{" "}
                  {gmail.canRead ? t("app.settings.gmailEnabled") : t("app.settings.gmailDisabled")}
                </p>
                <p>
                  {t("app.settings.gmailSendAccess")}:{" "}
                  {gmail.canSend ? t("app.settings.gmailEnabled") : t("app.settings.gmailDisabled")}
                </p>
              </div>
            )}
          </div>
          {gmail?.connected ? (
            <div className="flex flex-wrap gap-2">
              {!gmail.canSend && (
                <button
                  type="button"
                  onClick={() => void handleGmailConnect(true)}
                  disabled={gmailBusy}
                  className="flex h-10 items-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-60"
                >
                  {t("app.settings.gmailEnableSend")}
                </button>
              )}
              <Link
                to="/mail"
                className={
                  gmail.canSend
                    ? "flex h-10 items-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-500"
                    : "flex h-10 items-center rounded-xl border border-slate-800 px-4 text-sm font-medium text-slate-300 transition hover:bg-slate-900"
                }
              >
                {t("app.settings.gmailViewInbox")}
              </Link>
              <button
                type="button"
                onClick={() => void handleGmailConnect()}
                disabled={gmailBusy}
                className="flex h-10 items-center rounded-xl border border-slate-800 px-4 text-sm font-medium text-slate-300 transition hover:bg-slate-900 disabled:opacity-60"
              >
                {t("app.settings.gmailReconnect")}
              </button>
              <button
                type="button"
                onClick={() => void handleGmailDisconnect()}
                disabled={gmailBusy}
                className="flex h-10 items-center rounded-xl border border-slate-800 px-4 text-sm font-medium text-slate-300 transition hover:bg-slate-900 disabled:opacity-60"
              >
                {t("app.settings.gmailDisconnect")}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => void handleGmailConnect()}
              disabled={gmailBusy}
              className="flex h-10 items-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-60"
            >
              {gmailBusy ? t("login.loading") : t("app.settings.gmailConnect")}
            </button>
          )}
        </div>
      </div>

      {loadError && <p className="mt-3 text-sm text-red-400">{loadError}</p>}
      {banner && <p className="mt-3 text-sm text-slate-300">{banner}</p>}
    </section>
  );
}
