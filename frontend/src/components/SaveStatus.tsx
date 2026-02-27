export function SaveStatus({
  status,
  successText = 'Saved successfully.',
  savingText = 'Saving...',
  errorText,
}: {
  status: 'idle' | 'saving' | 'saved' | 'error';
  successText?: string;
  savingText?: string;
  errorText?: string;
}) {
  if (status === 'idle') return null;
  if (status === 'saving') {
    return <p className="rounded-xl border border-blue-200 bg-blue-50 p-2 text-xs font-semibold text-blue-700">{savingText}</p>;
  }
  if (status === 'saved') {
    return <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-2 text-xs font-semibold text-emerald-700">{successText}</p>;
  }
  return <p className="rounded-xl border border-rose-200 bg-rose-50 p-2 text-xs font-semibold text-rose-700">{errorText ?? 'Save failed. Please retry.'}</p>;
}
