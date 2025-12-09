import { create } from 'zustand';

interface Operator {
  id: string;
  name: string;
  email?: string;
  shiftStart?: number;
  shiftEnd?: number;
}

interface OperatorStore {
  currentOperator: Operator | null;
  isSignedIn: boolean;
  signIn: (name: string, email?: string) => Promise<void>;
  signOut: () => Promise<void>;
}

// Load from localStorage on init
const loadFromStorage = (): Operator | null => {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem('operator-storage');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      return parsed.currentOperator || null;
    } catch {
      return null;
    }
  }
  return null;
};

const saveToStorage = (operator: Operator | null) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('operator-storage', JSON.stringify({ currentOperator: operator }));
};

export const useOperatorStore = create<OperatorStore>((set, get) => {
  // Initialize from localStorage
  const storedOperator = loadFromStorage();
  
  return {
    currentOperator: storedOperator,
    isSignedIn: !!storedOperator,
    signIn: async (name: string, email?: string) => {
      const operator: Operator = {
        id: `OP-${Date.now()}`,
        name,
        email,
        shiftStart: Date.now(),
      };
      set({ currentOperator: operator, isSignedIn: true });
      saveToStorage(operator);
      
      // Save to Supabase (via API endpoint - to be implemented)
      try {
        // In production, this would call an API endpoint that uses Supabase
        console.log('Operator signed in:', operator);
      } catch (error) {
        console.error('Failed to save operator signin:', error);
      }
    },
    signOut: async () => {
      const operator = get().currentOperator;
      if (operator) {
        const shiftEnd = Date.now();
        set({ currentOperator: null, isSignedIn: false });
        saveToStorage(null);
        
        // Save to Supabase
        try {
          // Update operator shift_end in Supabase
          console.log('Operator signed out:', operator);
        } catch (error) {
          console.error('Failed to save operator signout:', error);
        }
      }
    },
  };
});

