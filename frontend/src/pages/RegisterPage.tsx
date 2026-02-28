import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Navbar } from '../components/Navbar';
import { api } from '../lib/api';

function slugPreview(name: string): string {
  return (name || 'max rep gym')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'max-rep-gym';
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({
    tenant_name: 'Max Rep Demo Gym',
    full_name: '',
    email: '',
    password: '',
  });

  const canSubmit = useMemo(() => {
    return form.tenant_name.trim() && form.full_name.trim() && form.email.trim() && form.password.trim();
  }, [form]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!canSubmit) {
      setError('Please fill required fields.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post('/auth/register', form);
      setSuccess(`Account created successfully. Gym slug: ${res.data.tenant_slug}. Redirecting...`);
      setTimeout(() => navigate('/dashboard'), 900);
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen app-surface">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <section className="panel-hero mb-6">
          <h1 className="mb-2 text-3xl font-black text-slate-900">Create Max Rep Account</h1>
          <p className="text-sm text-slate-600">Quick registration. You can complete profile details in Settings after login.</p>
        </section>

        <form onSubmit={submit} className="panel grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="text-sm md:col-span-2">
            <span className="mb-1 block font-medium">Gym Name</span>
            <input className="input-field" value={form.tenant_name} onChange={(e) => setForm({ ...form, tenant_name: e.target.value })} />
            <span className="mt-1 block text-xs text-slate-500">Auto slug preview: <b>{slugPreview(form.tenant_name)}</b></span>
          </label>

          <label className="text-sm">
            <span className="mb-1 block font-medium">Full Name</span>
            <input className="input-field" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          </label>

          <label className="text-sm">
            <span className="mb-1 block font-medium">Email</span>
            <input className="input-field" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </label>

          <label className="text-sm md:col-span-2">
            <span className="mb-1 block font-medium">Password</span>
            <input className="input-field" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </label>

          {error ? <p className="rounded bg-red-50 p-2 text-xs text-red-600 md:col-span-2">{error}</p> : null}
          {success ? <p className="rounded bg-emerald-50 p-2 text-xs text-emerald-700 md:col-span-2">{success}</p> : null}

          <button disabled={!canSubmit || submitting} className="btn-primary w-full disabled:opacity-60 md:col-span-2">
            {submitting ? 'Creating Account...' : 'Register'}
          </button>
        </form>
      </main>
    </div>
  );
}
