import { useEffect, useState } from 'react';

import { Navbar } from '../components/Navbar';
import { SaveStatus } from '../components/SaveStatus';
import { api } from '../lib/api';

export default function ProfilePage() {
  const [weight_kg, setWeight] = useState(70);
  const [sleep_hours, setSleep] = useState(7);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setStatus('saving');
      await api.put('/tracking/weight', { weight_kg });
      await api.put('/tracking/sleep', { sleep_hours });
      setStatus('saved');
      setDirty(false);
    } catch {
      setStatus('error');
    }
  };

  return (
    <div>
      <Navbar />
      <main className="mx-auto max-w-xl px-4 py-8">
        <h1 className="mb-2 text-2xl font-black">Profile Management</h1>
        <p className="mb-4 text-xs text-slate-500">{dirty ? 'You have unsaved changes.' : 'All changes saved.'}</p>
        <form className="panel space-y-3" onSubmit={submit}>
          <label className="block text-sm">Current weight (kg)
            <input className="input-field mt-1" type="number" value={weight_kg} onChange={(e) => { setWeight(Number(e.target.value)); setDirty(true); if (status !== 'idle') setStatus('idle'); }} />
          </label>
          <label className="block text-sm">Sleep hours
            <input className="input-field mt-1" type="number" value={sleep_hours} onChange={(e) => { setSleep(Number(e.target.value)); setDirty(true); if (status !== 'idle') setStatus('idle'); }} />
          </label>
          <SaveStatus status={status} successText="Profile metrics saved." />
          <button className="btn-primary">Update</button>
        </form>
      </main>
    </div>
  );
}
