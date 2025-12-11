import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { HealthMonitor } from './pages/HealthMonitor';
import { Analytics } from './pages/Analytics';
import { Settings } from './pages/Settings';
import { About } from './pages/About';
import { Login } from './pages/Login';
import { useDrillStore } from './store/useDrillStore';
import { useHealthStore } from './store/useHealthStore';
import { useAuthStore } from './store/useAuthStore';

function App() {
  const { connect, disconnect } = useDrillStore();
  const { connect: connectHealth, disconnect: disconnectHealth } = useHealthStore();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) {
    connect();
    connectHealth();
    }
    return () => {
      disconnect();
      disconnectHealth();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // Show Login page if not authenticated
  if (!isAuthenticated) {
    return <Login />;
  }

  // Show main app if authenticated
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/health" element={<HealthMonitor />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
