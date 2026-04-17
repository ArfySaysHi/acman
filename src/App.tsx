import "./App.css";
import Sidebar from "./components/layout/Sidebar";
import { useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import WorldServer from "./pages/WorldServer";
import Database from "./pages/Database";
import DatabaseTable from "./pages/DatabaseTable";
import Settings from "./pages/Settings";
import useStream from "./hooks/useStream";
import CreateSpell from "./pages/create/CreateSpell";
import QuickMpq from "./pages/QuickMpq";
import Mpq from "./pages/Mpq";

function App() {
  const worldserverSocket = useStream({
    attach: "attach_worldserver",
    listener: "worldserver-output",
    container: "ac-worldserver",
  });

  const strictModePlacator = useRef(false);

  useEffect(() => {
    if (strictModePlacator.current) return;
    strictModePlacator.current = true;
    const setupDockerEvents = async () => {
      await invoke("get_docker_event_stream");
    };
    setupDockerEvents();
  }, []);

  return (
    <BrowserRouter>
      <div className="flex h-screen overflow-hidden bg-ayu-bg text-ayu-fg">
        <Sidebar />
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-hidden flex flex-col">
            <Routes>
              <Route
                path="/"
                element={
                  <div className="overflow-auto h-full p-5">
                    <Dashboard />
                  </div>
                }
              />
              <Route
                path="/worldserver"
                element={
                  <div className="overflow-auto h-full p-5">
                    <WorldServer worldserverSocket={worldserverSocket} />
                  </div>
                }
              />
              <Route
                path="/database"
                element={
                  <div className="overflow-auto h-full p-5">
                    <Database />
                  </div>
                }
              />
              <Route
                path="/database/:tableName"
                element={
                  <div className="overflow-auto h-full p-5">
                    <DatabaseTable />
                  </div>
                }
              />
              <Route
                path="/settings"
                element={
                  <div className="overflow-auto h-full p-5">
                    <Settings />
                  </div>
                }
              />
              <Route
                path="/temppage"
                element={
                  <div className="overflow-auto h-full p-5">
                    <CreateSpell />
                  </div>
                }
              />
              <Route
                path="/quickmpq"
                element={
                  <div className="overflow-auto h-full p-5">
                    <QuickMpq />
                  </div>
                }
              />
              <Route
                path="/mpq"
                element={
                  <div className="overflow-hidden flex flex-col h-full p-5">
                    <Mpq />
                  </div>
                }
              />
            </Routes>
          </div>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
