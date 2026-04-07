import "./App.css";
import useStream from "./hooks/useStream";
import Header from "./components/layout/Header";
import Console from "./components/worldserver/Console";

function App() {
  const { stream, connected } = useStream({
    listener: "console-output",
    attach: "attach_worldserver",
    container: "ac-worldserver",
  });

  return (
    <main className="h-screen flex flex-col bg-gray-900 text-green-400 p-4">
      <Header connected={connected} />
      <Console stream={stream} />
    </main>
  );
}

export default App;
