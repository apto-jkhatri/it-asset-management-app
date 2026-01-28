import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useApp } from './context/AppContext';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Assets from './pages/Assets';
import Assignments from './pages/Assignments';
import Employees from './pages/Employees';
import Maintenance from './pages/Maintenance';
import Requests from './pages/Requests';
import Users from './pages/Users';
import UserPortal from './pages/UserPortal';
import Login from './pages/Login';
import { Loader2 } from 'lucide-react';

const App = () => {
  const { loading, currentUser, isAuthLoading } = useApp();

  if (loading || isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-brand-primary animate-spin mb-4" />
        <p className="text-slate-400 font-medium tracking-widest uppercase text-xs">Initializing Environment...</p>
      </div>
    );
  }

  // Route Protection: If no user, show Login
  if (!currentUser) {
    return <Login />;
  }

  // Role-based routing
  if (currentUser.role === 'user') {
    // Standard user sees only their portal
    return (
      <HashRouter>
        <div className="flex min-h-screen bg-slate-50">
          <Sidebar />
          <main className="flex-1 p-8 overflow-y-auto h-screen bg-slate-50">
            <Routes>
              <Route path="/" element={<UserPortal />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </HashRouter>
    );
  }

  // Admin sees full application
  return (
    <HashRouter>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <main className="flex-1 p-8 overflow-y-auto h-screen bg-slate-50">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/assets" element={<Assets />} />
            <Route path="/assignments" element={<Assignments />} />
            <Route path="/employees" element={<Employees />} />
            <Route path="/maintenance" element={<Maintenance />} />
            <Route path="/requests" element={<Requests />} />
            <Route path="/users" element={<Users />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
};

export default App;
