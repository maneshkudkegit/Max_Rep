import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { Navbar } from '../components/Navbar';
import { SaveStatus } from '../components/SaveStatus';
import { api } from '../lib/api';
import { useAppSelector } from '../store/hooks';
import type { ProfileData } from '../types';

const UPGRADE_POINTS = [
  'Advanced daily/weekly/monthly/yearly analytics graphs.',
  'Smart AI meal suggestions from your available ingredients.',
  'Personalized nutrient gap recommendations by your own data.',
  'Advanced workout intensity and cardio target guidance.',
  'Richer history tools with quick edit/remove/undo workflows.',
  'Priority recommendations and improved recovery insights.',
  'Future premium features unlocked automatically.',
];

export default function SettingsPage() {
  const auth = useAppSelector((s) => s.auth.user);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    void (async () => {
      const res = await api.get<ProfileData>('/auth/profile');
      setProfile(res.data);
    })();
  }, []);

  const sleepHealth = useMemo(() => {
    if (!profile) return 'Unknown';
    const weekday = profile.weekday_sleep_hours ?? 0;
    const weekend = profile.weekend_sleep_hours ?? 0;
    if (weekday >= 7 && weekday <= 9 && weekend >= 7 && weekend <= 10) return 'Healthy';
    if (weekday >= 6) return 'Needs improvement';
    return 'Low sleep pattern';
  }, [profile]);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    try {
      setStatus('saving');
      const res = await api.put<ProfileData>('/auth/profile', {
        full_name: profile.full_name,
        age: profile.age,
        height_cm: profile.height_cm,
        weight_kg: profile.weight_kg,
        photo_url: profile.photo_url,
        weekday_sleep_hours: profile.weekday_sleep_hours,
        weekend_sleep_hours: profile.weekend_sleep_hours,
      });
      setProfile(res.data);
      setDirty(false);
      setStatus('saved');
    } catch {
      setStatus('error');
    }
  };

  if (!profile) {
    return (
      <div>
        <Navbar />
        <div className="md:pl-0 p-8">Loading settings...</div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="md:pl-0">
        <main className="main-with-sidebar">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black">Settings & Profile</h1>
              <p className="text-sm text-slate-600">Keep profile updated for accurate AI and dashboard suggestions.</p>
            </div>
            <p className="text-xs text-slate-500">Last login: {profile.last_login_at ? new Date(profile.last_login_at).toLocaleString() : 'N/A'}</p>
          </div>

          {(auth?.role === 'gym_admin' || auth?.role === 'superadmin') ? (
            <section className="panel mb-4">
              <h2 className="text-lg font-black">Admin Access</h2>
              <p className="text-sm text-slate-600">Management tools are available here in settings.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link className="btn-secondary" to="/admin">Open Admin Panel</Link>
                {auth.role === 'superadmin' ? <Link className="btn-secondary" to="/superadmin">Open Superadmin</Link> : null}
              </div>
            </section>
          ) : null}

          {profile.profile_completion_tips.length > 0 ? (
            <section className="panel mb-4">
              <h2 className="text-lg font-black">Recommended next steps</h2>
              <ul className="mt-2 space-y-2 text-sm text-amber-800">
                {profile.profile_completion_tips.map((tip) => (
                  <li key={tip} className="rounded-xl bg-amber-50 p-2">{tip}</li>
                ))}
              </ul>
            </section>
          ) : null}

          <form className="panel mb-4 space-y-3" onSubmit={saveProfile}>
            <h2 className="text-lg font-black">Profile</h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <label className="text-sm">Full Name
                <input className="input-field mt-1" value={profile.full_name} onChange={(e) => { setProfile({ ...profile, full_name: e.target.value }); setDirty(true); }} />
              </label>
              <label className="text-sm">Photo URL
                <input className="input-field mt-1" value={profile.photo_url ?? ''} onChange={(e) => { setProfile({ ...profile, photo_url: e.target.value || null }); setDirty(true); }} />
              </label>
              <label className="text-sm">Age
                <input className="input-field mt-1" type="number" value={profile.age} onChange={(e) => { setProfile({ ...profile, age: Number(e.target.value) }); setDirty(true); }} />
              </label>
              <label className="text-sm">Height (cm)
                <input className="input-field mt-1" type="number" value={profile.height_cm} onChange={(e) => { setProfile({ ...profile, height_cm: Number(e.target.value) }); setDirty(true); }} />
              </label>
              <label className="text-sm">Weight (kg)
                <input className="input-field mt-1" type="number" value={profile.weight_kg} onChange={(e) => { setProfile({ ...profile, weight_kg: Number(e.target.value) }); setDirty(true); }} />
              </label>
              <label className="text-sm">Weekday Sleep Hours
                <input className="input-field mt-1" type="number" step="0.1" value={profile.weekday_sleep_hours ?? ''} onChange={(e) => { setProfile({ ...profile, weekday_sleep_hours: Number(e.target.value) || null }); setDirty(true); }} />
              </label>
              <label className="text-sm">Weekend Sleep Hours
                <input className="input-field mt-1" type="number" step="0.1" value={profile.weekend_sleep_hours ?? ''} onChange={(e) => { setProfile({ ...profile, weekend_sleep_hours: Number(e.target.value) || null }); setDirty(true); }} />
              </label>
            </div>
            <p className="text-sm">Sleep pattern status: <b>{sleepHealth}</b></p>
            <SaveStatus status={status} successText="Settings saved." />
            <button className="btn-primary" disabled={!dirty && status !== 'error'}>Save Settings</button>
          </form>

          <section className="panel mb-4">
            <h2 className="text-lg font-black">Upgrade Plan</h2>
            <p className="text-sm text-slate-600">Current plan: <b className="uppercase">{auth?.tier ?? 'free'}</b></p>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              {UPGRADE_POINTS.map((item, idx) => (
                <li key={item} className="rounded-xl border border-slate-200 p-3">
                  <b>{idx + 1}.</b> {item}
                </li>
              ))}
            </ul>
            <Link className="btn-secondary mt-3 inline-flex" to="/subscription">Open Upgrade Options</Link>
          </section>
        </main>
      </div>
    </div>
  );
}


