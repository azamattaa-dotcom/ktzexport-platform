'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';

export default function SupplierPasswordForm() {
  const t = useTranslations('supplierPasswordForm');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaved(false);

    if (newPassword.length < 8) { setError(t('errorTooShort')); return; }
    if (newPassword !== confirmPassword) { setError(t('errorMismatch')); return; }

    setSaving(true);
    const res = await fetch('/api/supplier/password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    setSaving(false);

    if (res.ok) {
      setSaved(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setSaved(false), 3000);
    } else if (res.status === 401) {
      setError(t('errorWrong'));
    } else {
      setError(t('errorGeneric'));
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{t('currentPasswordLabel')}</label>
        <input
          type="password"
          required
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{t('newPasswordLabel')}</label>
          <input
            type="password"
            required
            minLength={8}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{t('confirmPasswordLabel')}</label>
          <input
            type="password"
            required
            minLength={8}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
          />
        </div>
      </div>
      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
      <button
        type="submit"
        disabled={saving}
        className="bg-primary-700 hover:bg-primary-800 disabled:bg-primary-400 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors text-sm"
      >
        {saving ? t('saving') : saved ? t('saved') : t('submit')}
      </button>
    </form>
  );
}
