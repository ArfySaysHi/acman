import { JSX } from "react";
import { Link } from "react-router-dom";
import { DatabaseTable } from "../types";

export default function Database(): JSX.Element {
  const tables: DatabaseTable[] = [
    { name: "users", rows: 152 },
    { name: "characters", rows: 89 },
    { name: "items", rows: 4521 },
    { name: "accounts", rows: 45 },
    { name: "guilds", rows: 12 },
  ];

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6 text-green-400">Database</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tables.map((table) => (
          <Link
            key={table.name}
            to={`/database/${table.name}`}
            className="bg-gray-800 p-6 rounded border border-gray-700 hover:border-green-400 transition-colors cursor-pointer"
          >
            <h3 className="text-xl font-bold text-green-400">{table.name}</h3>
            <p className="text-gray-400 mt-2">{table.rows} rows</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
