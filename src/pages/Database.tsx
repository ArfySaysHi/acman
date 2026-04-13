import { JSX } from "react";
import { Link } from "react-router-dom";
import { DatabaseTable } from "../types";

export default function Database(): JSX.Element {
  const tables: DatabaseTable[] = [
    { name: "users",      rows: 152  },
    { name: "characters", rows: 89   },
    { name: "items",      rows: 4521 },
    { name: "accounts",   rows: 45   },
    { name: "guilds",     rows: 12   },
  ];

  return (
    <div>
      <div className="ayu-page-header">
        <h2 className="ayu-heading">Database</h2>
        <span className="text-ayu-muted text-[11px]">— {tables.length} tables</span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {tables.map((table) => (
          <Link key={table.name} to={`/database/${table.name}`} className="ayu-db-card">
            <div className="font-semibold text-ayu-cyan text-[12px] mb-1">{table.name}</div>
            <div className="text-ayu-dim text-[11px]">{table.rows.toLocaleString()} rows</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
