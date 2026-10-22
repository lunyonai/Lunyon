import { cardClass, cx } from "../../../components/ui/styles";

type PreviewMetricProps = {
  label: string;
  value: string;
};

export default function PreviewMetric({ label, value }: PreviewMetricProps) {
  return (
    <article className={cx(cardClass, "px-4 py-3")}>
      <p className="truncate text-xs text-fg-muted">{label}</p>
      <p className="mt-1 text-base font-semibold tracking-tight tabular-nums text-fg">{value}</p>
    </article>
  );
}
