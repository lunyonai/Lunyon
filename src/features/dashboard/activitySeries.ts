import { localeMeta, type Locale } from "../../i18n/config";
import type { ActivityRecord } from "../../lib/api";

export type SeriesKey = ActivityRecord["type"];

export type DayBucket = {
  key: string;
  short: string;
  long: string;
  isToday: boolean;
  counts: Record<SeriesKey, number>;
  total: number;
};

function localDayKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function capitalize(label: string) {
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/**
 * Last seven local days (oldest first) with run counts per type. Built from the recent
 * activity list the API returns (latest 30 records), so busy weeks are a lower bound.
 */
export function buildDayBuckets(activities: ActivityRecord[], locale: Locale): DayBucket[] {
  const lang = localeMeta[locale].htmlLang;
  const shortFmt = new Intl.DateTimeFormat(lang, { weekday: "short" });
  const longFmt = new Intl.DateTimeFormat(lang, { weekday: "long", day: "numeric", month: "short" });
  const today = new Date();
  const buckets: DayBucket[] = [];
  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - offset);
    buckets.push({
      key: localDayKey(date),
      short: shortFmt.format(date).replace(".", ""),
      long: capitalize(longFmt.format(date)),
      isToday: offset === 0,
      counts: { prompt: 0, workflow: 0, employee: 0 },
      total: 0,
    });
  }
  const byKey = new Map(buckets.map((bucket) => [bucket.key, bucket]));
  for (const activity of activities) {
    const bucket = byKey.get(localDayKey(new Date(activity.createdAt)));
    if (!bucket) continue;
    bucket.counts[activity.type] += 1;
    bucket.total += 1;
  }
  return buckets;
}

/** Daily counts for one type (or all types), oldest first. */
export function seriesFor(buckets: DayBucket[], key?: SeriesKey) {
  return buckets.map((bucket) => (key ? bucket.counts[key] : bucket.total));
}

/** Today minus yesterday, formatted with an explicit sign ("+3", "−1", "0"). */
export function dayOverDay(series: number[]) {
  const delta = (series.at(-1) ?? 0) - (series.at(-2) ?? 0);
  return { delta, label: delta > 0 ? `+${delta}` : delta < 0 ? `−${Math.abs(delta)}` : "0" };
}
