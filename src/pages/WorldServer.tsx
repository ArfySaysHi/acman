import { JSX, useState, useEffect, useCallback } from "react";
import Console from "../components/worldserver/Console";
import useStream from "../hooks/useStream";

interface ServerStats {
  status: "online" | "offline" | "starting" | "stopping";
  uptime: string;
  playersOnline: number;
  maxPlayers: number;
  fps: number;
  memoryUsage: number;
  cpuUsage: number;
}

interface LogLevel {
  label: string;
  value: string;
}

interface AdvancedConfig {
  maxPlayers: number;
  serverPort: number;
  databaseHost: string;
  maxMemory: number;
  cpuThreads: number;
  updateRate: number;
}

export default function WorldServer(): JSX.Element {
  const { stream, connected } = useStream({
    listener: "console-output",
    attach: "attach_worldserver",
    container: "ac-worldserver",
  });

  const [stats, setStats] = useState<ServerStats>({
    status: "offline",
    uptime: "0d 0h 0m",
    playersOnline: 0,
    maxPlayers: 100,
    fps: 0,
    memoryUsage: 0,
    cpuUsage: 0,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [logLevel, setLogLevel] = useState<string>("INFO");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [advancedConfig, setAdvancedConfig] = useState<AdvancedConfig>({
    maxPlayers: 100,
    serverPort: 8085,
    databaseHost: "localhost",
    maxMemory: 8192,
    cpuThreads: 4,
    updateRate: 25,
  });
  const [configDirty, setConfigDirty] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>("");

  const logLevels: LogLevel[] = [
    { label: "Debug", value: "DEBUG" },
    { label: "Info", value: "INFO" },
    { label: "Warning", value: "WARNING" },
    { label: "Error", value: "ERROR" },
  ];

  useEffect(() => {
    const loadStats = async (): Promise<void> => {
      try {
        setStats({
          status: connected ? "online" : "offline",
          uptime: "2d 14h 32m",
          playersOnline: Math.floor(Math.random() * 50),
          maxPlayers: 100,
          fps: Math.floor(Math.random() * (60 - 30) + 30),
          memoryUsage: Math.floor(Math.random() * (8000 - 2000) + 2000),
          cpuUsage: Math.floor(Math.random() * 80),
        });
      } catch (err) {
        console.error("Failed to load server stats:", err);
      }
    };

    loadStats();
    const interval = setInterval(loadStats, 5000);
    return () => clearInterval(interval);
  }, [connected]);

  useEffect(() => {
    if (successMessage) {
      const timeout = setTimeout(() => setSuccessMessage(""), 3000);
      return () => clearTimeout(timeout);
    }
  }, [successMessage]);

  const handleStartServer = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      // await invoke("start_worldserver", { container: "ac-worldserver" });
      setStats((prev) => ({ ...prev, status: "starting" }));
      setSuccessMessage("Server starting...");
    } catch (err) {
      console.error("Failed to start server:", err);
      alert(
        `Failed to start server: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleStopServer = useCallback(async (): Promise<void> => {
    if (
      !window.confirm(
        "Are you sure you want to stop the server? This will disconnect all players.",
      )
    )
      return;
    setIsLoading(true);
    try {
      // await invoke("stop_worldserver", { container: "ac-worldserver" });
      setStats((prev) => ({ ...prev, status: "stopping" }));
      setSuccessMessage("Server stopping...");
    } catch (err) {
      console.error("Failed to stop server:", err);
      alert(
        `Failed to stop server: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleRestartServer = useCallback(async (): Promise<void> => {
    if (
      !window.confirm(
        "Are you sure you want to restart the server? This will disconnect all players.",
      )
    )
      return;
    setIsLoading(true);
    try {
      // await invoke("restart_worldserver", { container: "ac-worldserver" });
      setStats((prev) => ({ ...prev, status: "starting" }));
      setSuccessMessage("Server restarting...");
    } catch (err) {
      console.error("Failed to restart server:", err);
      alert(
        `Failed to restart server: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleChangeLogLevel = useCallback(
    async (level: string): Promise<void> => {
      try {
        // await invoke("set_log_level", { level });
        setLogLevel(level);
        setSuccessMessage(`Log level changed to ${level}`);
      } catch (err) {
        console.error("Failed to change log level:", err);
        alert(
          `Failed to change log level: ${err instanceof Error ? err.message : "Unknown error"}`,
        );
      }
    },
    [],
  );

  const handleClearConsole = useCallback((): void => {
    console.log("Console cleared");
    setSuccessMessage("Console cleared");
  }, []);

  const handleSaveConfig = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      // await invoke("save_server_config", { config: advancedConfig });
      setConfigDirty(false);
      setSuccessMessage("Configuration saved successfully");
    } catch (err) {
      console.error("Failed to save configuration:", err);
      alert(
        `Failed to save configuration: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    } finally {
      setIsLoading(false);
    }
  }, [advancedConfig]);

  const handleResetConfig = useCallback((): void => {
    setAdvancedConfig({
      maxPlayers: 100,
      serverPort: 8085,
      databaseHost: "localhost",
      maxMemory: 8192,
      cpuThreads: 4,
      updateRate: 25,
    });
    setConfigDirty(false);
  }, []);

  const handleConfigChange = useCallback(
    (key: keyof AdvancedConfig, value: string | number): void => {
      setAdvancedConfig((prev) => ({
        ...prev,
        [key]: typeof prev[key] === "number" ? Number(value) : value,
      }));
      setConfigDirty(true);
    },
    [],
  );

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "online":
        return "bg-green-500";
      case "offline":
        return "bg-red-500";
      case "starting":
        return "bg-yellow-500";
      case "stopping":
        return "bg-orange-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case "online":
        return "Online";
      case "offline":
        return "Offline";
      case "starting":
        return "Starting...";
      case "stopping":
        return "Stopping...";
      default:
        return "Unknown";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-green-400">World Server</h2>
        <div className="flex items-center gap-3">
          <div
            className={`w-4 h-4 rounded-full ${getStatusColor(stats.status)}`}
          />
          <span className="text-lg text-gray-300">
            {getStatusText(stats.status)}
          </span>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-900 bg-opacity-30 border border-green-600 text-green-400 p-4 rounded">
          {successMessage}
        </div>
      )}

      {/* Server Controls */}
      <div className="bg-gray-800 border border-gray-700 rounded p-6">
        <h3 className="text-xl font-semibold text-green-400 mb-4">
          Server Controls
        </h3>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={handleStartServer}
            disabled={
              isLoading ||
              stats.status === "online" ||
              stats.status === "starting"
            }
            className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded transition-colors font-semibold"
          >
            {isLoading && stats.status === "starting"
              ? "Starting..."
              : "Start Server"}
          </button>
          <button
            onClick={handleRestartServer}
            disabled={isLoading || stats.status === "offline"}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded transition-colors font-semibold"
          >
            {isLoading &&
            (stats.status === "stopping" || stats.status === "starting")
              ? "Restarting..."
              : "Restart Server"}
          </button>
          <button
            onClick={handleStopServer}
            disabled={
              isLoading ||
              stats.status === "offline" ||
              stats.status === "stopping"
            }
            className="px-6 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded transition-colors font-semibold"
          >
            {isLoading && stats.status === "stopping"
              ? "Stopping..."
              : "Stop Server"}
          </button>
        </div>
      </div>

      {/* Server Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-gray-800 p-6 rounded border border-gray-700">
          <div className="text-gray-400 text-sm font-semibold mb-2">Uptime</div>
          <div className="text-2xl font-bold text-green-400">
            {stats.uptime}
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded border border-gray-700">
          <div className="text-gray-400 text-sm font-semibold mb-2">
            Players Online
          </div>
          <div className="text-2xl font-bold text-green-400">
            {stats.playersOnline} / {stats.maxPlayers}
          </div>
          <div className="mt-3 w-full bg-gray-700 rounded h-2">
            <div
              className="bg-green-500 h-2 rounded transition-all"
              style={{
                width: `${(stats.playersOnline / stats.maxPlayers) * 100}%`,
              }}
            />
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded border border-gray-700">
          <div className="text-gray-400 text-sm font-semibold mb-2">FPS</div>
          <div className="text-2xl font-bold text-green-400">{stats.fps}</div>
        </div>

        <div className="bg-gray-800 p-6 rounded border border-gray-700">
          <div className="text-gray-400 text-sm font-semibold mb-2">
            Memory Usage
          </div>
          <div className="text-2xl font-bold text-green-400">
            {stats.memoryUsage} MB
          </div>
          <div className="mt-3 w-full bg-gray-700 rounded h-2">
            <div
              className={`h-2 rounded transition-all ${
                stats.memoryUsage > advancedConfig.maxMemory * 0.9
                  ? "bg-red-500"
                  : stats.memoryUsage > advancedConfig.maxMemory * 0.7
                    ? "bg-yellow-500"
                    : "bg-blue-500"
              }`}
              style={{
                width: `${(stats.memoryUsage / advancedConfig.maxMemory) * 100}%`,
              }}
            />
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded border border-gray-700">
          <div className="text-gray-400 text-sm font-semibold mb-2">
            CPU Usage
          </div>
          <div className="text-2xl font-bold text-green-400">
            {stats.cpuUsage}%
          </div>
          <div className="mt-3 w-full bg-gray-700 rounded h-2">
            <div
              className={`h-2 rounded transition-all ${
                stats.cpuUsage > 80
                  ? "bg-red-500"
                  : stats.cpuUsage > 50
                    ? "bg-yellow-500"
                    : "bg-green-500"
              }`}
              style={{ width: `${stats.cpuUsage}%` }}
            />
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded border border-gray-700">
          <div className="text-gray-400 text-sm font-semibold mb-2">Status</div>
          <div
            className={`text-2xl font-bold ${connected ? "text-green-400" : "text-red-400"}`}
          >
            {connected ? "Connected" : "Disconnected"}
          </div>
        </div>
      </div>

      {/* Console */}
      <div className="bg-gray-800 border border-gray-700 rounded p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-green-400">Console</h3>
          <div className="flex gap-2">
            <select
              value={logLevel}
              onChange={(e) => handleChangeLogLevel(e.target.value)}
              className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-green-400 focus:outline-none focus:border-green-400"
            >
              {logLevels.map((level) => (
                <option key={level.value} value={level.value}>
                  {level.label}
                </option>
              ))}
            </select>
            <button
              onClick={handleClearConsole}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
            >
              Clear
            </button>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
            >
              {showAdvanced ? "Hide Config" : "Advanced Config"}
            </button>
          </div>
        </div>
        <Console stream={stream} />
      </div>

      {/* Advanced Config */}
      {showAdvanced && (
        <div className="bg-gray-800 border border-gray-700 rounded p-6">
          <h3 className="text-xl font-semibold text-green-400 mb-4">
            Advanced Configuration
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-400 text-sm mb-1">
                Max Players
              </label>
              <input
                type="number"
                value={advancedConfig.maxPlayers}
                onChange={(e) =>
                  handleConfigChange("maxPlayers", e.target.value)
                }
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-green-400"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-1">
                Server Port
              </label>
              <input
                type="number"
                value={advancedConfig.serverPort}
                onChange={(e) =>
                  handleConfigChange("serverPort", e.target.value)
                }
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-green-400"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-1">
                Database Host
              </label>
              <input
                type="text"
                value={advancedConfig.databaseHost}
                onChange={(e) =>
                  handleConfigChange("databaseHost", e.target.value)
                }
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-green-400"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-1">
                Max Memory (MB)
              </label>
              <input
                type="number"
                value={advancedConfig.maxMemory}
                onChange={(e) =>
                  handleConfigChange("maxMemory", e.target.value)
                }
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-green-400"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-1">
                CPU Threads
              </label>
              <input
                type="number"
                value={advancedConfig.cpuThreads}
                onChange={(e) =>
                  handleConfigChange("cpuThreads", e.target.value)
                }
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-green-400"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-1">
                Update Rate (ms)
              </label>
              <input
                type="number"
                value={advancedConfig.updateRate}
                onChange={(e) =>
                  handleConfigChange("updateRate", e.target.value)
                }
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-green-400"
              />
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button
              onClick={handleSaveConfig}
              disabled={!configDirty || isLoading}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded transition-colors font-semibold"
            >
              {isLoading ? "Saving..." : "Save Changes"}
            </button>
            <button
              onClick={handleResetConfig}
              disabled={!configDirty}
              className="px-6 py-2 bg-gray-600 hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
