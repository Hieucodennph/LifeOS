import React, { useState, useEffect } from 'react';
import { db, collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, orderBy } from '../firebase';
import { Task } from '../types';
import { Plus, MoreVertical, Trash2, ArrowRight, ArrowLeft, Calendar as CalendarIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { cn } from '../lib/utils';

export default function TaskBoard({ uid }: { uid: string }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState('');
  const [newDueDate, setNewDueDate] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'tasks'), where('uid', '==', uid), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() } as Task)));
    });
    return () => unsub();
  }, [uid]);

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    await addDoc(collection(db, 'tasks'), {
      uid,
      title: newTask,
      status: 'todo',
      dueDate: newDueDate || null,
      createdAt: serverTimestamp()
    });
    setNewTask('');
    setNewDueDate('');
  };

  const moveTask = async (id: string, currentStatus: string, direction: 'next' | 'prev') => {
    const statuses: Task['status'][] = ['todo', 'doing', 'done'];
    const currentIndex = statuses.indexOf(currentStatus as any);
    const nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    
    if (nextIndex >= 0 && nextIndex < statuses.length) {
      await updateDoc(doc(db, 'tasks', id), { status: statuses[nextIndex] });
    }
  };

  const deleteTask = async (id: string) => {
    await deleteDoc(doc(db, 'tasks', id));
  };

  const columns = [
    { id: 'todo', label: 'Cần làm', color: 'bg-slate-100 text-slate-600' },
    { id: 'doing', label: 'Đang làm', color: 'bg-blue-100 text-blue-600' },
    { id: 'done', label: 'Đã xong', color: 'bg-emerald-100 text-emerald-600' },
  ];

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-3xl font-serif font-bold">Task Board</h2>
        <form onSubmit={addTask} className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <input
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="Thêm task mới..."
            className="flex-1 sm:w-64 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5"
          />
          <input
            type="datetime-local"
            value={newDueDate}
            onChange={(e) => setNewDueDate(e.target.value)}
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5"
          />
          <button type="submit" className="p-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors">
            <Plus size={20} />
          </button>
        </form>
      </header>

      <div className="grid md:grid-cols-3 gap-6">
        {columns.map(col => (
          <div key={col.id} className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider", col.color)}>
                  {col.label}
                </span>
                <span className="text-xs font-bold text-slate-300">
                  {tasks.filter(t => t.status === col.id).length}
                </span>
              </div>
            </div>

            <div className="space-y-3 min-h-[200px]">
              <AnimatePresence>
                {tasks.filter(t => t.status === col.id).map(task => (
                  <motion.div
                    key={task.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="glass p-4 rounded-2xl group card-hover"
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-relaxed">{task.title}</p>
                        {task.dueDate && (
                          <p className="text-[10px] text-amber-600 font-bold flex items-center gap-1">
                            <CalendarIcon size={10} /> {new Date(task.dueDate).toLocaleString('vi-VN')}
                          </p>
                        )}
                      </div>
                      <button 
                        onClick={() => deleteTask(task.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-red-500 transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    
                    <div className="mt-4 flex justify-end gap-1">
                      {col.id !== 'todo' && (
                        <button 
                          onClick={() => moveTask(task.id, task.status, 'prev')}
                          className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 transition-colors"
                        >
                          <ArrowLeft size={14} />
                        </button>
                      )}
                      {col.id !== 'done' && (
                        <button 
                          onClick={() => moveTask(task.id, task.status, 'next')}
                          className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 transition-colors"
                        >
                          <ArrowRight size={14} />
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


