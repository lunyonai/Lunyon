import { useEffect, useMemo, useState } from "react";
import { Send } from "lucide-react";
import { Alert } from "../../components/ui/Alert";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { cx, inputClass, labelClass, textareaClass } from "../../components/ui/styles";
import { useLocale } from "../../i18n/LocaleProvider";
import {
  api,
  ApiError,
  type GmailMessageDetail,
  type GmailSendPreview,
} from "../../lib/api";

export type ComposeMode = "compose" | "reply" | "replyAll";

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
    <Modal
      title={heading}
      description={sender ?? undefined}
      onClose={onClose}
      busy={busy}
      size="lg"
      closeLabel={t("app.common.close")}
      footer={
        <>
          <Button onClick={onClose} disabled={busy}>
            {t("app.common.cancel")}
          </Button>
          {preview ? (
            <Button variant="primary" onClick={() => void runSend()} disabled={busy}>
              {!busy && <Send aria-hidden="true" />}
              {busy ? t("app.mail.sending") : t("app.mail.confirmSend")}
            </Button>
          ) : (
            <Button variant="primary" onClick={() => void runPreview()} disabled={busy}>
              {busy ? t("app.common.saving") : t("app.mail.reviewSend")}
            </Button>
          )}
        </>
      }
    >
      <div className="space-y-4">
        <label className="block space-y-1.5">
          <span className={cx(labelClass, "block")}>{t("app.mail.fieldTo")}</span>
          <input className={inputClass} value={to} onChange={(event) => setTo(event.target.value)} />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1.5">
            <span className={cx(labelClass, "block")}>{t("app.mail.fieldCc")}</span>
            <input className={inputClass} value={cc} onChange={(event) => setCc(event.target.value)} />
          </label>
          <label className="block space-y-1.5">
            <span className={cx(labelClass, "block")}>{t("app.mail.fieldBcc")}</span>
            <input className={inputClass} value={bcc} onChange={(event) => setBcc(event.target.value)} />
          </label>
        </div>
        <label className="block space-y-1.5">
          <span className={cx(labelClass, "block")}>{t("app.mail.fieldSubject")}</span>
          <input className={inputClass} value={subject} onChange={(event) => setSubject(event.target.value)} />
        </label>
        <label className="block space-y-1.5">
          <span className={cx(labelClass, "block")}>{t("app.mail.fieldBody")}</span>
          <textarea
            className={cx(textareaClass, "min-h-40")}
            value={text}
            onChange={(event) => setText(event.target.value)}
          />
        </label>
        {preview && (
          <div className="rounded-lg border border-line bg-surface-2 p-4 text-sm text-fg-muted">
            <p className="font-medium text-fg">{t("app.mail.confirmTitle")}</p>
            <p className="mt-2 text-xs text-fg-subtle">{preview.summary.from}</p>
            <p className="mt-1">To: {preview.summary.to.join(", ")}</p>
            {preview.summary.cc.length > 0 && <p>Cc: {preview.summary.cc.join(", ")}</p>}
            {preview.summary.bcc.length > 0 && <p>Bcc: {preview.summary.bcc.join(", ")}</p>}
            <p className="mt-2 font-medium text-fg">{preview.summary.subject}</p>
            {preview.summary.threadId && (
              <p className="mt-1 text-xs text-fg-subtle">Thread {preview.summary.threadId}</p>
            )}
            <pre className="mt-2 whitespace-pre-wrap font-sans text-xs leading-5 text-fg-muted">
              {preview.summary.text}
            </pre>
          </div>
        )}
        {error && <Alert tone="danger">{error}</Alert>}
      </div>
    </Modal>
  );
}
