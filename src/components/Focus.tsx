import React, { useState } from 'react';
import { db, doc, updateDoc } from '../firebase';
import { UserProfile } from '../types';
import { Target, Edit2, Check } from 'lucide-react';
import { motion } from 'motion/react';

export default function Focus({ profile }: { profile: UserProfile }) {
  const [isEditing, setIsEditing] = useState(false);
  const [focus, setFocus] = useState(profile.focus3 || ['', '', '']);

  const handleSave = async () => {
    const userRef = doc(db, 'users', profile.uid);
    await updateDoc(userRef, { focus3: focus });
    setIsEditing(false);
  };

  return (
    <section className="glass p-6 rounded-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
            <Target size={16} className="text-white" />
          </div>
          <h3 className="text-xl font-serif font-bold">Focus 3</h3>
        </div>
        <button 
          onClick={() => isEditing ? handleSave() : setIsEditing(true)}
          className="p-2 hover:bg-slate-100 rounded-full transition-colors"
        >
          {isEditing ? <Check size={18} className="text-emerald-600" /> : <Edit2 size={18} className="text-slate-400" />}
        </button>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        {focus.map((item, i) => (
          <div key={i} className="relative group">
            {isEditing ? (
              <input
                value={item}
                onChange={(e) => {
                  const newFocus = [...focus];
                  newFocus[i] = e.target.value;
                  setFocus(newFocus);
                }}
                placeholder={`Mục tiêu ${i + 1}...`}
                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-900/5"
              />
            ) : (
              <div className="p-4 bg-white border border-slate-50 rounded-2xl h-full flex items-center gap-3 group-hover:border-slate-200 transition-all">
                <span className="text-xs font-bold text-slate-300">0{i + 1}</span>
                <p className="text-sm font-medium text-slate-700">{item || 'Chưa thiết lập'}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
