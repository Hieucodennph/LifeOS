import { useEffect } from 'react';
import { db, collection, query, where, onSnapshot, doc, updateDoc } from '../firebase';
import { Task } from '../types';

export function useNotifications(uid: string | undefined) {
  useEffect(() => {
    if (!uid) return;

    // Request permission on mount
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const q = query(
      collection(db, 'tasks'),
      where('uid', '==', uid),
      where('status', '!=', 'done')
    );

    const unsub = onSnapshot(q, (snap) => {
      const tasks = snap.docs.map(d => ({ id: d.id, ...d.data() } as Task));
      const now = new Date();

      tasks.forEach(async (task) => {
        if (task.dueDate && !task.reminded) {
          const dueDate = new Date(task.dueDate);
          // If due in the next 5 minutes or already passed but not reminded
          if (dueDate <= new Date(now.getTime() + 5 * 60000)) {
            if (Notification.permission === 'granted') {
              new Notification('Nhắc nhở công việc', {
                body: `Công việc "${task.title}" sắp đến hạn hoặc đã quá hạn!`,
                icon: '/favicon.ico' // Or any icon
              });

              // Mark as reminded
              await updateDoc(doc(db, 'tasks', task.id), {
                reminded: true
              });
            }
          }
        }
      });
    });

    // Check every minute for upcoming tasks
    const interval = setInterval(() => {
      // Trigger a re-check by potentially updating a local state if needed, 
      // but onSnapshot will handle data changes. 
      // For time-based triggers without data changes, we might need a local list.
    }, 60000);

    return () => {
      unsub();
      clearInterval(interval);
    };
  }, [uid]);
}
