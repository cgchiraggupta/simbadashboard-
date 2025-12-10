/**
 * ============================================================================
 * OPERATOR AUTHENTICATION STORE
 * ============================================================================
 * 
 * Manages operator login/logout and session tracking.
 * Tracks: who logged in, when, how long, and any alerts during session.
 * 
 * NOW WITH SUPABASE INTEGRATION:
 * - All sessions are stored in Supabase database
 * - Login creates a new record
 * - Logout updates the record with logout time and duration
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
import { createOperatorSession, endOperatorSession } from '../lib/supabase';

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
  supabaseSessionId: string | null; // Track Supabase session ID
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
      supabaseSessionId: null,
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

        // Create new local session
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

        // Create session in Supabase (async, non-blocking)
        createOperatorSession(
          userRecord.operator.id,
          userRecord.operator.name,
          userRecord.operator.role
        ).then((supabaseSession) => {
          if (supabaseSession?.id) {
            set({ supabaseSessionId: supabaseSession.id });
            console.log(`📊 Supabase session created: ${supabaseSession.id}`);
          }
        }).catch((err) => {
          console.warn('Failed to create Supabase session:', err);
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

          // End session in Supabase (async, non-blocking)
          if (current.supabaseSessionId) {
            endOperatorSession(
              current.supabaseSessionId,
              current.currentSession.healthAlerts,
              current.currentSession.drillAlerts
            ).then((success) => {
              if (success) {
                console.log(`📊 Supabase session ended successfully`);
              }
            }).catch((err) => {
              console.warn('Failed to end Supabase session:', err);
            });
          }

          // Add to history
          set((state) => ({
            operator: null,
            isAuthenticated: false,
            currentSession: null,
            supabaseSessionId: null,
            sessionHistory: [completedSession, ...state.sessionHistory].slice(0, 50), // Keep last 50 sessions
            loginError: null,
          }));

          console.log(`👋 Operator logged out: ${current.operator?.name}`);
        } else {
          set({
            operator: null,
            isAuthenticated: false,
            currentSession: null,
            supabaseSessionId: null,
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
        supabaseSessionId: state.supabaseSessionId,
        sessionHistory: state.sessionHistory,
      }),
    }
  )
);
