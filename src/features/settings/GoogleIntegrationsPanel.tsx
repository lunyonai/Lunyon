import { CalendarDays, Mail } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Alert } from "../../components/ui/Alert";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card, CardHeader } from "../../components/ui/Card";
import { IconTile } from "../../components/ui/IconTile";
import { buttonClass } from "../../components/ui/styles";
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
    <Card padded={false}>
      <div className="border-b border-line px-5 py-4">
        <CardHeader
          title={t("app.settings.integrationsSection")}
          description={t("app.settings.integrationsHint")}
        />
      </div>

      <ul className="divide-y divide-line">
        <li className="px-5 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 flex-1 items-start gap-3">
              <IconTile icon={CalendarDays} tone="cyan" size="sm" />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium text-fg">{t("app.settings.googleName")}</p>
                  {connected ? (
                    <Badge tone={needsReauth ? "warning" : "success"} dot>
                      {t("app.dashboard.connected")}
                    </Badge>
                  ) : (
                    <Badge dot>{t("app.settings.googleDisconnected")}</Badge>
                  )}
                </div>
                {connected && (
                  <>
                    <p className="mt-1 truncate text-sm text-fg-muted">
                      {t("app.settings.googleConnectedAs", { email: status?.email ?? "" })}
                    </p>
                    <p className="mt-0.5 text-xs text-fg-subtle">
                      {status?.canWrite
                        ? t("app.settings.googleCapabilitiesWrite")
                        : t("app.settings.googleCapabilities")}
                    </p>
                  </>
                )}
              </div>
            </div>
            {connected ? (
              <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
                {!status?.canWrite && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => void handleConnect(true)}
                    disabled={busy}
                  >
                    {t("app.settings.googleGrantWrite")}
                  </Button>
                )}
                <Link
                  to="/calendar"
                  className={buttonClass({
                    variant: status?.canWrite ? "primary" : "secondary",
                    size: "sm",
                  })}
                >
                  {t("app.settings.googleViewCalendar")}
                </Link>
                <Button size="sm" onClick={() => void handleDisconnect()} disabled={busy}>
                  {t("app.settings.googleDisconnect")}
                </Button>
              </div>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={() => void handleConnect()}
                disabled={busy}
              >
                {busy ? t("login.loading") : t("app.settings.googleConnect")}
              </Button>
            )}
          </div>

          {connected && (
            <div className="mt-4 border-t border-line pt-4 sm:ml-11">
              <p className="text-sm font-medium text-fg">{t("app.settings.calendarsTitle")}</p>
              <p className="mt-0.5 text-xs text-fg-subtle">{t("app.settings.calendarsHint")}</p>
              {needsReauth && (
                <Alert
                  tone="warning"
                  className="mt-3"
                  action={
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => void handleConnect()}
                      disabled={busy}
                    >
                      {t("app.settings.calendarsReauth")}
                    </Button>
                  }
                >
                  {t("app.settings.calendarsReauthHint")}
                </Alert>
              )}
              {!needsReauth && calendars.length > 0 && (
                <>
                  <ul className="mt-3 divide-y divide-line overflow-hidden rounded-lg border border-line">
                    {calendars.map((item) => (
                      <li key={item.id}>
                        <label className="flex cursor-pointer items-center gap-3 px-3 py-2 transition-colors hover:bg-surface-2">
                          <input
                            type="checkbox"
                            checked={item.enabled}
                            onChange={() => toggleCalendar(item.id)}
                            className="h-4 w-4 accent-primary"
                          />
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: item.backgroundColor || "var(--color-fg-subtle)" }}
                            aria-hidden="true"
                          />
                          <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1 text-sm text-fg">
                            <span className="min-w-0 truncate">{item.summary}</span>
                            {item.primary ? <Badge>{t("app.settings.calendarPrimary")}</Badge> : null}
                            {item.writable === false ? (
                              <Badge>{t("app.settings.calendarReadOnly")}</Badge>
                            ) : null}
                          </span>
                        </label>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3 flex justify-end">
                    <Button
                      size="sm"
                      onClick={() => void handleSaveCalendars()}
                      disabled={savingCalendars}
                    >
                      {savingCalendars ? t("login.loading") : t("app.settings.calendarsSave")}
                    </Button>
                  </div>
                </>
              )}
              {listError && !status?.needsReauth && (
                <p className="mt-3 text-sm text-danger-text">{listError}</p>
              )}
            </div>
          )}
        </li>

        <li className="px-5 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 flex-1 items-start gap-3">
              <IconTile icon={Mail} tone="rose" size="sm" />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium text-fg">{t("app.settings.gmailName")}</p>
                  {gmail?.connected && gmail.email ? (
                    <Badge tone="success" dot>
                      {t("app.dashboard.connected")}
                    </Badge>
                  ) : (
                    <Badge dot>{t("app.settings.gmailDisconnected")}</Badge>
                  )}
                </div>
                {gmail?.connected && gmail.email && (
                  <p className="mt-1 truncate text-sm text-fg-muted">
                    {t("app.settings.gmailConnectedAs", { email: gmail.email })}
                  </p>
                )}
                <p className="mt-0.5 text-xs text-fg-subtle">{t("app.settings.gmailHint")}</p>
                {gmail?.connected && (
                  <div className="mt-2 space-y-0.5 text-xs text-fg-subtle">
                    <p>
                      {t("app.settings.gmailReadAccess")}:{" "}
                      <span className={gmail.canRead ? "text-success-text" : "text-fg-muted"}>
                        {gmail.canRead ? t("app.settings.gmailEnabled") : t("app.settings.gmailDisabled")}
                      </span>
                    </p>
                    <p>
                      {t("app.settings.gmailSendAccess")}:{" "}
                      <span className={gmail.canSend ? "text-success-text" : "text-fg-muted"}>
                        {gmail.canSend ? t("app.settings.gmailEnabled") : t("app.settings.gmailDisabled")}
                      </span>
                    </p>
                  </div>
                )}
              </div>
            </div>
            {gmail?.connected ? (
              <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
                {!gmail.canSend && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => void handleGmailConnect(true)}
                    disabled={gmailBusy}
                  >
                    {t("app.settings.gmailEnableSend")}
                  </Button>
                )}
                <Link
                  to="/mail"
                  className={buttonClass({
                    variant: gmail.canSend ? "primary" : "secondary",
                    size: "sm",
                  })}
                >
                  {t("app.settings.gmailViewInbox")}
                </Link>
                <Button size="sm" onClick={() => void handleGmailConnect()} disabled={gmailBusy}>
                  {t("app.settings.gmailReconnect")}
                </Button>
                <Button size="sm" onClick={() => void handleGmailDisconnect()} disabled={gmailBusy}>
                  {t("app.settings.gmailDisconnect")}
                </Button>
              </div>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={() => void handleGmailConnect()}
                disabled={gmailBusy}
              >
                {gmailBusy ? t("login.loading") : t("app.settings.gmailConnect")}
              </Button>
            )}
          </div>
        </li>
      </ul>

      {(loadError || banner) && (
        <div className="space-y-2 border-t border-line px-5 py-4">
          {loadError && <Alert tone="danger">{loadError}</Alert>}
          {banner && <Alert tone="info">{banner}</Alert>}
        </div>
      )}
    </Card>
  );
}
