import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Navbar } from '../components/Navbar';
import { api } from '../lib/api';

export default function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', tenant_slug: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showSlug, setShowSlug] = useState(false);

  const canSubmit = useMemo(() => {
    return form.email.trim() !== '' && form.password.trim() !== '';
  }, [form]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!canSubmit) {
      setError('Please fill email and password.');
      return;
    }
    try {
      setSubmitting(true);
      const payload = form.tenant_slug.trim() ? form : { email: form.email, password: form.password };
      await api.post('/auth/login', payload);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? 'Login failed. Please check credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen app-surface">
      <Navbar />
      <main className="mx-auto grid min-h-[calc(100vh-72px)] max-w-6xl grid-cols-1 gap-6 px-4 py-8 md:grid-cols-2 md:items-center">
        <section className="order-2 panel md:order-1 md:p-8">
          <h1 className="mb-2 text-3xl font-black text-slate-900">Welcome back to Max Rep</h1>
          <p className="mb-6 text-sm text-slate-600">Secure sign-in with cookie-based auth and session protection.</p>

          <form className="space-y-4" onSubmit={submit}>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">Email</span>
              <input
                className="input-field"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </label>

            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">Password</span>
              <input
                className="input-field"
                placeholder="Your password"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </label>

            <button
              type="button"
              className="text-left text-xs text-slate-500 underline"
              onClick={() => setShowSlug((v) => !v)}
            >
              {showSlug ? 'Hide gym slug field' : 'Have multiple gyms? Enter gym slug'}
            </button>

            {showSlug ? (
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-slate-700">Gym Slug (optional)</span>
                <input
                  className="w-full rounded-lg border border-slate-300 p-2.5 outline-none transition focus:border-brand"
                  placeholder="max-rep-demo-gym"
                  value={form.tenant_slug}
                  onChange={(e) => setForm({ ...form, tenant_slug: e.target.value })}
                />
              </label>
            ) : null}

            {error ? <p className="rounded-md bg-red-50 p-2 text-xs text-red-600">{error}</p> : null}

            <button disabled={!canSubmit || submitting} className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60">
              {submitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </section>

        <section className="order-1 rounded-2xl bg-gradient-to-br from-[#b65c2d] via-[#d08a45] to-[#1f6f78] p-6 text-white shadow-card md:order-2 md:p-8">
          <h2 className="text-2xl font-black">Gym slug is optional now</h2>
          <p className="mt-3 text-sm text-white/90">
            If your email belongs to one gym, login works directly with email and password.
          </p>
          <p className="mt-3 text-sm text-white/90">
            Use slug only when the same email belongs to multiple gyms.
          </p>
          <p className="mt-3 rounded-md bg-white/15 p-3 text-sm">
            Example slug: <span className="font-bold">max-rep-demo-gym</span>
          </p>
        </section>
      </main>
    </div>
  );
}
