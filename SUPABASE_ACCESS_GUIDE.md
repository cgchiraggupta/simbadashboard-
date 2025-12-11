# 📊 Supabase Database Access Guide

## 🔑 **Your Supabase Project Details**

- **Project URL**: `https://ntxqedcyxsqdpauphunc.supabase.co`
- **Project Reference**: `ntxqedcyxsqdpauphunc`
- **Table Name**: `operator_sessions`

---

## 🌐 **Method 1: Supabase Dashboard (Web UI)**

### Step 1: Access Supabase Dashboard
1. Go to **https://supabase.com**
2. Click **"Sign In"** (or create account if needed)
3. Navigate to your project: `ntxqedcyxsqdpauphunc`

### Step 2: View Table Data
1. In the left sidebar, click **"Table Editor"**
2. Find and click on **`operator_sessions`** table
3. You'll see all operator login/logout records

### Step 3: View Table Structure
1. Click **"Table Editor"** → **`operator_sessions`**
2. Click the **"Columns"** tab to see table structure

**Table Columns:**
- `id` - Unique session ID
- `operator_id` - Operator's ID
- `operator_name` - Operator's name
- `operator_role` - Role (operator/admin)
- `login_time` - When they logged in
- `logout_time` - When they logged out (null if active)
- `session_duration_minutes` - Total session time
- `health_alerts_count` - Number of health alerts
- `drill_alerts_count` - Number of drill alerts
- `device_info` - Browser/device information (JSON)
- `ip_address` - IP address (if available)
- `status` - 'active' | 'completed' | 'abandoned'
- `notes` - Additional notes
- `created_at` - Record creation timestamp
- `updated_at` - Last update timestamp

### Step 4: Query Data (SQL Editor)
1. Click **"SQL Editor"** in left sidebar
2. Write SQL queries:

```sql
-- View all sessions
SELECT * FROM operator_sessions
ORDER BY login_time DESC;

-- View active sessions (currently logged in)
SELECT * FROM operator_sessions
WHERE status = 'active';

-- View sessions for specific operator
SELECT * FROM operator_sessions
WHERE operator_name = 'Arvind Srinivaas'
ORDER BY login_time DESC;

-- View sessions from last 24 hours
SELECT * FROM operator_sessions
WHERE login_time >= NOW() - INTERVAL '24 hours'
ORDER BY login_time DESC;

-- Count sessions per operator
SELECT 
  operator_name,
  COUNT(*) as total_sessions,
  SUM(session_duration_minutes) as total_minutes,
  AVG(session_duration_minutes) as avg_minutes
FROM operator_sessions
GROUP BY operator_name
ORDER BY total_sessions DESC;

-- View sessions with alerts
SELECT * FROM operator_sessions
WHERE health_alerts_count > 0 OR drill_alerts_count > 0
ORDER BY login_time DESC;
```

---

## 💻 **Method 2: Using Supabase MCP Tools (In Cursor)**

I can help you query the database directly using Supabase MCP tools!

### Available Commands:

1. **List Tables**
   ```
   "List all tables in the database"
   ```

2. **Execute SQL Query**
   ```
   "Show me all operator sessions"
   "Show active sessions"
   "Show sessions for Arvind Srinivaas"
   ```

3. **View Table Structure**
   ```
   "Show me the structure of operator_sessions table"
   ```

### Example Queries I Can Run:

- ✅ Get all operator sessions
- ✅ Get active sessions
- ✅ Get sessions by operator name
- ✅ Get sessions from last 24 hours
- ✅ Count sessions per operator
- ✅ Get sessions with alerts

**Just ask me:** *"Show me all operator sessions"* or *"Get active sessions"*

---

## 🔧 **Method 3: Using Supabase Client in Code**

### In Your React App:

```typescript
import { supabase } from './lib/supabase';

// Get all sessions
const getAllSessions = async () => {
  const { data, error } = await supabase
    .from('operator_sessions')
    .select('*')
    .order('login_time', { ascending: false });
  
  if (error) console.error('Error:', error);
  return data;
};

// Get active sessions
const getActiveSessions = async () => {
  const { data, error } = await supabase
    .from('operator_sessions')
    .select('*')
    .eq('status', 'active')
    .order('login_time', { ascending: false });
  
  return data;
};

// Get sessions for specific operator
const getOperatorSessions = async (operatorName: string) => {
  const { data, error } = await supabase
    .from('operator_sessions')
    .select('*')
    .eq('operator_name', operatorName)
    .order('login_time', { ascending: false });
  
  return data;
};
```

---

## 📱 **Method 4: Supabase Mobile App**

1. Download **Supabase Mobile App** (iOS/Android)
2. Sign in with your account
3. Select your project
4. View tables and data on the go

---

## 🔐 **Security & Permissions**

### Current Setup:
- Using **Anon Key** (public key) - safe for client-side
- **Row Level Security (RLS)** should be enabled for production
- Currently, anyone with the key can read/write (OK for demo)

### For Production:
1. Enable **RLS** on `operator_sessions` table
2. Create policies to restrict access
3. Use **Service Role Key** only on server-side

---

## 📊 **Data Flow in Your App**

### When Operator Logs In:
1. `useAuthStore.login()` is called
2. `createOperatorSession()` creates record in Supabase
3. Session stored with:
   - Operator ID, name, role
   - Login timestamp
   - Device info
   - Status: 'active'

### When Operator Logs Out:
1. `useAuthStore.logout()` is called
2. `endOperatorSession()` updates record:
   - Sets `logout_time`
   - Calculates `session_duration_minutes`
   - Updates `health_alerts_count` and `drill_alerts_count`
   - Sets `status`: 'completed'

### Data Saved:
- ✅ Login time
- ✅ Logout time
- ✅ Session duration
- ✅ Alert counts
- ✅ Device information
- ✅ Operator details

---

## 🎯 **Quick Access Examples**

### View All Data:
```sql
SELECT * FROM operator_sessions;
```

### View Active Sessions (Currently Logged In):
```sql
SELECT * FROM operator_sessions WHERE status = 'active';
```

### View Today's Sessions:
```sql
SELECT * FROM operator_sessions 
WHERE DATE(login_time) = CURRENT_DATE;
```

### View Sessions with Alerts:
```sql
SELECT * FROM operator_sessions 
WHERE health_alerts_count > 0 OR drill_alerts_count > 0;
```

---

## 🚀 **Next Steps**

1. **Access Dashboard**: Go to https://supabase.com and sign in
2. **View Data**: Navigate to Table Editor → `operator_sessions`
3. **Query Data**: Use SQL Editor for custom queries
4. **Or Ask Me**: I can query the database for you using MCP tools!

**Want me to show you the current data?** Just ask: *"Show me all operator sessions"* or *"Get active sessions"*
