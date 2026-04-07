export default function Dashboard(): JSX.Element {
  return (
    <div>
      <h2 className="text-3xl font-bold mb-6 text-green-400">Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-800 p-6 rounded border border-gray-700">
          <div className="text-gray-400 text-sm">Server Status</div>
          <div className="text-2xl font-bold text-green-400 mt-2">Online</div>
        </div>
        <div className="bg-gray-800 p-6 rounded border border-gray-700">
          <div className="text-gray-400 text-sm">Players Online</div>
          <div className="text-2xl font-bold text-green-400 mt-2">0</div>
        </div>
        <div className="bg-gray-800 p-6 rounded border border-gray-700">
          <div className="text-gray-400 text-sm">Uptime</div>
          <div className="text-2xl font-bold text-green-400 mt-2">12h 45m</div>
        </div>
        <div className="bg-gray-800 p-6 rounded border border-gray-700">
          <div className="text-gray-400 text-sm">Database Size</div>
          <div className="text-2xl font-bold text-green-400 mt-2">2.4 GB</div>
        </div>
      </div>
    </div>
  );
}
