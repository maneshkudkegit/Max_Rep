import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';

import { logoutAction } from '../features/auth/authSlice';
import { useAppDispatch, useAppSelector } from '../store/hooks';

export function Navbar() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((s) => s.auth.user);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(false);

  if (!user) {
    return (
      <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <Link to="/" className="inline-flex items-center gap-2 text-xl font-black text-slate-900 md:text-2xl">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-brand" />
            Max Rep
          </Link>
          <div className="flex items-center gap-2">
            <Link className="btn-secondary py-1.5" to="/login">Login</Link>
            <Link to="/register" className="btn-primary py-1.5">Get Started</Link>
          </div>
        </div>
      </header>
    );
  }

  const desktopLinkClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-xl px-3 py-2 transition-colors ${
      isActive ? 'bg-slate-900 text-white' : 'hover:bg-slate-100 text-slate-700'
    }`;

  const mobileLinkClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-full px-3 py-1 text-xs font-semibold ${
      isActive ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'
    }`;

  const iconButtonClass = 'inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-200 text-slate-700 hover:bg-slate-300';
  const closeDesktopSidebar = () => setDesktopSidebarOpen(false);

  return (
    <>
      <div
        className="fixed inset-y-0 left-0 z-20 hidden w-6 md:block"
        onMouseEnter={() => setDesktopSidebarOpen(true)}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-30 hidden w-60 border-r border-slate-200 bg-white/95 p-3 backdrop-blur transition-transform duration-200 md:flex md:flex-col ${
          desktopSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        onMouseEnter={() => setDesktopSidebarOpen(true)}
        onMouseLeave={() => setDesktopSidebarOpen(false)}
      >
        <Link to="/dashboard" className="mb-4 inline-flex items-center gap-2 text-2xl font-black text-slate-900">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-brand" />
          Max Rep
        </Link>
        <nav className="flex flex-1 flex-col gap-1 text-sm font-semibold text-slate-700">
          <NavLink className={desktopLinkClass} to="/dashboard" onClick={closeDesktopSidebar}>Dashboard</NavLink>
          <NavLink className={desktopLinkClass} to="/ai-performance" onClick={closeDesktopSidebar}>AI Coach</NavLink>
          <NavLink className={desktopLinkClass} to="/meals" onClick={closeDesktopSidebar}>Meals</NavLink>
          <NavLink className={desktopLinkClass} to="/workouts" onClick={closeDesktopSidebar}>Workouts</NavLink>
          <NavLink className={desktopLinkClass} to="/analytics" onClick={closeDesktopSidebar}>Analytics</NavLink>
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/settings" className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-300" title="Settings">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0A1.65 1.65 0 0 0 10 3.09V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            Settings
          </Link>
          <button
            className="flex-1 rounded-xl bg-slate-200 px-3 py-2 text-center text-sm font-semibold text-slate-700 hover:bg-slate-300"
            onClick={async () => {
              await dispatch(logoutAction());
              navigate('/login');
            }}
          >
            Logout
          </button>
        </div>
      </aside>

      <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/85 px-4 py-3 backdrop-blur md:hidden">
        <div className="flex items-center justify-between">
          <Link to="/dashboard" className="text-lg font-black text-slate-900">Max Rep</Link>
          <div className="flex items-center gap-2">
            <Link to="/settings" className={iconButtonClass} title="Settings">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0A1.65 1.65 0 0 0 10 3.09V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </Link>
            <button
              className="rounded-lg bg-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700"
              onClick={async () => {
                await dispatch(logoutAction());
                navigate('/login');
              }}
            >
              Logout
            </button>
          </div>
        </div>
        <div className="mt-2 flex gap-2 overflow-x-auto">
          <NavLink className={mobileLinkClass} to="/dashboard">Dashboard</NavLink>
          <NavLink className={mobileLinkClass} to="/ai-performance">AI Coach</NavLink>
          <NavLink className={mobileLinkClass} to="/meals">Meals</NavLink>
          <NavLink className={mobileLinkClass} to="/workouts">Workouts</NavLink>
          <NavLink className={mobileLinkClass} to="/analytics">Analytics</NavLink>
        </div>
      </header>
    </>
  );
}
