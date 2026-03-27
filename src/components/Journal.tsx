import React, { useState, useEffect } from 'react';
import { db, collection, query, where, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, orderBy, limit } from '../firebase';
import { JournalEntry } from '../types';
import { Plus, Trash2, Calendar, Smile, Meh, Frown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

import { cn } from '../lib/utils';

export default function Journal({ uid }: { uid: string }) {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [mood, setMood] = useState('smile');
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');

  useEffect(() => {
    const q = query(
      collection(db, 'journal'), 
      where('uid', '==', uid), 
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    const unsub = onSnapshot(q, (snap) => {
      setEntries(snap.docs.map(d => ({ id: d.id, ...d.data() } as JournalEntry)));
    });
    return () => unsub();
  }, [uid]);

  const addEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;
    await addDoc(collection(db, 'journal'), {
      uid,
      title: newTitle,
      content: newContent,
      mood,
      tags,
      createdAt: serverTimestamp()
    });
    setNewTitle('');
    setNewContent('');
    setTags([]);
  };

  const addTag = () => {
    if (currentTag && !tags.includes(currentTag)) {
      setTags([...tags, currentTag]);
      setCurrentTag('');
    }
  };

  const removeTag = (t: string) => {
    setTags(tags.filter(tag => tag !== t));
  };

  const getMoodIcon = (m: string) => {
    switch (m) {
      case 'smile': return <Smile className="text-emerald-500" size={20} />;
      case 'meh': return <Meh className="text-amber-500" size={20} />;
      case 'frown': return <Frown className="text-red-500" size={20} />;
      default: return <Smile size={20} />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <header className="space-y-1">
        <h2 className="text-3xl font-serif font-bold">Ghi chú & Nhật ký</h2>
        <p className="text-slate-500">Lưu lại những suy nghĩ, bài học và ghi chú quan trọng.</p>
      </header>

      <form onSubmit={addEntry} className="glass p-6 rounded-3xl space-y-4">
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Tiêu đề ghi chú (không bắt buộc)"
          className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-slate-900/5"
        />
        <textarea
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          placeholder="Hôm nay bạn thế nào? Bạn đã học được gì?"
          className="w-full h-32 p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5 resize-none"
        />
        
        <div className="flex flex-wrap gap-2">
          {tags.map(t => (
            <span key={t} className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold flex items-center gap-1">
              {t} <button type="button" onClick={() => removeTag(t)} className="hover:text-red-500">×</button>
            </span>
          ))}
          <div className="flex gap-1">
            <input
              value={currentTag}
              onChange={(e) => setCurrentTag(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              placeholder="Thêm tag..."
              className="px-2 py-1 bg-transparent border-b border-slate-200 text-[10px] focus:outline-none focus:border-slate-900"
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {[
              { id: 'smile', icon: Smile },
              { id: 'meh', icon: Meh },
              { id: 'frown', icon: Frown },
            ].map(m => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMood(m.id)}
                className={cn(
                  "p-2 rounded-xl transition-all",
                  mood === m.id ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                )}
              >
                <m.icon size={20} />
              </button>
            ))}
          </div>
          <button type="submit" className="px-6 py-2 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors flex items-center gap-2">
            <Plus size={18} /> Lưu ghi chú
          </button>
        </div>
      </form>

      <div className="grid sm:grid-cols-2 gap-6">
        <AnimatePresence>
          {entries.map((entry, i) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass p-6 rounded-3xl space-y-4 card-hover flex flex-col"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getMoodIcon(entry.mood)}
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {entry.createdAt ? format(entry.createdAt.toDate(), 'dd/MM/yyyy', { locale: vi }) : '...'}
                  </span>
                </div>
                <button 
                  onClick={() => deleteDoc(doc(db, 'journal', entry.id))}
                  className="p-1 text-slate-200 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <div className="flex-1 space-y-2">
                {entry.title && <h4 className="font-bold text-slate-900">{entry.title}</h4>}
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap line-clamp-4">{entry.content}</p>
              </div>

              {entry.tags && entry.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-2">
                  {entry.tags.map(t => (
                    <span key={t} className="px-1.5 py-0.5 bg-slate-50 text-slate-400 rounded text-[8px] font-bold uppercase">
                      #{t}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        {entries.length === 0 && (
          <div className="sm:col-span-2 py-20 text-center glass rounded-3xl">
            <p className="text-slate-400">Chưa có ghi chú nào.</p>
          </div>
        )}
      </div>
    </div>
  );
}


