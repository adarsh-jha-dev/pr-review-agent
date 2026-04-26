export function MetricCard({ label, value, color, accent }: {
  label: string;
  value: number;
  color: string;
  accent: string;
}) {
  return (
    <div style={{
      background: value > 0 ? accent : "var(--color-background-primary)",
      borderRadius: 10, padding: "14px 16px",
      border: `1px solid ${value > 0 ? color + "30" : "var(--color-border-tertiary)"}`,
      transition: "transform 0.15s, box-shadow 0.15s",
      boxShadow: value > 0 ? `0 2px 8px ${color}15` : "0 1px 3px rgba(0,0,0,0.04)",
    }}>
      <div style={{
        fontSize: 10, color: value > 0 ? color : "var(--color-text-tertiary)",
        marginBottom: 8, fontWeight: 700,
        letterSpacing: "0.06em", textTransform: "uppercase",
      }}>
        {label}
      </div>
      <div style={{
        fontSize: 28, fontWeight: 800,
        color: value > 0 ? color : "var(--color-text-tertiary)",
        lineHeight: 1, letterSpacing: "-0.03em",
      }}>
        {value}
      </div>
    </div>
  );
}
