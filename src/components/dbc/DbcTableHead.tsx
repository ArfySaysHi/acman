interface DbcTableHeadProps {
  columns: string[];
}

export default function DbcTableHead({ columns }: DbcTableHeadProps) {
  return (
    <div
      style={{
        overflowX: "hidden",
        borderBottom: "1px solid var(--color-ayu-border)",
        flexShrink: 0,
      }}
      id="dbc-header-scroll"
    >
      <div style={{ display: "flex", minWidth: "max-content" }}>
        <div
          style={{
            width: 48,
            flexShrink: 0,
            padding: "5px 8px",
            fontSize: 10,
            color: "var(--color-ayu-muted)",
            borderRight: "1px solid var(--color-ayu-border)",
            background: "var(--color-ayu-panel)",
          }}
        />
        {columns.map((col, i) => (
          <div
            key={i}
            style={{
              flexShrink: 0,
              padding: "5px 10px",
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--color-ayu-orange)",
              borderRight: "1px solid var(--color-ayu-border)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              background: "var(--color-ayu-panel)",
            }}
            title={col}
          >
            {col}
          </div>
        ))}
      </div>
    </div>
  );
}
