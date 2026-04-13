import { JSX } from "react";
import { StreamData } from "../types";

interface DashboardProps {
  worldserverSocket?: StreamData;
}

export default function Dashboard({}: DashboardProps): JSX.Element {
  return (
    <div>
      <div className="ayu-page-header">
        <h2 className="ayu-heading">Dashboard</h2>
      </div>
      <div className="ayu-panel p-4 text-ayu-dim text-[12px]">
        Nothing to display here yet.
      </div>
    </div>
  );
}
