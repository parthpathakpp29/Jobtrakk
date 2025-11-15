"use client";

import { useState } from "react";
import { Send, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/AuthProviderContext";

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<{ sender: "user" | "bot"; text: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const { user } = useAuth();

  const sendMessage = async () => {
    if (!input.trim()) return;

    const newMessage = { sender: "user" as const, text: input };
    setMessages((prev) => [...prev, newMessage]);

    setInput("");
    setLoading(true);

    try {
      // Get the current session token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("No active session");
      }

      const res = await fetch("/api/chat-bot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`, // Pass auth token
        },
        body: JSON.stringify({
          message: newMessage.text,
          userId: user?.id,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Request failed");
      }

      const data = await res.json();

      // If backend returned structured stats, show them first
      if (data.stats) {
        const statsTextParts: string[] = [];
        if (typeof data.stats.totalApplications !== "undefined") {
          statsTextParts.push(`Total applications: ${data.stats.totalApplications}`);
        }
        if (typeof data.stats.upcomingInterviews !== "undefined") {
          statsTextParts.push(`Upcoming interviews: ${data.stats.upcomingInterviews}`);
        }
        if (statsTextParts.length) {
          setMessages((prev) => [
            ...prev,
            { sender: "bot", text: statsTextParts.join(" • ") },
          ]);
        }
      }

      // Bot response
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: data.reply || "Sorry, something went wrong." },
      ]);
    } catch (err) {
      console.error("Chat error:", err);
      setMessages((prev) => [
        ...prev, 
        { sender: "bot", text: "Sorry, something went wrong. Please try again." }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 bg-slate-900 text-white p-4 rounded-full shadow-xl hover:scale-105 transition z-50"
      >
        <MessageSquare className="w-6 h-6" />
      </button>

      {/* Chat Panel */}
      {open && (
        <div className="fixed bottom-20 right-6 w-80 h-[480px] bg-white/90 border border-blue-200 shadow-xl rounded-xl backdrop-blur-xl flex flex-col overflow-hidden z-50">
          <div className="p-4 bg-slate-900 text-white font-semibold">AI Assistant</div>

          {/* Messages */}
          <div className="flex-1 p-3 space-y-3 overflow-y-auto">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`p-2 rounded-lg max-w-[85%] text-sm ${
                  msg.sender === "user"
                    ? "ml-auto bg-blue-600 text-white"
                    : "mr-auto bg-gray-200 text-gray-800"
                }`}
              >
                {msg.text}
              </div>
            ))}

            {loading && <p className="text-xs text-gray-500">AI is typing...</p>}
          </div>

          {/* Input */}
          <div className="border-t p-3 flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !loading && sendMessage()}
              className="flex-1 border rounded-lg px-3 py-2 text-sm"
              placeholder="Ask me anything..."
              disabled={loading}
            />
            <button
              onClick={sendMessage}
              disabled={loading}
              className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}