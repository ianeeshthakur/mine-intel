import { Outlet, NavLink } from 'react-router-dom';
import { Map, Compass, HardHat, Server, Activity, ArrowRight, FileText, Bell, Search, ChevronDown } from 'lucide-react';
import ChatWidget from '../ChatWidget';

export default function MainLayout() {
  const navItems = [
    { to: "/", icon: <Activity className="w-5 h-5" />, label: "Command Center" },
    { to: "/analyze", icon: <Compass className="w-5 h-5" />, label: "Analyze Area" },
    { to: "/explorer", icon: <Map className="w-5 h-5" />, label: "Prospectivity Explorer" },
    { to: "/verification", icon: <HardHat className="w-5 h-5" />, label: "Field Verification" },
    { to: "/production", icon: <ArrowRight className="w-5 h-5" />, label: "Production Intelligence" },
    { to: "/reports-impact", icon: <FileText className="w-5 h-5" />, label: "Reports & Impact" },
    { to: "/data-health", icon: <Server className="w-5 h-5" />, label: "Data Health" },
  ];

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#f8fafc]">
      {/* Top Header */}
      <header className="h-[68px] bg-white border-b border-slate-200 flex items-center justify-between px-6 z-20 flex-shrink-0 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <h1 className="text-[22px] font-extrabold text-[#0f172a] tracking-tight leading-none">MINE-INTEL</h1>
            <p className="text-[11px] font-semibold text-slate-500 tracking-wide mt-1">Explore Smarter. Mine Better.</p>
          </div>
        </div>

        <div className="flex-1 max-w-2xl mx-8">
          <div className="relative group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Search targets, regions, or coordinates..." 
              className="w-full bg-slate-50 border border-slate-200 text-sm rounded-lg pl-10 pr-12 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
              <kbd className="hidden sm:inline-block border border-slate-200 bg-white rounded text-[10px] font-semibold text-slate-400 px-1.5 py-0.5 shadow-sm">⌘K</kbd>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-5">
          <button className="relative text-slate-400 hover:text-slate-600 transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 border border-white rounded-full"></span>
          </button>
          <div className="h-6 w-px bg-slate-200"></div>
          <button className="flex items-center gap-2 hover:bg-slate-50 p-1.5 rounded-lg transition-colors">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shadow-sm">
              EA
            </div>
            <div className="flex flex-col items-start hidden sm:flex">
              <span className="text-[13px] font-semibold text-slate-700 leading-tight">Exploration Analyst</span>
              <span className="text-[11px] text-slate-400 leading-tight">Lead Geologist</span>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 ml-1" />
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-[240px] bg-white border-r border-slate-200 flex flex-col shadow-[1px_0_2px_rgba(0,0,0,0.02)] z-10">
          <nav className="flex-1 overflow-y-auto py-5">
            <ul className="space-y-1 px-4">
              {navItems.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13.5px] font-medium transition-all duration-200 ${
                        isActive
                          ? "bg-blue-50/80 text-blue-700 shadow-sm shadow-blue-100/50"
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
          
          <div className="p-5 border-t border-slate-100 bg-white">
            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/60 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 rounded-l-xl"></div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Current Region</p>
              <p className="font-semibold text-slate-700 text-[13px] leading-tight mb-0.5">Balaghat, Madhya Pradesh</p>
              <p className="text-xs text-slate-500 mb-3">1,000 km²</p>
              
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded w-fit border border-amber-100/50 mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                SIMULATED DEMO DATA
              </div>
              
              <button className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors w-full text-left flex items-center justify-between group-hover:bg-blue-50 p-1.5 -ml-1.5 rounded">
                Change Region
                <ChevronDown className="w-3.5 h-3.5 opacity-50" />
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden relative bg-[#f8fafc]">
          <main className="flex-1 overflow-y-auto">
            <Outlet />
          </main>
          <ChatWidget />
        </div>
      </div>
    </div>
  );
}

