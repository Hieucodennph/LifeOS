import React, { useState, useEffect } from 'react';
import { db, collection, query, where, onSnapshot, doc, updateDoc, addDoc, serverTimestamp } from '../firebase';
import { UserProfile, Task, Skill } from '../types';
import { Zap, CheckSquare, Brain, Battery, ArrowRight, ChevronRight, Wallet, Plus } from 'lucide-react';
import { motion } from 'motion/react';
import Focus from './Focus';

import { cn } from '../lib/utils';

export default function Dashboard({ profile }: { profile: UserProfile | null }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);

  useEffect(() => {
    if (!profile) return;
    const tasksQuery = query(collection(db, 'tasks'), where('uid', '==', profile.uid));
    const skillsQuery = query(collection(db, 'skills'), where('uid', '==', profile.uid));

    const unsubTasks = onSnapshot(tasksQuery, (snap) => {
      setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() } as Task)));
    });
    const unsubSkills = onSnapshot(skillsQuery, (snap) => {
      setSkills(snap.docs.map(d => ({ id: d.id, ...d.data() } as Skill)));
    });

    return () => {
      unsubTasks();
      unsubSkills();
    };
  }, [profile]);

  if (!profile) return null;

  const remainingTasks = tasks.filter(t => t.status !== 'done').length;
  const completedToday = tasks.filter(t => t.status === 'done').length; // Placeholder for "Đơn hôm nay"

  const metrics = [
    { label: 'Đã hoàn thành', value: completedToday, icon: Zap, color: 'text-amber-500', bg: 'bg-amber-50' },
    { label: 'Task còn lại', value: remainingTasks, icon: CheckSquare, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Kỹ năng đang học', value: skills.length, icon: Brain, color: 'text-purple-500', bg: 'bg-purple-50' },
    { label: 'Năng lượng ngày', value: `${profile.dailyEnergy}%`, icon: Battery, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  ];

  const categories = ['Ăn uống', 'Di chuyển', 'Học tập', 'Giải trí', 'Sức khỏe', 'Khác'];

  const quickAddSpending = async (cat: string) => {
    const amount = prompt(`Nhập số tiền chi tiêu cho ${cat}:`);
    if (amount && !isNaN(Number(amount))) {
      await addDoc(collection(db, 'spending'), {
        uid: profile.uid,
        amount: Number(amount),
        type: 'expense',
        scope: 'personal',
        category: cat,
        note: 'Thêm nhanh từ Dashboard',
        createdAt: serverTimestamp()
      });
    }
  };

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h2 className="text-3xl font-serif font-bold">Chào buổi sáng, {profile.displayName}</h2>
        <p className="text-slate-500">Hôm nay là một ngày tuyệt vời để phát triển.</p>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m, i) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass p-5 rounded-3xl space-y-3 card-hover"
          >
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", m.bg)}>
              <m.icon className={m.color} size={20} />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{m.label}</p>
              <p className="text-2xl font-bold">{m.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Focus profile={profile} />
          
          <section className="glass p-6 rounded-3xl space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-serif font-bold">Thêm nhanh chi tiêu</h3>
              <Wallet className="text-slate-400" size={20} />
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => quickAddSpending(cat)}
                  className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white border border-slate-50 hover:border-slate-200 hover:shadow-sm transition-all group"
                >
                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center group-hover:bg-slate-900 transition-colors">
                    <Plus size={14} className="text-slate-400 group-hover:text-white" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 text-center">{cat}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-serif font-bold">Kỹ năng tiêu biểu</h3>
              <button className="text-sm font-medium text-slate-400 flex items-center gap-1 hover:text-slate-900 transition-colors">
                Xem tất cả <ChevronRight size={16} />
              </button>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {skills.slice(0, 4).map(skill => (
                <div key={skill.id} className="glass p-5 rounded-2xl space-y-3">
                  <div className="flex justify-between items-center">
                    <p className="font-semibold">{skill.name}</p>
                    <span className="text-xs font-bold text-slate-400">{skill.progress}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${skill.progress}%` }}
                      className="h-full bg-slate-900"
                    />
                  </div>
                  <p className="text-xs text-slate-500 italic">Tiếp theo: {skill.nextStep || 'Chưa xác định'}</p>
                </div>
              ))}
              {skills.length === 0 && (
                <div className="sm:col-span-2 py-10 text-center glass rounded-2xl">
                  <p className="text-slate-400 text-sm">Chưa có kỹ năng nào được theo dõi.</p>
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="space-y-8">
          <section className="glass p-6 rounded-3xl space-y-6">
            <h3 className="text-lg font-serif font-bold">Khung thời gian (Energy)</h3>
            <div className="space-y-3">
              {[
                { label: 'Deep Work', time: '08:00 - 11:00', energy: 'High' },
                { label: 'Admin/Meetings', time: '11:00 - 12:00', energy: 'Medium' },
                { label: 'Rest/Learning', time: '13:00 - 15:00', energy: 'Low' },
                { label: 'Creative', time: '15:00 - 17:00', energy: 'Medium' },
                { label: 'Physical', time: '17:00 - 19:00', energy: 'High' },
                { label: 'Reflection', time: '21:00 - 22:00', energy: 'Low' },
              ].map((block, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group">
                  <div>
                    <p className="text-sm font-semibold group-hover:text-slate-900">{block.label}</p>
                    <p className="text-[10px] text-slate-400">{block.time}</p>
                  </div>
                  <span className={cn(
                    "text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-tighter",
                    block.energy === 'High' ? 'bg-emerald-100 text-emerald-600' :
                    block.energy === 'Medium' ? 'bg-amber-100 text-amber-600' :
                    'bg-slate-100 text-slate-500'
                  )}>
                    {block.energy}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-slate-900 p-6 rounded-3xl text-white space-y-4">
            <h3 className="text-lg font-serif font-bold">Trợ lý AI</h3>
            <p className="text-sm text-slate-400">Bạn đang cảm thấy thế nào? Hãy chia sẻ với tôi.</p>
            <div className="grid grid-cols-2 gap-2">
              {['Hoang mang', 'Quá tải'].map(btn => (
                <button key={btn} className="py-2 px-3 bg-white/10 rounded-xl text-xs font-medium hover:bg-white/20 transition-colors">
                  {btn}
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}


