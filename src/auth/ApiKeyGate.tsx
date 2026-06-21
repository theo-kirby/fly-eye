import { useState, type ReactNode } from "react";
import { Icon } from "../components/Icon";
import { setApiKey, useApiKey } from "./useApiKey";

export function ApiKeyGate({ children }: { children: ReactNode }) {
  const key = useApiKey();
  const [input, setInput] = useState("");

  if (key) return <>{children}</>;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (trimmed) setApiKey(trimmed);
  };

  return (
    <div className="app">
      <div className="gate-wrap">
        <form className="gate" onSubmit={onSubmit}>
          <div className="gate-icon" aria-hidden="true">
            <Icon name="key" size={22} />
          </div>
          <h2>Connect to Flywheel</h2>
          <p className="muted">
            Paste your API key to browse the public graph. Stored only in{" "}
            <code>localStorage</code> on this device and sent directly to{" "}
            <code>flywheel.paradigma.inc</code> from your browser.
          </p>
          <input
            type="password"
            autoFocus
            autoComplete="off"
            spellCheck={false}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="fly_..."
            aria-label="Flywheel API key"
          />
          <button type="submit" className="btn btn-primary">
            <Icon name="key" size={14} />
            Save key
          </button>
          <details>
            <summary>How do I get a key?</summary>
            <p>Install the Flywheel CLI, then:</p>
            <pre>
flywheel auth:login{"\n"}flywheel api-keys:create
            </pre>
            <p>
              Or manage keys in the web app at{" "}
              <a
                href="https://flywheel.paradigma.inc/app?settings=user"
                target="_blank"
                rel="noreferrer"
              >
                flywheel.paradigma.inc/app?settings=user{" "}
                <Icon name="external" size={11} />
              </a>
              .
            </p>
          </details>
        </form>
      </div>
    </div>
  );
}
