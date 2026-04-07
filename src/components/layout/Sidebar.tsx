import { Link, useLocation } from "react-router-dom";

export default function Sidebar() {
  const location = useLocation();

  const menuItems = [
    { label: "Dashboard", icon: "📊", path: "/" },
    { label: "World Server", icon: "🌍", path: "/worldserver" },
    { label: "Database", icon: "💾", path: "/database" },
    { label: "Settings", icon: "⚙️", path: "/settings" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <aside className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col h-screen">
      <div className="p-6 border-b border-gray-700">
        <h1 className="text-xl font-bold text-green-400">Server Manager</h1>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              isActive(item.path)
                ? "bg-green-400 bg-opacity-20 text-green-400 border-l-2 border-green-400"
                : "text-gray-300 hover:bg-gray-700 hover:text-green-400"
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-700">
        <button className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors text-sm">
          Logout
        </button>
      </div>
    </aside>
  );
}
