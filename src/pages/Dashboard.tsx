import { JSX } from "react";
import { StreamData } from "../types";

interface DashboardProps {
  worldserverSocket?: StreamData;
}

export default function Dashboard({}: DashboardProps): JSX.Element {
  return (
    <div>
      <h2 className="text-3xl font-bold mb-6 text-green-400">Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        Nothing to display here yet realistically...
      </div>
    </div>
  );
}
