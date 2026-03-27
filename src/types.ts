export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  dailyEnergy: number;
  focus3: string[];
}

export interface Task {
  id: string;
  uid: string;
  title: string;
  status: 'todo' | 'doing' | 'done';
  dueDate?: string | null;
  reminded?: boolean;
  createdAt: any;
}

export interface Spending {
  id: string;
  uid: string;
  amount: number;
  type: 'expense' | 'income';
  scope: 'personal' | 'work';
  category: string;
  note?: string;
  createdAt: any;
}

export interface Skill {
  id: string;
  uid: string;
  name: string;
  progress: number;
  nextStep: string;
}

export interface JournalEntry {
  id: string;
  uid: string;
  title?: string;
  content: string;
  mood: string;
  tags?: string[];
  createdAt: any;
}

export type OperationType = 'create' | 'update' | 'delete' | 'list' | 'get' | 'write';

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string;
    email?: string;
    emailVerified?: boolean;
    isAnonymous?: boolean;
    providerInfo: any[];
  };
}
