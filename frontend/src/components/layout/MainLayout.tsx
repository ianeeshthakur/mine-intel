import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Map, Layers, Target, Compass, HardHat, Server, Activity, ArrowRight } from 'lucide-react';

export default function MainLayout() {
  const navItems = [
    { to: "/", icon: <Activity className="w-5 h-5" />, label: "Command Center" },
    { to: "/analyze", icon: <Compass className="w-5 h-5" />, label: "Analyze Area" },
    { to: "/explorer", icon: <Map className="w-5 h-5" />, label: "Prospectivity Explorer" },
    { to: "/verification", icon: <HardHat className="w-5 h-5" />, label: "Field Verification" },
    { to: "/production", icon: <ArrowRight className="w-5 h-5" />, label: "Production Intelligence" },
    { to: "/data-health", icon: <Server className="w-5 h-5" />, label: "Data Health" },
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-slate-200 flex flex-col shadow-sm z-10">
        <div className="p-6 border-b border-slate-200">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">MINE-INTEL</h1>
          <p className="text-xs font-medium text-slate-500 mt-1 uppercase tracking-wider">Explore with Evidence.</p>
        </div>
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-slate-100 text-blue-700"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`
                  }
                >
                  {item.icon}
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="p-4 border-t border-slate-200">
          <div className="bg-slate-50 rounded p-3 text-xs text-slate-500 border border-slate-200">
            <p className="font-semibold text-slate-700 mb-1">Region: Balaghat, MP</p>
            <p>Simulated Demo Data</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
