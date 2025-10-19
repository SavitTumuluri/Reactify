import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  SparklesIcon, 
  XMarkIcon, 
  PaperAirplaneIcon,
  UserIcon,
  CpuChipIcon,
  LightBulbIcon
} from "@heroicons/react/24/outline";

export default function AgentPanel({ onSubmit, messages, busy, onClose }) {
  const [input, setInput] = React.useState("");
  const messagesEndRef = React.useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages, busy]);

  const submit = async (e) => {
    e?.preventDefault?.();
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    onSubmit?.(text);
  };

  const suggestions = [
    "Add a blue rectangle in the center",
    "Create a red circle with a border", 
    "Make the background red",
    "Create a yellow star shape",
    "Add a green triangle",
    "What does this application do?",
    "How do I add shapes?",
    "What colors are available?"
  ];

  const handleSuggestion = (suggestion) => {
    setInput(suggestion);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className="absolute left-4 bottom-20 z-20 w-[480px] max-w-[90vw] max-h-[85vh] rounded-2xl border border-gray-700/50 bg-gray-900/95 backdrop-blur-xl shadow-2xl flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700/50 flex-shrink-0 bg-gradient-to-r from-purple-900/20 to-blue-900/20">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600">
            <SparklesIcon className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="text-lg font-semibold text-white">AI Agent</div>
            <div className="text-xs text-gray-400">Describe what you want to create</div>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors group"
        >
          <XMarkIcon className="h-5 w-5 text-gray-400 group-hover:text-white" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0">
        <AnimatePresence>
          {(messages || []).map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {m.role === "assistant" && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center">
                  <CpuChipIcon className="h-4 w-4 text-white" />
                </div>
              )}
              <div className={`max-w-[80%] ${m.role === "user" ? "order-first" : ""}`}>
                <div className={`px-4 py-3 rounded-2xl ${
                  m.role === "user" 
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white" 
                    : "bg-gray-800/50 text-gray-200 border border-gray-700/50"
                }`}>
                  <div className="text-sm leading-relaxed">{m.text}</div>
                </div>
                {m.role === "assistant" && (
                  <div className="text-xs text-gray-500 mt-1 px-1">AI Agent</div>
                )}
              </div>
              {m.role === "user" && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                  <UserIcon className="h-4 w-4 text-gray-300" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        
        {busy && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-3 justify-start"
          >
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center">
              <CpuChipIcon className="h-4 w-4 text-white" />
            </div>
            <div className="bg-gray-800/50 text-gray-200 border border-gray-700/50 px-4 py-3 rounded-2xl">
              <div className="flex items-center gap-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-sm text-gray-400">Thinking...</span>
              </div>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions */}
      {(!messages || messages.length === 0) && (
        <div className="px-6 py-4 border-t border-gray-700/50 bg-gray-800/30">
          <div className="flex items-center gap-2 mb-3">
            <LightBulbIcon className="h-4 w-4 text-yellow-400" />
            <span className="text-sm font-medium text-gray-300">Try these suggestions:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion, i) => (
              <button
                key={i}
                onClick={() => handleSuggestion(suggestion)}
                className="px-3 py-1.5 text-xs bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 rounded-full border border-gray-600/50 transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={submit} className="p-6 border-t border-gray-700/50 flex-shrink-0 bg-gray-800/20">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe what you want to create on the canvas..."
              className="w-full px-4 py-3 pr-12 rounded-xl bg-gray-800/50 text-sm text-gray-100 border border-gray-700/50 outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all placeholder-gray-400"
              disabled={busy}
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <PaperAirplaneIcon className="h-4 w-4 text-white" />
            </button>
          </div>
        </div>
        <div className="flex justify-between items-center mt-3">
          <div className="text-xs text-gray-500">
            Press Enter to send • Shift+Enter for new line
          </div>
          <div className="text-xs text-gray-500">
            {input.length}/500
          </div>
        </div>
      </form>
    </motion.div>
  );
}


