import { CalendarDays, FileText, Inbox, Mail, Search, Sparkles, type LucideIcon } from "lucide-react";
import { IconTile, type TileTone } from "../../../components/ui/IconTile";
import { cx } from "../../../components/ui/styles";
import { useLocale } from "../../../i18n/LocaleProvider";

/** Gmail + Calendar vignette: a triaged inbox beside today's agenda. Decorative. */
export default function AssistantDemo() {
  const { t } = useLocale();

  const mails: Array<{ title: string; preview: string; icon: LucideIcon; tone: TileTone; action: string; time: string; unread?: boolean }> = [
    { title: t("demo.emailFollowUp"), preview: t("demo.emailFollowUpPreview"), icon: Mail, tone: "primary", action: t("demo.draftReply"), time: "09:12", unread: true },
    { title: t("demo.weeklyReport"), preview: t("demo.weeklyReportPreview"), icon: FileText, tone: "orange", action: t("demo.summarize"), time: "08:47", unread: true },
    { title: t("demo.researchSummary"), preview: t("demo.researchSummaryPreview"), icon: Search, tone: "cyan", action: t("demo.followUp"), time: "08:05" },
  ];

  const events = [
    { time: "10:00", title: t("demo.meetingPrep"), bar: "bg-tint-violet" },
    { time: "13:30", title: t("demo.researchSummary"), bar: "bg-tint-cyan" },
    { time: "16:00", title: t("demo.weeklyReport"), bar: "bg-tint-orange" },
  ];

  return (
    <div className="grid gap-3 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]" aria-hidden="true">
      <div className="min-w-0 overflow-hidden rounded-xl border border-line bg-canvas/60">
        <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
          <Inbox className="h-3.5 w-3.5 text-fg-subtle" />
          <span className="text-xs font-medium text-fg">{t("app.mail.folderInbox")}</span>
        </div>
        <ul className="divide-y divide-line">
          {mails.map((mail) => (
            <li key={mail.title} className="flex items-start gap-3 px-4 py-3">
              <IconTile icon={mail.icon} tone={mail.tone} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  {mail.unread && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary-text" />}
                  <p className={cx("truncate text-sm", mail.unread ? "font-semibold text-fg" : "font-medium text-fg-muted")}>{mail.title}</p>
                  <span className="ml-auto shrink-0 text-[10px] tabular-nums text-fg-subtle">{mail.time}</span>
                </div>
                <p className="mt-0.5 truncate text-xs text-fg-subtle">{mail.preview}</p>
                <span className="mt-2 inline-flex items-center gap-1 rounded-md border border-primary/20 bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary-text">
                  <Sparkles className="h-2.5 w-2.5" />
                  {mail.action}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="min-w-0 overflow-hidden rounded-xl border border-line bg-canvas/60">
        <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
          <CalendarDays className="h-3.5 w-3.5 text-fg-subtle" />
          <span className="truncate text-xs font-medium text-fg">{t("app.calendar.todayTitle")}</span>
        </div>
        <ul className="space-y-2 p-3">
          {events.map((event) => (
            <li key={event.time} className="flex items-stretch gap-3 rounded-lg bg-surface/70 p-2.5">
              <span className={cx("w-1 shrink-0 rounded-full", event.bar)} />
              <div className="min-w-0">
                <p className="text-[10px] font-medium tabular-nums text-fg-subtle">{event.time}</p>
                <p className="truncate text-xs font-medium text-fg">{event.title}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
