/**
 * ============================================================================
 * OPERATOR AUTHENTICATION STORE
 * ============================================================================
 * 
 * Manages operator login/logout and session tracking.
 * Tracks: who logged in, when, how long, and any alerts during session.
 * 
 * SAMPLE OPERATORS:
 * - arvind / password123 (Arvind Srinivaas - Operator)
 * - admin / admin123 (Admin User - Admin)
 * 
 * ============================================================================
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Operator, OperatorSession } from '../types';

// Sample operators database
const OPERATORS_DB: Record<string, { operator: Operator; password: string }> = {
  'arvind': {
    operator: {
      id: 'OP-001',
      name: 'Arvind Srinivaas',
      email: 'arvind.srinivaas@drillsense.com',
      role: 'operator',
    },
    password: 'password123',
  },
  'admin': {
    operator: {
      id: 'OP-002',
      name: 'Admin User',
      email: 'admin@drillsense.com',
      role: 'admin',
    },
    password: 'admin123',
  },
  'supervisor': {
    operator: {
      id: 'OP-003',
      name: 'Rahul Sharma',
      email: 'rahul.sharma@drillsense.com',
      role: 'supervisor',
    },
    password: 'super123',
  },
};

interface AuthStore {
  operator: Operator | null;
  isAuthenticated: boolean;
  currentSession: OperatorSession | null;
  sessionHistory: OperatorSession[];
  loginError: string | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  incrementHealthAlerts: () => void;
  incrementDrillAlerts: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      operator: null,
      isAuthenticated: false,
      currentSession: null,
      sessionHistory: [],
      loginError: null,

      login: (username: string, password: string): boolean => {
        const userKey = username.toLowerCase().trim();
        const userRecord = OPERATORS_DB[userKey];

        if (!userRecord) {
          set({ loginError: 'User not found' });
          return false;
        }

        if (userRecord.password !== password) {
          set({ loginError: 'Incorrect password' });
          return false;
        }

        // Create new session
        const newSession: OperatorSession = {
          id: `SESSION-${Date.now()}`,
          operatorId: userRecord.operator.id,
          operatorName: userRecord.operator.name,
          loginTime: Date.now(),
          status: 'active',
          healthAlerts: 0,
          drillAlerts: 0,
        };

        set({
          operator: userRecord.operator,
          isAuthenticated: true,
          currentSession: newSession,
          loginError: null,
        });

        console.log(`✅ Operator logged in: ${userRecord.operator.name}`);
        return true;
      },

      logout: () => {
        const current = get();
        
        if (current.currentSession) {
          // Complete the session
          const completedSession: OperatorSession = {
            ...current.currentSession,
            logoutTime: Date.now(),
            status: 'completed',
          };

          // Add to history
          set((state) => ({
            operator: null,
            isAuthenticated: false,
            currentSession: null,
            sessionHistory: [completedSession, ...state.sessionHistory].slice(0, 50), // Keep last 50 sessions
            loginError: null,
          }));

          console.log(`👋 Operator logged out: ${current.operator?.name}`);
        } else {
          set({
            operator: null,
            isAuthenticated: false,
            currentSession: null,
            loginError: null,
          });
        }
      },

      incrementHealthAlerts: () => {
        set((state) => ({
          currentSession: state.currentSession
            ? { ...state.currentSession, healthAlerts: state.currentSession.healthAlerts + 1 }
            : null,
        }));
      },

      incrementDrillAlerts: () => {
        set((state) => ({
          currentSession: state.currentSession
            ? { ...state.currentSession, drillAlerts: state.currentSession.drillAlerts + 1 }
            : null,
        }));
      },
    }),
    {
      name: 'drillsense-auth',
      partialize: (state) => ({
        operator: state.operator,
        isAuthenticated: state.isAuthenticated,
        currentSession: state.currentSession,
        sessionHistory: state.sessionHistory,
      }),
    }
  )
);
