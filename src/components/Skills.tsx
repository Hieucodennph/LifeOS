import React, { useState, useEffect } from 'react';
import { db, collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from '../firebase';
import { Skill } from '../types';
import { Plus, Brain, Trash2, Sparkles, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { GoogleGenAI } from '@google/genai';

export default function Skills({ uid }: { uid: string }) {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [newName, setNewName] = useState('');
  const [isGenerating, setIsGenerating] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'skills'), where('uid', '==', uid));
    const unsub = onSnapshot(q, (snap) => {
      setSkills(snap.docs.map(d => ({ id: d.id, ...d.data() } as Skill)));
    });
    return () => unsub();
  }, [uid]);

  const addSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    await addDoc(collection(db, 'skills'), {
      uid,
      name: newName,
      progress: 0,
      nextStep: 'Bắt đầu tìm hiểu cơ bản'
    });
    setNewName('');
  };

  const updateProgress = async (id: string, current: number, delta: number) => {
    const next = Math.max(0, Math.min(100, current + delta));
    await updateDoc(doc(db, 'skills', id), { progress: next });
  };

  const askAI = async (skill: Skill) => {
    setIsGenerating(skill.id);
    try {
      const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const model = genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Tôi đang học kỹ năng "${skill.name}" và hiện tại đạt ${skill.progress}%. Hãy gợi ý 1 hành động cụ thể tiếp theo tôi cần làm để tiến bộ. Trả lời cực ngắn gọn (dưới 15 từ).`
      });
      const response = await model;
      const text = response.text || 'Tiếp tục luyện tập mỗi ngày.';
      await updateDoc(doc(db, 'skills', skill.id), { nextStep: text.trim() });
    } catch (error) {
      console.error('AI error:', error);
    } finally {
      setIsGenerating(null);
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-3xl font-serif font-bold">Kỹ năng</h2>
        <form onSubmit={addSkill} className="flex gap-2 w-full sm:w-auto">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Tên kỹ năng mới..."
            className="flex-1 sm:w-64 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5"
          />
          <button type="submit" className="p-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors">
            <Plus size={20} />
          </button>
        </form>
      </header>

      <div className="grid sm:grid-cols-2 gap-6">
        {skills.map(skill => (
          <motion.div
            key={skill.id}
            layout
            className="glass p-6 rounded-3xl space-y-6 card-hover"
          >
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center">
                  <Brain size={20} className="text-slate-900" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{skill.name}</h3>
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Tiến độ: {skill.progress}%</p>
                </div>
              </div>
              <button 
                onClick={() => deleteDoc(doc(db, 'skills', skill.id))}
                className="p-2 text-slate-200 hover:text-red-500 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${skill.progress}%` }}
                  className="h-full bg-slate-900"
                />
              </div>
              
              <div className="flex gap-2">
                <button 
                  onClick={() => updateProgress(skill.id, skill.progress, -5)}
                  className="flex-1 py-1.5 bg-slate-50 rounded-lg text-xs font-bold hover:bg-slate-100 transition-colors"
                >
                  -5%
                </button>
                <button 
                  onClick={() => updateProgress(skill.id, skill.progress, 5)}
                  className="flex-1 py-1.5 bg-slate-50 rounded-lg text-xs font-bold hover:bg-slate-100 transition-colors"
                >
                  +5%
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-50 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Hành động tiếp theo</p>
                <button 
                  onClick={() => askAI(skill)}
                  disabled={isGenerating === skill.id}
                  className="text-xs font-bold text-slate-900 flex items-center gap-1 hover:opacity-70 transition-opacity disabled:opacity-50"
                >
                  {isGenerating === skill.id ? 'Đang nghĩ...' : <><Sparkles size={12} /> Hỏi AI</>}
                </button>
              </div>
              <p className="text-sm font-medium text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl italic">
                "{skill.nextStep}"
              </p>
            </div>
          </motion.div>
        ))}
        {skills.length === 0 && (
          <div className="sm:col-span-2 py-20 text-center glass rounded-3xl">
            <p className="text-slate-400">Hãy bắt đầu hành trình học tập của bạn.</p>
          </div>
        )}
      </div>
    </div>
  );
}
