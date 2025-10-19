import React from "react";

export default function AgentPanel({ onSubmit, messages, busy, onClose }) {
  const [input, setInput] = React.useState("");

  const submit = async (e) => {
    e?.preventDefault?.();
    const text = input.trim();
    if (!text) return;
    setInput("");
    onSubmit?.(text);
  };

  return (
    <div className="absolute left-4 bottom-20 z-20 w-[420px] max-w-[90vw] rounded-lg border border-gray-700 bg-gray-900/95 backdrop-blur-sm shadow-xl">
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700/70">
        <div className="text-sm font-semibold text-gray-200">Agent</div>
        <button className="text-gray-400 hover:text-white text-xs px-2 py-1" onClick={onClose}>Close</button>
      </div>
      <div className="max-h-[320px] overflow-auto p-3 space-y-2">
        {(messages || []).map((m, i) => (
          <div key={i} className={`text-sm ${m.role === "user" ? "text-gray-200" : "text-gray-300"}`}>
            <span className="uppercase text-[10px] mr-2 text-gray-500">{m.role}</span>
            {m.text}
          </div>
        ))}
        {busy && <div className="text-xs text-blue-400 animate-pulse">Thinking…</div>}
      </div>
      <form onSubmit={submit} className="p-3 border-t border-gray-700/70">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Describe what to create…"
          className="w-full px-3 py-2 rounded bg-gray-800 text-sm text-gray-100 border border-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex justify-end mt-2">
          <button
            type="submit"
            disabled={busy}
            className="px-3 py-1.5 text-sm rounded bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >Send</button>
        </div>
      </form>
    </div>
  );
}


