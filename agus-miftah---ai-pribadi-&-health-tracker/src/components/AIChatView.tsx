import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, Sparkles, RefreshCw } from 'lucide-react';
import { ChatMessage, HealthCheckRecord, HabitItem, TransactionLog, ActivityItem } from '../types';

interface AIChatViewProps {
  messages: ChatMessage[];
  onSendMessage: (userText: string) => Promise<void>;
  latestHealthCheck?: HealthCheckRecord;
  habits: HabitItem[];
  transactions: TransactionLog[];
  activities?: ActivityItem[];
  todayDate: string;
}

export function AIChatView({
  messages,
  onSendMessage,
  latestHealthCheck,
  habits,
  transactions,
  activities = [],
  todayDate
}: AIChatViewProps) {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isLoading) return;

    setInputText('');
    setIsLoading(true);
    try {
      await onSendMessage(text);
    } finally {
      setIsLoading(false);
    }
  };

  const quickPrompts = [
    'Apa kegiatan & deadline yang belum kuselesaikan?',
    'Bagaimana hasil tensi & asam uratku?',
    'Tips pantangan makanan asam urat & kolesterol',
    'Semangati aku dong Agus!',
    'Bantu evaluasi minum air & tidurku hari ini'
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-w-lg mx-auto bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
      {/* Chat Header */}
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-800/40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-linear-to-tr from-rose-500 to-indigo-600 flex items-center justify-center text-white shadow-xs">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
              Agus Miftah (AI Pribadi)
            </h2>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
              ● Online & Ramah
            </span>
          </div>
        </div>

        <span className="text-[10px] text-slate-400">Siap bantu 24/7</span>
      </div>

      {/* Messages List */}
      <div className="flex-1 p-3.5 space-y-3 overflow-y-auto">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex gap-2 text-xs ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="w-7 h-7 rounded-full bg-linear-to-tr from-rose-500 to-indigo-600 flex items-center justify-center text-white shrink-0 mt-0.5 shadow-xs">
                  <Bot className="w-3.5 h-3.5" />
                </div>
              )}

              <div
                className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl leading-relaxed whitespace-pre-wrap ${
                  isUser
                    ? 'bg-rose-600 text-white rounded-br-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-xs'
                }`}
              >
                {msg.text}
              </div>

              {isUser && (
                <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0 mt-0.5">
                  <User className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          );
        })}

        {isLoading && (
          <div className="flex gap-2 items-center text-xs text-slate-400">
            <div className="w-7 h-7 rounded-full bg-linear-to-tr from-rose-500 to-indigo-600 flex items-center justify-center text-white shrink-0">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-rose-500" />
              <span>Agus Miftah sedang mengetik...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts */}
      <div className="p-2 border-t border-slate-100 dark:border-slate-800 overflow-x-auto no-scrollbar flex gap-1.5 bg-slate-50/40 dark:bg-slate-800/20">
        {quickPrompts.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(q)}
            disabled={isLoading}
            className="px-2.5 py-1 text-[11px] rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-rose-400 whitespace-nowrap shrink-0 transition-colors"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-2.5 border-t border-slate-100 dark:border-slate-800 flex gap-2 bg-white dark:bg-slate-900"
      >
        <input
          type="text"
          placeholder="Ketik pesan ke AI Agus Miftah..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={isLoading}
          className="flex-1 px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isLoading}
          className="p-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white shadow-xs transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
