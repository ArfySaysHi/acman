import { DbcValue } from "../../hooks/dbc/useDbcData";

interface DbcCellProps {
  value: DbcValue;
  onClick: () => void;
  onContextMenu: (e: React.MouseEvent<HTMLDivElement>) => void;
  isDirty: boolean;
}

export default function DbcCell({ value, onClick, onContextMenu, isDirty }: DbcCellProps) {
  return (
    <div
      onClick={onClick}
      style={{
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        padding: "0 10px",
        fontSize: 11,
        borderRight: "1px solid var(--color-ayu-border)",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        cursor: "text",
        fontVariantNumeric: "tabular-nums",
        position: "relative",
      }}
      onContextMenu={onContextMenu}
    >
      {isDirty && (
        <span
          style={{
            position: "absolute",
            top: 3,
            left: 3,
            width: 4,
            height: 4,
            borderRadius: "50%",
            background: "var(--color-ayu-orange)",
            flexShrink: 0,
          }}
        />
      )}
      {value === "" && !isDirty ? (
        <span style={{ color: "var(--color-ayu-muted)", fontSize: 9 }}>—</span>
      ) : (
        value
      )}
    </div>
  );
}
