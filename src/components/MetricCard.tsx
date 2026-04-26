export function MetricCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{
      background: "var(--color-background-primary)",
      borderRadius: 8, padding: "12px 14px",
      border: "1px solid var(--color-border-tertiary)",
    }}>
      <div style={{
        fontSize: 11, color: "var(--color-text-tertiary)", marginBottom: 6,
        fontWeight: 500, letterSpacing: "0.04em", textTransform: "uppercase",
      }}>
        {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 600, color, lineHeight: 1 }}>{value}</div>
    </div>
  );
}
