import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { useLocale } from "../../i18n/LocaleProvider";
import {
  api,
  ApiError,
  type GmailMessageDetail,
  type GmailSendPreview,
} from "../../lib/api";

export type ComposeMode = "compose" | "reply" | "replyAll";

const fieldClass =
  "mt-2 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500";

function splitEmails(value: string) {
  return value
    .split(/[,;]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function extractAddress(value: string) {
  const match = value.match(/<([^>]+)>/);
  return (match?.[1] ?? value).trim();
}

function newKey() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function replySubject(subject: string | null) {
  const value = subject?.trim() || "";
  return /^re:/i.test(value) ? value : `Re: ${value || "Message"}`;
}

export default function ComposeMailModal({
  mode,
  sender,
  original,
  onClose,
  onSent,
}: {
  mode: ComposeMode;
  sender: string | null;
  original?: GmailMessageDetail | null;
  onClose: () => void;
  onSent: (message: string) => void;
}) {
  const { t } = useLocale();
  const isReply = mode !== "compose";
  const self = (sender ?? "").toLowerCase();

  const initialTo = useMemo(() => {
    if (!isReply || !original) return "";
    if (mode === "reply") return extractAddress(original.from ?? "");
    const people = [original.from, original.to, original.cc]
      .flatMap((item) => (item ? item.split(",") : []))
      .map(extractAddress)
      .filter((email) => email && email.toLowerCase() !== self);
    return [...new Set(people)].join(", ");
  }, [isReply, mode, original, self]);

  const [to, setTo] = useState(initialTo);
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [subject, setSubject] = useState(isReply ? replySubject(original?.subject ?? null) : "");
  const [text, setText] = useState("");
  const [preview, setPreview] = useState<GmailSendPreview | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState(newKey);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setPreview(null);
    setIdempotencyKey(newKey());
  }, [to, cc, bcc, subject, text]);

  const heading =
    mode === "replyAll"
      ? t("app.mail.replyAll")
      : mode === "reply"
        ? t("app.mail.reply")
        : t("app.mail.compose");

  async function runPreview() {
    if (busy) return;
    const recipients = splitEmails(to);
    if (recipients.length === 0) {
      setError(t("app.common.required"));
      return;
    }
    setBusy(true);
    setError("");
    try {
      const body = {
        idempotencyKey,
        to: recipients,
        cc: splitEmails(cc),
        bcc: splitEmails(bcc),
        subject: subject.trim(),
        text: text.trim(),
        replyAll: mode === "replyAll",
      };
      const next = original?.id && isReply
        ? await api.previewGmailReply(original.id, body)
        : await api.previewGmailSend(body);
      setPreview(next);
    } catch (err) {
      if (err instanceof ApiError && err.code === "GMAIL_SEND_SCOPE") {
        setError(t("app.mail.sendRequired"));
      } else {
        setError(t("app.mail.sendError"));
      }
    } finally {
      setBusy(false);
    }
  }

  async function runSend() {
    if (!preview || busy) return;
    setBusy(true);
    setError("");
    try {
      const result =
        original?.id && isReply
          ? await api.commitGmailReply(original.id, preview.confirmationToken)
          : await api.commitGmailSend(preview.confirmationToken);
      if (!result.ok && !result.replayed) {
        setError(t("app.mail.sendError"));
        return;
      }
      onSent(t("app.mail.sendSuccess"));
    } catch {
      setError(t("app.mail.sendError"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label={t("app.common.close")}
        onClick={busy ? undefined : onClose}
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
      />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-slate-800 bg-slate-950 shadow-2xl shadow-black/50">
        <div className="flex items-start justify-between border-b border-slate-800 p-6">
          <div>
            <h2 className="text-base font-semibold text-white">{heading}</h2>
            {sender && <p className="mt-1 text-xs text-slate-500">{sender}</p>}
          </div>
          <button type="button" onClick={onClose} disabled={busy} className="rounded-lg p-1 text-slate-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto p-6">
          <label className="block text-sm text-slate-300">
            {t("app.mail.fieldTo")}
            <input className={fieldClass} value={to} onChange={(event) => setTo(event.target.value)} />
          </label>
          <label className="block text-sm text-slate-300">
            {t("app.mail.fieldCc")}
            <input className={fieldClass} value={cc} onChange={(event) => setCc(event.target.value)} />
          </label>
          <label className="block text-sm text-slate-300">
            {t("app.mail.fieldBcc")}
            <input className={fieldClass} value={bcc} onChange={(event) => setBcc(event.target.value)} />
          </label>
          <label className="block text-sm text-slate-300">
            {t("app.mail.fieldSubject")}
            <input className={fieldClass} value={subject} onChange={(event) => setSubject(event.target.value)} />
          </label>
          <label className="block text-sm text-slate-300">
            {t("app.mail.fieldBody")}
            <textarea
              className={`${fieldClass} min-h-40`}
              value={text}
              onChange={(event) => setText(event.target.value)}
            />
          </label>
          {preview && (
            <div className="rounded-xl border border-slate-800 p-3 text-sm text-slate-300">
              <p className="font-medium text-white">{t("app.mail.confirmTitle")}</p>
              <p className="mt-2 text-xs text-slate-500">{preview.summary.from}</p>
              <p className="mt-1">To: {preview.summary.to.join(", ")}</p>
              {preview.summary.cc.length > 0 && <p>Cc: {preview.summary.cc.join(", ")}</p>}
              {preview.summary.bcc.length > 0 && <p>Bcc: {preview.summary.bcc.join(", ")}</p>}
              <p className="mt-2 font-medium">{preview.summary.subject}</p>
              {preview.summary.threadId && (
                <p className="mt-1 text-xs text-slate-500">Thread {preview.summary.threadId}</p>
              )}
              <pre className="mt-2 whitespace-pre-wrap text-xs text-slate-400">{preview.summary.text}</pre>
            </div>
          )}
          {error && <p className="text-sm text-red-400">{error}</p>}
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-800 p-6">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="flex h-10 items-center rounded-xl border border-slate-800 px-4 text-sm font-medium text-slate-300"
          >
            {t("app.common.cancel")}
          </button>
          {preview ? (
            <button
              type="button"
              onClick={() => void runSend()}
              disabled={busy}
              className="flex h-10 items-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
            >
              {busy ? t("app.mail.sending") : t("app.mail.confirmSend")}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void runPreview()}
              disabled={busy}
              className="flex h-10 items-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
            >
              {busy ? t("app.common.saving") : t("app.mail.reviewSend")}
            </button>
          )}
        </div>
      </aside>
    </div>
  );
}
