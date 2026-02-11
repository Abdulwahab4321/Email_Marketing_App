import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, List, Mail } from 'lucide-react';

const Sidebar: React.FC = () => {
  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/campaign/new', icon: PlusCircle, label: 'New Campaign' },
    { to: '/campaigns', icon: List, label: 'All Campaigns' },
  ];

  return (
    <aside className="w-64 bg-slate-900 h-screen p-4 flex flex-col sticky top-0">
      <div className="flex items-center gap-3 mb-8 px-2">
        <Mail className="w-8 h-8 text-blue-400" />
        <h1 className="text-xl font-bold text-white">Email Pro</h1>
      </div>

      <nav className="flex-1">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`
                }
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-auto pt-4 border-t border-slate-700">
        <div className="px-4 py-2">
          <p className="text-sm text-slate-400">Pro Plan</p>
          <p className="text-xs text-slate-500">12,450 subscribers</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
