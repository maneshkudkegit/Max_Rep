import { Link, useNavigate } from 'react-router-dom';

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

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-slate-200 bg-white/95 p-4 backdrop-blur md:flex md:flex-col">
        <Link to="/dashboard" className="mb-4 inline-flex items-center gap-2 text-2xl font-black text-slate-900">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-brand" />
          Max Rep
        </Link>
        <nav className="flex flex-1 flex-col gap-1 text-sm font-semibold text-slate-700">
          <Link className="rounded-xl px-3 py-2 hover:bg-slate-100" to="/dashboard">Dashboard</Link>
          <Link className="rounded-xl px-3 py-2 hover:bg-slate-100" to="/ai-performance">AI Coach</Link>
          <Link className="rounded-xl px-3 py-2 hover:bg-slate-100" to="/meals">Meals</Link>
          <Link className="rounded-xl px-3 py-2 hover:bg-slate-100" to="/workouts">Workouts</Link>
          <Link className="rounded-xl px-3 py-2 hover:bg-slate-100" to="/analytics">Analytics</Link>
          <Link className="rounded-xl px-3 py-2 hover:bg-slate-100" to="/profile">Profile</Link>
          {user.role === 'gym_admin' || user.role === 'superadmin' ? (
            <Link className="rounded-xl px-3 py-2 hover:bg-slate-100" to="/admin">Admin</Link>
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
          <Link className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700" to="/dashboard">Dashboard</Link>
          <Link className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700" to="/ai-performance">AI Coach</Link>
          <Link className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700" to="/meals">Meals</Link>
          <Link className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700" to="/workouts">Workouts</Link>
          <Link className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700" to="/analytics">Analytics</Link>
          <Link className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700" to="/profile">Profile</Link>
          {user.role === 'gym_admin' || user.role === 'superadmin' ? (
            <Link className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700" to="/admin">Admin</Link>
          ) : null}
        </div>
      </header>
    </>
  );
}
