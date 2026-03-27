import React, { useState, useEffect } from 'react';
import { auth, db, onAuthStateChanged, signInWithPopup, googleProvider, doc, onSnapshot, setDoc } from './firebase';
import { UserProfile, Task, Skill, JournalEntry } from './types';
import { LogIn, LogOut, LayoutDashboard, CheckSquare, Brain, BookOpen, MessageSquare, Zap, Wallet } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Dashboard from './components/Dashboard';
import TaskBoard from './components/TaskBoard';
import Skills from './components/Skills';
import Journal from './components/Journal';
import Chat from './components/Chat';
import SpendingManager from './components/Spending';
import { cn } from './lib/utils';
import { useNotifications } from './hooks/useNotifications';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [chatInitialMessage, setChatInitialMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useNotifications(user?.uid);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const userRef = doc(db, 'users', u.uid);
        onSnapshot(userRef, (snap) => {
          if (snap.exists()) {
            setProfile(snap.data() as UserProfile);
          } else {
            const newProfile: UserProfile = {
              uid: u.uid,
              displayName: u.displayName || 'User',
              email: u.email || '',
              dailyEnergy: 100,
              focus3: ['', '', '']
            };
            setDoc(userRef, newProfile);
            setProfile(newProfile);
          }
        });
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleLogout = () => auth.signOut();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-12 h-12 border-4 border-slate-200 border-t-slate-800 rounded-full"
        />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8f9fa] p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full glass p-10 rounded-3xl text-center space-y-8"
        >
          <div className="w-20 h-20 bg-slate-900 rounded-2xl flex items-center justify-center mx-auto shadow-xl">
            <Zap className="text-white w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-serif font-bold tracking-tight">Life OS</h1>
            <p className="text-slate-500 font-medium">Hệ điều hành cho cuộc sống của bạn.</p>
          </div>
          <button
            onClick={handleLogin}
            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-semibold flex items-center justify-center gap-3 hover:bg-slate-800 transition-all shadow-lg hover:shadow-slate-200"
          >
            <LogIn size={20} />
            Đăng nhập với Google
          </button>
          <p className="text-xs text-slate-400">Đồng bộ dữ liệu giữa laptop và điện thoại của bạn.</p>
        </motion.div>
      </div>
    );
  }

  const tabs = [
    { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard },
    { id: 'tasks', label: 'Kế hoạch', icon: CheckSquare },
    { id: 'skills', label: 'Kỹ năng', icon: Brain },
    { id: 'spending', label: 'Tài chính', icon: Wallet },
    { id: 'journal', label: 'Ghi chú', icon: BookOpen },
    { id: 'chat', label: 'Trợ lý AI', icon: MessageSquare },
  ];

  const analyzeSpending = (data: string) => {
    setChatInitialMessage(data);
    setActiveTab('chat');
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] pb-24 md:pb-0 md:pl-64">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-slate-100 flex-col p-6 z-30">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
            <Zap size={18} className="text-white" />
          </div>
          <span className="font-serif font-bold text-xl tracking-tight">Life OS</span>
        </div>

        <nav className="flex-1 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium",
                activeTab === tab.id 
                  ? "bg-slate-900 text-white shadow-md shadow-slate-200" 
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <tab.icon size={20} />
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="pt-6 border-t border-slate-100">
          <div className="flex items-center gap-3 px-2 mb-4">
            <img 
              src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} 
              alt="Avatar" 
              className="w-10 h-10 rounded-full border-2 border-slate-100"
              referrerPolicy="no-referrer"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{user.displayName}</p>
              <p className="text-xs text-slate-400 truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-all font-medium"
          >
            <LogOut size={20} />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Bottom Nav - Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 flex justify-around p-4 z-30">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex flex-col items-center gap-1",
              activeTab === tab.id ? "text-slate-900" : "text-slate-400"
            )}
          >
            <tab.icon size={22} />
            <span className="text-[10px] font-medium">{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto p-4 md:p-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'dashboard' && <Dashboard profile={profile} />}
            {activeTab === 'tasks' && <TaskBoard uid={user.uid} />}
            {activeTab === 'skills' && <Skills uid={user.uid} />}
            {activeTab === 'spending' && <SpendingManager uid={user.uid} onAnalyze={analyzeSpending} />}
            {activeTab === 'journal' && <Journal uid={user.uid} />}
            {activeTab === 'chat' && (
              <Chat 
                uid={user.uid} 
                profile={profile} 
                initialMessage={chatInitialMessage} 
                onMessageSent={() => setChatInitialMessage(null)} 
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
