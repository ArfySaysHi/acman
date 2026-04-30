import { Link, useLocation } from "react-router-dom";

const menuItems = [
  { label: "Dashboard", path: "/" },
  { label: "World Server", path: "/worldserver" },
  { label: "MPQ Editing", path: "/mpq" },
  { label: "Settings", path: "/settings" },
];

export default function Sidebar() {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <aside className="flex flex-col h-screen w-50 shrink-0 bg-ayu-alt border-r border-ayu-border select-none">
      <div className="px-4 py-4 flex items-center gap-2 border-b border-ayu-border">
        <span className="text-ayu-orange text-lg leading-none">◈</span>
        <span className="ayu-heading">Server Mgr</span>
      </div>
      <nav className="flex-1 px-2 py-3 flex flex-col gap-0.5 overflow-y-auto">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`ayu-nav-link ${isActive(item.path) ? "active" : ""}`}
          >
            <span className="text-[8px] opacity-50">●</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
