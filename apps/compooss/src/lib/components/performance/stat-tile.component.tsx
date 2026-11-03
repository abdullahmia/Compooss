type Props = {
  label: string;
  value: string;
  detail?: string;
};

/** A single headline number. Proportional figures: the value stands alone. */
export const StatTile: React.FC<Props> = ({ label, value, detail }) => (
  <div className="border border-border rounded-lg bg-card px-4 py-3 min-w-0">
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="text-xl font-semibold text-foreground mt-1 truncate">{value}</p>
    {detail && <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{detail}</p>}
  </div>
);
