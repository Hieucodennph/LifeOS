import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { UserProfile } from '../types';
import { Send, Bot, User, Sparkles, AlertCircle, Zap, Brain, Coffee, Target, Plus, Check, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { db, collection, addDoc, serverTimestamp } from '../firebase';
import { cn } from '../lib/utils';

interface Message {
  role: 'user' | 'bot';
  content: string;
  action?: {
    type: 'task' | 'spending' | 'journal';
    data: any;
  };
}

export default function Chat({ uid, profile, initialMessage, onMessageSent }: { 
  uid: string, 
  profile: UserProfile | null,
  initialMessage?: string | null,
  onMessageSent?: () => void
}) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'bot', content: 'Chào bạn! Tôi là trợ lý Life OS. Hôm nay bạn cần tôi hỗ trợ điều gì?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (initialMessage) {
      handleSend(initialMessage);
      if (onMessageSent) onMessageSent();
    }
  }, [initialMessage]);

  const handleSend = async (text?: string) => {
    const messageText = text || input;
    if (!messageText.trim() || isLoading) return;

    const newMessages: Message[] = [...messages, { role: 'user', content: messageText }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const model = genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          { role: 'user', parts: [{ text: `Bạn là trợ lý Life OS, hỗ trợ người dùng quản lý cuộc sống toàn diện.
            Thông tin người dùng: ${profile?.displayName}, Năng lượng: ${profile?.dailyEnergy}%, Mục tiêu: ${profile?.focus3.join(', ')}.
            
            CÁC TÍNH NĂNG BẠN CÓ THỂ HỖ TRỢ:
            1. Quản lý công việc (Task): Có thể hẹn giờ (dueDate).
            2. Quản lý chi tiêu (Spending): Theo dõi số tiền, hạng mục, loại (expense/income), phạm vi (personal/work).
            3. Quản lý kỹ năng (Skill): Lộ trình học tập.
            4. Ghi chú & Nhật ký (Journal): Lưu trữ suy nghĩ, bài học, có tiêu đề (title) và thẻ (tags).

            QUY TẮC PHẢN HỒI:
            - Trả lời ngắn gọn, súc tích, thân thiện.
            - Nếu người dùng muốn thêm task, chi tiêu/thu nhập hoặc ghi chú, hãy trả lời bằng văn bản bình thường VÀ kèm theo một khối JSON ở cuối phản hồi (không hiển thị khối JSON này cho người dùng, chỉ trả về trong text):
              [ACTION: {"type": "task", "data": {"title": "tên task", "dueDate": "ISO string if mentioned"}}]
              HOẶC
              [ACTION: {"type": "spending", "data": {"amount": 10000, "type": "expense", "scope": "personal", "category": "Ăn uống", "note": "ghi chú"}}]
              HOẶC
              [ACTION: {"type": "journal", "data": {"title": "tiêu đề", "content": "nội dung", "mood": "smile|meh|frown", "tags": ["tag1", "tag2"]}}]
            
            LƯU Ý CHO SPENDING:
            - type: "expense" (chi tiêu) hoặc "income" (thu nhập).
            - scope: "personal" (sinh hoạt) hoặc "work" (công việc).
            - category: Hạng mục phù hợp (Lương, Thưởng, Ăn uống, Di chuyển...).
            
            Ví dụ: 
            - "Nhắc tôi đi chợ lúc 5h chiều nay": [ACTION: {"type": "task", "data": {"title": "Đi chợ", "dueDate": "2026-03-27T17:00:00Z"}}]
            - "Ghi chú: Học React rất hay #hoc-tap #lap-trinh": [ACTION: {"type": "journal", "data": {"title": "Học React", "content": "Học React rất hay", "mood": "smile", "tags": ["hoc-tap", "lap-trinh"]}}]
            - "Hôm nay tiêu 50k ăn phở": [ACTION: {"type": "spending", "data": {"amount": 50000, "type": "expense", "scope": "personal", "category": "Ăn uống", "note": "Phở sáng"}}]

            Câu hỏi: ${messageText}` }] }
        ]
      });

      const response = await model;
      const rawText = response.text || '';
      
      // Parse action if exists
      let cleanText = rawText;
      let action = undefined;
      const actionMatch = rawText.match(/\[ACTION: (.*?)\]/);
      if (actionMatch) {
        try {
          action = JSON.parse(actionMatch[1]);
          cleanText = rawText.replace(actionMatch[0], '').trim();
        } catch (e) {
          console.error('Failed to parse action:', e);
        }
      }

      setMessages([...newMessages, { role: 'bot', content: cleanText, action }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages([...newMessages, { role: 'bot', content: 'Có lỗi xảy ra khi kết nối với AI.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const executeAction = async (action: any, msgIndex: number) => {
    try {
      if (action.type === 'task') {
        await addDoc(collection(db, 'tasks'), {
          uid,
          title: action.data.title,
          status: 'todo',
          dueDate: action.data.dueDate || null,
          reminded: false,
          createdAt: serverTimestamp()
        });
      } else if (action.type === 'spending') {
        await addDoc(collection(db, 'spending'), {
          uid,
          amount: Number(action.data.amount),
          type: action.data.type || 'expense',
          scope: action.data.scope || 'personal',
          category: action.data.category || 'Khác',
          note: action.data.note || '',
          createdAt: serverTimestamp()
        });
      } else if (action.type === 'journal') {
        await addDoc(collection(db, 'journal'), {
          uid,
          title: action.data.title || '',
          content: action.data.content,
          mood: action.data.mood || 'smile',
          tags: action.data.tags || [],
          createdAt: serverTimestamp()
        });
      }
      
      // Remove action from message once executed
      const newMessages = [...messages];
      delete newMessages[msgIndex].action;
      setMessages(newMessages);
    } catch (error) {
      console.error('Action failed:', error);
    }
  };

  const quickActions = [
    { label: 'Hoang mang', icon: AlertCircle, color: 'bg-red-50 text-red-600' },
    { label: 'Quá nhiều việc', icon: Zap, color: 'bg-amber-50 text-amber-600' },
    { label: 'Thêm chi tiêu', icon: Coffee, color: 'bg-blue-50 text-blue-600' },
    { label: 'Lên lịch học', icon: Target, color: 'bg-emerald-50 text-emerald-600' },
  ];

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-12rem)] flex flex-col gap-6">
      <header className="space-y-1">
        <h2 className="text-3xl font-serif font-bold">Trợ lý AI</h2>
        <p className="text-slate-500">Hỏi bất kỳ điều gì về công việc, học tập hay cảm xúc.</p>
      </header>

      <div className="flex-1 glass rounded-3xl flex flex-col overflow-hidden">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6">
          <AnimatePresence initial={false}>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "flex gap-4",
                  msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                  msg.role === 'user' ? "bg-slate-900" : "bg-slate-100"
                )}>
                  {msg.role === 'user' ? <User size={16} className="text-white" /> : <Bot size={16} className="text-slate-900" />}
                </div>
                <div className={cn(
                  "max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed space-y-3",
                  msg.role === 'user' ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-700"
                )}>
                  <div className="markdown-body">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>

                  {msg.action && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-white/50 p-3 rounded-xl border border-slate-200 flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-slate-900 rounded-lg">
                          {msg.action.type === 'task' ? <Check size={12} className="text-white" /> : msg.action.type === 'journal' ? <BookOpen size={12} className="text-white" /> : <Zap size={12} className="text-white" />}
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            {msg.action.type === 'task' ? 'Thêm công việc' : msg.action.type === 'journal' ? 'Thêm ghi chú' : 'Thêm chi tiêu'}
                          </p>
                          <p className="text-xs font-semibold">
                            {msg.action.type === 'task' 
                              ? msg.action.data.title 
                              : msg.action.type === 'journal'
                              ? msg.action.data.title || 'Ghi chú mới'
                              : `${msg.action.data.type === 'income' ? '+' : '-'}${msg.action.data.amount.toLocaleString()} đ (${msg.action.data.scope === 'work' ? 'Công việc' : 'Sinh hoạt'})`}
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={() => executeAction(msg.action, i)}
                        className="px-3 py-1.5 bg-slate-900 text-white text-[10px] font-bold rounded-lg hover:bg-slate-800 transition-all flex items-center gap-1"
                      >
                        <Plus size={10} /> Xác nhận
                      </button>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            ))}
            {isLoading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                  <Bot size={16} className="text-slate-900" />
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl flex gap-1">
                  <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="p-6 border-t border-slate-50 space-y-4">
          <div className="flex flex-wrap gap-2">
            {quickActions.map(action => (
              <button
                key={action.label}
                onClick={() => handleSend(action.label)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95",
                  action.color
                )}
              >
                <action.icon size={12} />
                {action.label}
              </button>
            ))}
          </div>

          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="relative"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Nhập tin nhắn..."
              className="w-full pl-4 pr-12 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5"
            />
            <button 
              type="submit"
              disabled={!input.trim() || isLoading}
              className="absolute right-2 top-2 p-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}


