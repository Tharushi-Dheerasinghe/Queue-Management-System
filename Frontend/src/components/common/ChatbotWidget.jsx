import { useState, useRef, useEffect } from "react";
import api from "../../services/api";

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: "bot", text: "Hello! I am your Smart Queue Assistant. How can I help you today?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setMessages((prev) => [...prev, { sender: "user", text: userMessage }]);
    setInput("");
    setLoading(true);

    try {
      const response = await api.post("/chat", { message: userMessage });
      const reply = response.data?.reply?.trim();
      if (!reply) {
        throw new Error("Empty chatbot response");
      }
      setMessages((prev) => [...prev, { sender: "bot", text: reply }]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text:
            "Sorry, I could not reach the assistant. Please check your connection and try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="mb-4 w-80 sm:w-96 overflow-hidden rounded-2xl bg-white/90 dark:bg-slate-800/95 backdrop-blur-md shadow-2xl border border-white/20 dark:border-slate-700/50 transition-all transform origin-bottom-right duration-300">
          <div className="bg-gradient-to-r from-sky-500 to-indigo-600 p-4 text-white flex justify-between items-center rounded-t-2xl shadow-sm">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-lg">🤖</div>
              <div>
                <h3 className="font-bold text-sm">Smart Queue AI</h3>
                <p className="text-[10px] text-sky-100 opacity-90">Online</p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white transition w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10"
            >
              ✕
            </button>
          </div>

          <div className="h-80 overflow-y-auto p-4 space-y-3 bg-slate-50/50 dark:bg-slate-900/50 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                <div 
                  className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                    msg.sender === "user" 
                      ? "bg-sky-500 text-white rounded-tr-sm" 
                      : "bg-white dark:bg-slate-700 border dark:border-slate-600 text-slate-700 dark:text-slate-100 rounded-tl-sm"
                  }`}
                  style={{ wordBreak: 'break-word' }}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-slate-300 animate-bounce"></span>
                  <span className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: "0.2s" }}></span>
                  <span className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: "0.4s" }}></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSend} className="p-3 bg-white dark:bg-slate-800 border-t dark:border-slate-700 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything..."
              className="flex-1 rounded-full bg-slate-100 dark:bg-slate-700 px-4 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 outline-none focus:ring-2 focus:ring-sky-500 transition"
            />
            <button 
              type="submit" 
              disabled={loading || !input.trim()}
              className="bg-sky-500 text-white w-10 h-10 rounded-full flex items-center justify-center shadow-md hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              ➤
            </button>
          </form>
        </div>
      )}

      {!isOpen && (
        <div className="relative group">
          <div className="absolute -inset-2 bg-gradient-to-r from-sky-400 to-indigo-500 rounded-full blur opacity-40 group-hover:opacity-75 transition duration-1000 animate-pulse"></div>
          <button
            onClick={() => setIsOpen(true)}
            className="relative flex items-center justify-center w-14 h-14 bg-gradient-to-tr from-sky-500 to-indigo-600 rounded-full shadow-xl hover:scale-110 transition-transform duration-300 border-2 border-white/50"
          >
            <span className="text-2xl drop-shadow-md">🤖</span>
            
            {/* Notification Badge */}
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border-2 border-white"></span>
            </span>
          </button>
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] font-bold px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none shadow-lg">
            AI Chatbot
            {/* Triangle pointer */}
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[4px] border-r-[4px] border-t-[4px] border-l-transparent border-r-transparent border-t-slate-800"></div>
          </div>
        </div>
      )}
    </div>
  );
}
