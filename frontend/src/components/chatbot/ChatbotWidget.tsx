'use client';

import { useState, useRef, useEffect } from 'react';
import { useChat } from '@ai-sdk/react';
import { MessageCircle, X, Send, Bot, User, Loader2, Trash2 } from 'lucide-react';
import { useLanguageStore } from '@/store/languageStore';
import vi from '@/i18n/vi.json';
import en from '@/i18n/en.json';
import { useAuthStore } from '@/store/authStore';

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const { messages, input, handleInputChange, handleSubmit, isLoading, error, setMessages } = useChat();
  const { language } = useLanguageStore();
  const t = language === 'vi' ? vi : en;
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuthStore();
  const chatHistoryKey = `vanguard_chat_history_${user?.id || 'guest'}`;
  const [loadedKey, setLoadedKey] = useState<string | null>(null);

  // Khôi phục tin nhắn từ localStorage
  useEffect(() => {
    const savedMessages = localStorage.getItem(chatHistoryKey);
    if (savedMessages) {
      try {
        setMessages(JSON.parse(savedMessages));
      } catch (e) {
        console.error("Failed to parse chat history", e);
        setMessages([]);
      }
    } else {
      setMessages([]);
    }
    setLoadedKey(chatHistoryKey);
  }, [setMessages, chatHistoryKey]);

  // Lưu tin nhắn vào localStorage khi có thay đổi
  useEffect(() => {
    if (loadedKey === chatHistoryKey) {
      localStorage.setItem(chatHistoryKey, JSON.stringify(messages));
    }
  }, [messages, loadedKey, chatHistoryKey]);

  // Auto-scroll tới tin nhắn mới nhất
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Khung Chat */}
      {isOpen && (
        <div className="bg-white w-[350px] sm:w-[400px] h-[500px] max-h-[80vh] mb-4 rounded-2xl shadow-2xl border border-neutral-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-300">
          {/* Header */}
          <div className="bg-neutral-900 text-white p-4 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="bg-orange-500 p-1.5 rounded-full">
                <Bot size={20} className="text-white" />
              </div>
              <div>
                <h3 className="font-bold text-sm">{t.chatbot.title}</h3>
                <p className="text-xs text-neutral-400">{t.chatbot.status}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => {
                  setMessages([]);
                  localStorage.removeItem(chatHistoryKey);
                }}
                className="text-neutral-400 hover:text-white transition-colors"
                title={t.chatbot.clear_history}
              >
                <Trash2 size={18} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-neutral-400 hover:text-white transition-colors"
                title={t.chatbot.close}
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-neutral-50">
            {messages.length === 0 && (
              <div className="text-center text-neutral-500 my-8 text-sm">
                <Bot size={32} className="mx-auto mb-3 opacity-50" />
                <p>{t.chatbot.welcome1}</p>
                <p>{t.chatbot.welcome2}</p>
              </div>
            )}

            {messages.map(m => (
              <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${m.role === 'user'
                  ? 'bg-orange-500 text-white rounded-tr-sm'
                  : 'bg-white border border-neutral-200 text-neutral-800 rounded-tl-sm shadow-sm'
                  }`}>
                  {m.content && <div>{m.content}</div>}
                  {m.toolInvocations?.map((toolInvocation: any) => {
                    if (toolInvocation.toolName === 'tim_kiem_san_pham') {
                      if (toolInvocation.state === 'result') {
                        const res = toolInvocation.result;
                        if (typeof res === 'string') {
                          return (
                            <div key={toolInvocation.toolCallId} className="mt-2">
                              {!m.content && <div className="mb-2">{t.chatbot.check_inventory}</div>}
                              <div className="italic text-neutral-500">{res}</div>
                            </div>
                          );
                        }
                        if (Array.isArray(res)) {
                          return (
                            <div key={toolInvocation.toolCallId} className="mt-2 space-y-2">
                              {!m.content && <div className="mb-2">{t.chatbot.found_products}</div>}
                              {res.map((product: any) => (
                                <div key={product.id} className="border border-neutral-100 p-2 rounded-lg bg-neutral-50 flex flex-col cursor-pointer hover:bg-neutral-100" onClick={() => window.location.href = `/shop/${product.slug || product.id}`}>
                                  <p className="font-semibold text-xs text-neutral-900 truncate">{product.name}</p>
                                  <p className="text-xs text-orange-500 font-bold mt-1">
                                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.discountPrice || product.price)}
                                  </p>
                                </div>
                              ))}
                            </div>
                          );
                        }
                      } else {
                        return (
                          <div key={toolInvocation.toolCallId} className="flex items-center space-x-2 text-neutral-500 italic text-xs mt-1">
                            <Loader2 size={12} className="animate-spin" />
                            <span>{t.chatbot.searching}</span>
                          </div>
                        );
                      }
                    }
                    return null;
                  })}
                </div>
              </div>
            ))}

            {error && (
              <div className="flex justify-center my-2">
                <div className="bg-red-100 text-red-600 px-3 py-1.5 rounded-lg text-xs">
                  {t.chatbot.error}{error.message}
                </div>
              </div>
            )}

            {isLoading && messages[messages.length - 1]?.role === 'user' && (
              <div className="flex justify-start">
                <div className="bg-white border border-neutral-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex space-x-1.5">
                  <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce delay-150"></div>
                  <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce delay-300"></div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white border-t border-neutral-100">
            <form onSubmit={handleSubmit} className="relative flex items-center">
              <input
                value={input}
                onChange={handleInputChange}
                placeholder={t.chatbot.placeholder}
                className="w-full bg-neutral-100 text-sm rounded-full pl-4 pr-12 py-3 outline-none focus:ring-2 focus:ring-orange-500/50 transition-all"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="absolute right-1.5 bg-neutral-900 text-white p-2 rounded-full hover:bg-orange-500 transition-colors disabled:opacity-50 disabled:hover:bg-neutral-900"
              >
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} className="ml-0.5" />}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Floating Buttons */}
      {!isOpen && (
        <div className="flex flex-col items-center space-y-4">
          <a
            href="https://zalo.me/0987508715"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white p-2.5 rounded-full shadow-xl hover:scale-105 transition-all duration-300 animate-in zoom-in"
            title="Liên hệ tư vấn qua Zalo"
          >
            <img src="https://upload.wikimedia.org/wikipedia/commons/9/91/Icon_of_Zalo.svg" alt="Zalo" className="w-9 h-9" />
          </a>

          <button
            onClick={() => setIsOpen(true)}
            className="bg-neutral-900 text-white p-4 rounded-full shadow-xl hover:scale-105 hover:bg-orange-500 transition-all duration-300 animate-in zoom-in"
            title="Trợ lí AI"
          >
            <MessageCircle size={24} />
          </button>
        </div>
      )}
    </div>
  );
}
