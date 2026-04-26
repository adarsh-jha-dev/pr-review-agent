export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 600, color: "var(--color-text-tertiary)",
      letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 10,
    }}>
      {children}
    </div>
  );
}
