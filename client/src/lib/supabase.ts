import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ntxqedcyxsqdpauphunc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im50eHFlZGN5eHNxZHBhdXBodW5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5MzA3MjQsImV4cCI6MjA3NTUwNjcyNH0.WmL5Ly6utECuTt2qTWbKqltLP73V3hYPLUeylBELKTk';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for operator sessions
export interface OperatorSession {
  id?: string;
  operator_id: string;
  operator_name: string;
  operator_role?: string;
  login_time?: string;
  logout_time?: string | null;
  session_duration_minutes?: number | null;
  health_alerts_count?: number;
  drill_alerts_count?: number;
  device_info?: Record<string, any>;
  ip_address?: string | null;
  status?: 'active' | 'completed' | 'abandoned';
  notes?: string | null;
}

// Create a new session when operator logs in
export const createOperatorSession = async (
  operatorId: string,
  operatorName: string,
  operatorRole: string = 'operator'
): Promise<OperatorSession | null> => {
  try {
    const deviceInfo = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
    };

    const { data, error } = await supabase
      .from('operator_sessions')
      .insert({
        operator_id: operatorId,
        operator_name: operatorName,
        operator_role: operatorRole,
        device_info: deviceInfo,
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating operator session:', error);
      return null;
    }

    console.log('✅ Operator session created:', data);
    return data;
  } catch (err) {
    console.error('Failed to create operator session:', err);
    return null;
  }
};

// Update session when operator logs out
export const endOperatorSession = async (
  sessionId: string,
  healthAlerts: number = 0,
  drillAlerts: number = 0,
  notes?: string
): Promise<boolean> => {
  try {
    const logoutTime = new Date().toISOString();
    
    // First get the session to calculate duration
    const { data: session } = await supabase
      .from('operator_sessions')
      .select('login_time')
      .eq('id', sessionId)
      .single();

    let durationMinutes = 0;
    if (session?.login_time) {
      const loginTime = new Date(session.login_time);
      const logout = new Date(logoutTime);
      durationMinutes = Math.round((logout.getTime() - loginTime.getTime()) / 60000);
    }

    const { error } = await supabase
      .from('operator_sessions')
      .update({
        logout_time: logoutTime,
        session_duration_minutes: durationMinutes,
        health_alerts_count: healthAlerts,
        drill_alerts_count: drillAlerts,
        status: 'completed',
        notes: notes,
        updated_at: logoutTime,
      })
      .eq('id', sessionId);

    if (error) {
      console.error('Error ending operator session:', error);
      return false;
    }

    console.log('✅ Operator session ended. Duration:', durationMinutes, 'minutes');
    return true;
  } catch (err) {
    console.error('Failed to end operator session:', err);
    return false;
  }
};

// Get all sessions for an operator
export const getOperatorSessions = async (operatorId: string) => {
  const { data, error } = await supabase
    .from('operator_sessions')
    .select('*')
    .eq('operator_id', operatorId)
    .order('login_time', { ascending: false });

  if (error) {
    console.error('Error fetching operator sessions:', error);
    return [];
  }

  return data;
};

// Get active sessions
export const getActiveSessions = async () => {
  const { data, error } = await supabase
    .from('operator_sessions')
    .select('*')
    .eq('status', 'active')
    .order('login_time', { ascending: false });

  if (error) {
    console.error('Error fetching active sessions:', error);
    return [];
  }

  return data;
};
