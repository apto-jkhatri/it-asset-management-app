import React from 'react';
import { NavLink } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { LayoutDashboard, Box, Users, ClipboardList, Wrench, Inbox } from 'lucide-react';

const Sidebar = () => {
  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/assets', icon: Box, label: 'Assets' },
    { to: '/employees', icon: Users, label: 'Employees' },
    { to: '/assignments', icon: ClipboardList, label: 'Assignments' },
    { to: '/maintenance', icon: Wrench, label: 'Maintenance' },
    { to: '/requests', icon: Inbox, label: 'Requests' },
  ];

  return (
    <div className="w-64 bg-slate-900 text-slate-100 flex flex-col h-screen sticky top-0 border-r border-slate-800">
      <div className="p-6 border-b border-slate-800 flex items-center space-x-3 select-none">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/50">
          <Box size={20} className="text-white" />
        </div>
        <div>
          <span className="text-xl font-bold tracking-tight block leading-none">AssetGuard</span>
          <span className="text-[10px] text-slate-400 tracking-wider uppercase font-semibold">Desktop Admin</span>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center px-4 py-3 rounded-lg transition-all duration-200 select-none ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
              }`
            }
          >
            <item.icon size={20} className="mr-3" />
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="mt-2 px-4 py-3 bg-slate-800 rounded-lg border border-slate-700 select-none">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-xs font-bold">
              AD
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-slate-200">Administrator</p>
              <p className="text-xs text-slate-500 truncate">System Access</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;