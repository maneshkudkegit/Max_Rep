import { Link, NavLink, useNavigate } from 'react-router-dom';

import { logoutAction } from '../features/auth/authSlice';
import { useAppDispatch, useAppSelector } from '../store/hooks';

export function Navbar() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((s) => s.auth.user);

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

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-slate-200 bg-white/95 p-4 backdrop-blur md:flex md:flex-col">
        <Link to="/dashboard" className="mb-4 inline-flex items-center gap-2 text-2xl font-black text-slate-900">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-brand" />
          Max Rep
        </Link>
        <nav className="flex flex-1 flex-col gap-1 text-sm font-semibold text-slate-700">
          <NavLink className={desktopLinkClass} to="/dashboard">Dashboard</NavLink>
          <NavLink className={desktopLinkClass} to="/ai-performance">AI Coach</NavLink>
          <NavLink className={desktopLinkClass} to="/meals">Meals</NavLink>
          <NavLink className={desktopLinkClass} to="/workouts">Workouts</NavLink>
          <NavLink className={desktopLinkClass} to="/analytics">Analytics</NavLink>
          <NavLink className={desktopLinkClass} to="/profile">Profile</NavLink>
          {user.role === 'gym_admin' || user.role === 'superadmin' ? (
            <NavLink className={desktopLinkClass} to="/admin">Admin</NavLink>
          ) : null}
          {user.role === 'superadmin' ? (
            <NavLink className={desktopLinkClass} to="/superadmin">SuperAdmin</NavLink>
          ) : null}
        </nav>
        <button
          className="rounded-xl bg-slate-200 px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-300"
          onClick={async () => {
            await dispatch(logoutAction());
            navigate('/login');
          }}
        >
          Logout
        </button>
      </aside>

      <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/85 px-4 py-3 backdrop-blur md:hidden">
        <div className="flex items-center justify-between">
          <Link to="/dashboard" className="text-lg font-black text-slate-900">Max Rep</Link>
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
        <div className="mt-2 flex gap-2 overflow-x-auto">
          <NavLink className={mobileLinkClass} to="/dashboard">Dashboard</NavLink>
          <NavLink className={mobileLinkClass} to="/ai-performance">AI Coach</NavLink>
          <NavLink className={mobileLinkClass} to="/meals">Meals</NavLink>
          <NavLink className={mobileLinkClass} to="/workouts">Workouts</NavLink>
          <NavLink className={mobileLinkClass} to="/analytics">Analytics</NavLink>
          <NavLink className={mobileLinkClass} to="/profile">Profile</NavLink>
          {user.role === 'gym_admin' || user.role === 'superadmin' ? (
            <NavLink className={mobileLinkClass} to="/admin">Admin</NavLink>
          ) : null}
          {user.role === 'superadmin' ? (
            <NavLink className={mobileLinkClass} to="/superadmin">SuperAdmin</NavLink>
          ) : null}
        </div>
      </header>
    </>
  );
}
