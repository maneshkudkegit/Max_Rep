import { Link } from 'react-router-dom';

import { Navbar } from '../components/Navbar';

export default function LandingPage() {
  return (
    <div className="min-h-screen gradient-bg text-white">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-16 md:py-20">
        <section className="grid grid-cols-1 gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div>
            <p className="chip mb-4 border-white/25 bg-white/10 text-white">Performance SaaS for gyms and members</p>
            <h1 className="text-4xl font-black leading-tight md:text-6xl">
              Max Rep
              <span className="block text-amber-200">Train Smarter. Track Everything.</span>
            </h1>
            <p className="mt-4 max-w-2xl text-base text-slate-200 md:text-lg">
              Advanced fitness intelligence with AI-driven nutrition analysis, workout scoring, hydration risk detection, secure multi-tenant auth, and subscription-ready growth.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/register" className="btn-primary">
                Start Free
              </Link>
              <Link to="/login" className="btn-secondary border-white/50 text-white hover:bg-white/10">
                Login
              </Link>
              <Link to="/ai-performance" className="btn-secondary border-amber-200/70 text-amber-100 hover:bg-amber-300/10">
                AI Coach Demo
              </Link>
            </div>
          </div>

          <div className="panel-glass">
            <h2 className="text-xl font-black">What you get</h2>
            <div className="mt-4 space-y-3 text-sm text-slate-100">
              <div className="rounded-xl bg-white/10 p-3">AI meal parsing with calories, protein, carbs, fats, and nutrition quality scoring.</div>
              <div className="rounded-xl bg-white/10 p-3">Workout volume + intensity analysis with estimated calorie burn and recovery insights.</div>
              <div className="rounded-xl bg-white/10 p-3">Hydration intelligence with adaptive targets and dehydration risk alerts.</div>
              <div className="rounded-xl bg-white/10 p-3">Role-based SaaS dashboards for members, gym admins, trainers, and superadmin.</div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
