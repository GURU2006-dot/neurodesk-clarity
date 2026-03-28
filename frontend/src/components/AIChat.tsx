import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { useStore } from "../store";

interface Message {
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface AIChatHandle {
  sendMessage: (message: string) => void;
}

const AIChat = forwardRef<AIChatHandle>((_, ref) => {
  const { settings } = useStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load chat history on mount
  useEffect(() => {
    loadHistory();
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadHistory = async () => {
    try {
      const token = localStorage.getItem("nd_token");
      const response = await fetch("http://127.0.0.1:8000/api/chat/history", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error("Failed to load chat history:", error);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setLoading(true);

    // Add user message immediately
    const newUserMessage: Message = {
      role: "user",
      content: userMessage,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, newUserMessage]);

    try {
      const token = localStorage.getItem("nd_token");
      const response = await fetch("http://127.0.0.1:8000/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ message: userMessage })
      });

      const data = await response.json();

      // Add AI response
      const aiMessage: Message = {
        role: "assistant",
        content: data.response || "Sorry, I couldn't process your message.",
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, aiMessage]);

    } catch (error) {
      console.error("Failed to send message:", error);
      const errorMessage: Message = {
        role: "assistant",
        content: "Sorry, I couldn't connect to the AI service. Please try again.",
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  // Expose sendMessage function to parent component
  useImperativeHandle(ref, () => ({
    sendMessage: (message: string) => {
      setInput(message);
      // Trigger send after a small delay to ensure input is set
      setTimeout(() => {
        const event = new KeyboardEvent('keypress', { key: 'Enter' });
        inputRef.current?.dispatchEvent(event);
      }, 100);
    }
  }));

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm h-[600px] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-stone-100">
        <div>
          <div className="text-lg font-bold text-stone-800 flex items-center gap-2">
            🤖 AI Assistant
          </div>
          <div className="text-xs text-stone-500">Ask me anything!</div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearChat}
            className="text-xs text-stone-400 hover:text-stone-600 px-2 py-1 rounded hover:bg-stone-50"
          >
            Clear chat
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-stone-400 mt-8">
            <div className="text-4xl mb-2">💬</div>
            <div className="text-sm">Start a conversation! Ask me anything.</div>
            <div className="text-xs mt-2 text-stone-300">
              Try: "What's the weather like?" or "Help me with my tasks"
            </div>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                  msg.role === "user"
                    ? "bg-emerald-600 text-white"
                    : "bg-stone-100 text-stone-800"
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>
              </div>
            </div>
          ))
        )}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-stone-100 rounded-2xl px-4 py-3 text-sm text-stone-600">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-stone-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                  <div className="w-2 h-2 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                </div>
                Thinking...
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-stone-100">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything..."
            className="flex-1 px-4 py-3 rounded-xl border border-stone-200 focus:border-emerald-400 focus:outline-none text-sm"
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 disabled:bg-stone-300 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "..." : "Send"}
          </button>
        </div>
        <div className="text-xs text-stone-400 mt-2 text-center">
          Press Enter to send • Shift+Enter for new line
        </div>
      </div>
    </div>
  );
});

AIChat.displayName = 'AIChat';

export default AIChat;