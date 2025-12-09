import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { HealthMonitor } from './pages/HealthMonitor';
import { Analytics } from './pages/Analytics';
import { Settings } from './pages/Settings';
import { About } from './pages/About';
import { useDrillStore } from './store/useDrillStore';

function App() {
  const { connect, disconnect } = useDrillStore();

  useEffect(() => {
    connect();
    return () => disconnect();
  }, []);

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
