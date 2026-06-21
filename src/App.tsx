import { Outlet } from "react-router-dom";
import { ApiKeyGate } from "./auth/ApiKeyGate";
import { TopBar } from "./components/TopBar";

export function App() {
  return (
    <ApiKeyGate>
      <div className="app">
        <TopBar />
        <main className="canvas">
          <Outlet />
        </main>
      </div>
    </ApiKeyGate>
  );
}
