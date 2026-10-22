import { useMemo, useState } from "react";
import { Card, CardHeader } from "../../../components/ui/Card";
import { cx } from "../../../components/ui/styles";
import { useLocale } from "../../../i18n/LocaleProvider";
import { useActivity } from "../../activity/ActivityContext";
import { buildDayBuckets, type SeriesKey } from "../activitySeries";

/** Fixed categorical order (validated palette): color follows the type, never its rank. */
const SERIES: Array<{ key: SeriesKey; swatch: string; label: string }> = [
  { key: "prompt", swatch: "bg-viz-1", label: "app.dashboard.filterPrompt" },
  { key: "workflow", swatch: "bg-viz-2", label: "app.dashboard.filterWorkflow" },
  { key: "employee", swatch: "bg-viz-3", label: "app.dashboard.filterEmployee" },
];

/** Round the axis top up to a multiple of 4 so the mid gridline is a whole number. */
function niceMax(value: number) {
  if (value <= 4) return 4;
  return Math.ceil(value / 4) * 4;
}

export default function ActivityChart() {
  const { t, locale } = useLocale();
  const { activities } = useActivity();
  const [active, setActive] = useState<number | null>(null);

  const buckets = useMemo(() => buildDayBuckets(activities, locale), [activities, locale]);
  const max = niceMax(Math.max(0, ...buckets.map((bucket) => bucket.total)));
  const weekTotal = buckets.reduce((sum, bucket) => sum + bucket.total, 0);
  const ticks = [max, max / 2, 0];

  return (
    <Card padded={false}>
      <div className="flex flex-wrap items-start justify-between gap-4 px-5 pt-5">
        <CardHeader title={t("app.dashboard.chartTitle")} description={t("app.dashboard.chartSubtitle")} />
        <div className="text-right">
          <p className="text-2xl font-semibold tracking-tight tabular-nums text-fg">{weekTotal}</p>
          <p className="text-xs text-fg-subtle">{t("app.dashboard.chartTotal")}</p>
        </div>
      </div>

      <ul className="flex flex-wrap gap-x-4 gap-y-1 px-5 pt-4" aria-label={t("app.dashboard.chartTable")}>
        {SERIES.map((series) => (
          <li key={series.key} className="flex items-center gap-1.5 text-xs text-fg-muted">
            <span className={cx("h-2.5 w-2.5 rounded-[3px]", series.swatch)} aria-hidden="true" />
            {t(series.label)}
          </li>
        ))}
      </ul>

      <div className="relative px-5 pb-5 pt-4" aria-hidden="true">
        <div className="relative flex h-48">
          {/* y-axis labels + recessive gridlines */}
          <div className="flex w-7 shrink-0 flex-col justify-between pr-2 text-right text-[11px] tabular-nums text-fg-subtle">
            {ticks.map((tick) => (
              <span key={tick} className="-translate-y-1/2 first:translate-y-0 last:translate-y-0 leading-none">
                {tick}
              </span>
            ))}
          </div>
          <div className="relative flex-1">
            <div className="pointer-events-none absolute inset-0 flex flex-col justify-between">
              <span className="border-t border-dashed border-line" />
              <span className="border-t border-dashed border-line" />
              <span className="border-t border-line-strong" />
            </div>

            <div className="relative flex h-full items-end gap-2 sm:gap-4">
              {buckets.map((bucket, index) => (
                <div
                  key={bucket.key}
                  className="relative flex h-full flex-1 items-end justify-center"
                  onMouseEnter={() => setActive(index)}
                  onMouseLeave={() => setActive(null)}
                >
                  {active === index && <span className="absolute inset-y-0 -inset-x-1 rounded-md bg-surface-2/70" />}
                  {bucket.total > 0 && (
                    <div
                      className="relative flex w-full max-w-9 flex-col-reverse gap-[2px] overflow-hidden rounded-t-[4px]"
                      style={{ height: `${(bucket.total / max) * 100}%` }}
                    >
                      {SERIES.filter((series) => bucket.counts[series.key] > 0).map((series) => (
                        <span
                          key={series.key}
                          className={cx("min-h-[3px] w-full", series.swatch)}
                          style={{ flexGrow: bucket.counts[series.key], flexBasis: 0 }}
                        />
                      ))}
                    </div>
                  )}

                  {active === index && (
                    <div
                      className={cx(
                        "absolute bottom-full z-10 mb-2 w-44 rounded-lg border border-line bg-surface p-2.5 text-xs shadow-overlay",
                        index > 4 ? "right-0" : index < 2 ? "left-0" : "left-1/2 -translate-x-1/2",
                      )}
                    >
                      <p className="font-medium text-fg">{bucket.long}</p>
                      <ul className="mt-1.5 space-y-1">
                        {SERIES.map((series) => (
                          <li key={series.key} className="flex items-center justify-between gap-2 text-fg-muted">
                            <span className="flex items-center gap-1.5">
                              <span className={cx("h-2 w-2 rounded-[2px]", series.swatch)} />
                              {t(series.label)}
                            </span>
                            <span className="tabular-nums text-fg">{bucket.counts[series.key]}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {weekTotal === 0 && (
              <p className="absolute inset-0 flex items-center justify-center text-sm text-fg-subtle">
                {t("app.dashboard.chartEmpty")}
              </p>
            )}
          </div>
        </div>

        <div className="ml-7 mt-2 flex gap-2 sm:gap-4">
          {buckets.map((bucket) => (
            <span
              key={bucket.key}
              className={cx(
                "flex-1 text-center text-[11px] capitalize",
                bucket.isToday ? "font-semibold text-fg" : "text-fg-subtle",
              )}
            >
              {bucket.short}
            </span>
          ))}
        </div>
      </div>

      {/* Table view for screen readers (the plot itself is aria-hidden). */}
      <table className="sr-only">
        <caption>{t("app.dashboard.chartTable")}</caption>
        <thead>
          <tr>
            <th scope="col">{t("app.dashboard.chartDay")}</th>
            {SERIES.map((series) => (
              <th key={series.key} scope="col">
                {t(series.label)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {buckets.map((bucket) => (
            <tr key={bucket.key}>
              <th scope="row">{bucket.long}</th>
              {SERIES.map((series) => (
                <td key={series.key}>{bucket.counts[series.key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
