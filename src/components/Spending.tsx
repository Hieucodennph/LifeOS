import React, { useState, useEffect } from 'react';
import { db, collection, query, where, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, orderBy } from '../firebase';
import { Spending } from '../types';
import { Plus, Trash2, Wallet, TrendingDown, TrendingUp, Tag, Calendar as CalendarIcon, Brain } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { cn } from '../lib/utils';

export default function SpendingManager({ uid, onAnalyze }: { uid: string, onAnalyze?: (data: string) => void }) {
  const [expenses, setExpenses] = useState<Spending[]>([]);
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [scope, setScope] = useState<'personal' | 'work'>('personal');
  const [category, setCategory] = useState('Ăn uống');
  const [note, setNote] = useState('');

  useEffect(() => {
    const q = query(
      collection(db, 'spending'), 
      where('uid', '==', uid), 
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      setExpenses(snap.docs.map(d => ({ id: d.id, ...d.data() } as Spending)));
    });
    return () => unsub();
  }, [uid]);

  const addExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount))) return;
    await addDoc(collection(db, 'spending'), {
      uid,
      amount: Number(amount),
      type,
      scope,
      category,
      note,
      createdAt: serverTimestamp()
    });
    setAmount('');
    setNote('');
  };

  const totalIncome = expenses.filter(e => e.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpense = expenses.filter(e => e.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
  const balance = totalIncome - totalExpense;

  const categories = type === 'expense' 
    ? ['Ăn uống', 'Di chuyển', 'Học tập', 'Giải trí', 'Sức khỏe', 'Khác']
    : ['Lương', 'Thưởng', 'Đầu tư', 'Kinh doanh', 'Khác'];

  const handleAnalyze = () => {
    if (!onAnalyze) return;
    const now = new Date();
    const currentMonthExpenses = expenses.filter(e => {
      if (!e.createdAt) return false;
      const date = e.createdAt.toDate();
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    });

    if (currentMonthExpenses.length === 0) {
      onAnalyze("Tôi chưa có dữ liệu chi tiêu trong tháng này để phân tích.");
      return;
    }

    const summary = currentMonthExpenses.map(e => 
      `- ${e.type === 'income' ? 'Thu' : 'Chi'}: ${e.amount.toLocaleString()}đ (${e.category}${e.note ? ': ' + e.note : ''}) [${e.scope === 'work' ? 'Công việc' : 'Sinh hoạt'}]`
    ).join('\n');

    const prompt = `Đây là dữ liệu thu chi của tôi trong tháng ${now.getMonth() + 1}/${now.getFullYear()}:\n${summary}\n\nHãy phân tích thói quen chi tiêu của tôi và đưa ra lời khuyên tài chính.`;
    onAnalyze(prompt);
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-serif font-bold">Thu chi</h2>
            <button 
              onClick={handleAnalyze}
              className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-xl font-bold text-[10px] hover:bg-indigo-100 transition-all"
            >
              <Brain size={12} /> Phân tích AI
            </button>
          </div>
          <p className="text-slate-500">Quản lý tài chính cá nhân & công việc.</p>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 sm:pb-0">
          <div className="glass px-4 py-2 rounded-2xl flex items-center gap-2 shrink-0">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <div>
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Thu nhập</p>
              <p className="text-sm font-bold">{totalIncome.toLocaleString('vi-VN')} đ</p>
            </div>
          </div>
          <div className="glass px-4 py-2 rounded-2xl flex items-center gap-2 shrink-0">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <div>
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Chi tiêu</p>
              <p className="text-sm font-bold">{totalExpense.toLocaleString('vi-VN')} đ</p>
            </div>
          </div>
          <div className="bg-slate-900 text-white px-4 py-2 rounded-2xl flex items-center gap-2 shrink-0 shadow-lg">
            <Wallet size={14} />
            <div>
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Số dư</p>
              <p className="text-sm font-bold">{balance.toLocaleString('vi-VN')} đ</p>
            </div>
          </div>
        </div>
      </header>

      <form onSubmit={addExpense} className="glass p-6 rounded-3xl space-y-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={cn(
                "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                type === 'expense' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400"
              )}
            >
              Chi tiêu
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={cn(
                "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                type === 'income' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400"
              )}
            >
              Thu nhập
            </button>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setScope('personal')}
              className={cn(
                "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                scope === 'personal' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400"
              )}
            >
              Sinh hoạt
            </button>
            <button
              type="button"
              onClick={() => setScope('work')}
              className={cn(
                "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                scope === 'work' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400"
              )}
            >
              Công việc
            </button>
          </div>
        </div>

        <div className="grid sm:grid-cols-4 gap-4 items-end">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Số tiền</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Hạng mục</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5"
            >
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ghi chú</label>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ghi chú thêm..."
              className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5"
            />
          </div>
          <button type="submit" className="w-full py-2 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2">
            <Plus size={18} /> Thêm
          </button>
        </div>
      </form>

      <div className="space-y-4">
        <h3 className="text-lg font-serif font-bold">Lịch sử giao dịch</h3>
        <div className="grid gap-3">
          <AnimatePresence>
            {expenses.map((exp, i) => (
              <motion.div
                key={exp.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass p-4 rounded-2xl flex items-center justify-between card-hover"
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center",
                    exp.type === 'income' ? "bg-emerald-50" : "bg-red-50"
                  )}>
                    {exp.type === 'income' ? (
                      <TrendingUp className="text-emerald-500" size={18} />
                    ) : (
                      <TrendingDown className="text-red-500" size={18} />
                    )}
                  </div>
                  <div>
                    <p className={cn(
                      "font-bold",
                      exp.type === 'income' ? "text-emerald-600" : "text-slate-900"
                    )}>
                      {exp.type === 'income' ? '+' : '-'}{exp.amount.toLocaleString('vi-VN')} đ
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
                      <span className={cn(
                        "px-1.5 py-0.5 rounded bg-slate-100 text-[8px] uppercase font-bold",
                        exp.scope === 'work' ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-500"
                      )}>
                        {exp.scope === 'work' ? 'Công việc' : 'Sinh hoạt'}
                      </span>
                      <Tag size={10} /> {exp.category}
                      {exp.note && <span>• {exp.note}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">
                      {exp.createdAt ? format(exp.createdAt.toDate(), 'HH:mm, dd/MM', { locale: vi }) : '...'}
                    </p>
                  </div>
                  <button 
                    onClick={() => deleteDoc(doc(db, 'spending', exp.id))}
                    className="p-2 text-slate-200 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {expenses.length === 0 && (
            <div className="py-20 text-center glass rounded-3xl">
              <p className="text-slate-400">Chưa có dữ liệu chi tiêu.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
