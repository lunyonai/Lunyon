type PreviewMetricProps = {
  label: string;
  value: string;
};

export default function PreviewMetric({ label, value }: PreviewMetricProps) {
  return (
    <article
      className="rounded-[var(--lunyo-radius)] border border-[var(--lunyo-border)] px-3.5 py-2.5"
      style={{ backgroundColor: "var(--lunyo-surface)" }}
    >
      <p className="text-[11px] text-[var(--lunyo-text-muted)]">{label}</p>
      <p className="mt-1 text-base font-semibold tracking-tight text-[var(--lunyo-text)]">
        {value}
      </p>
    </article>
  );
}
