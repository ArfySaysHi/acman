import "./App.css";
import Header from "./components/layout/Header";
import Sidebar from "./components/layout/Sidebar";
import { useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import WorldServer from "./pages/WorldServer";
import Database from "./pages/Database";
import DatabaseTable from "./pages/DatabaseTable";
import Settings from "./pages/Settings";

function App() {
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
      <div className="flex h-screen bg-gray-900 text-green-400">
        <Sidebar />
        <main className="flex-1 flex flex-col overflow-hidden">
          <Header connected />
          <div className="flex-1 overflow-auto p-4">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/worldserver" element={<WorldServer />} />
              <Route path="/database" element={<Database />} />
              <Route path="/database/:tableName" element={<DatabaseTable />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </div>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
