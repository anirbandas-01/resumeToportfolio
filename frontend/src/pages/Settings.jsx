import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Settings() {
  const { user, updateUser } = useAuth();

  // Username form
  const [usernameInput, setUsernameInput] = useState(user?.username || '');
  const [usernameError, setUsernameError] = useState('');
  const [usernameSuccess, setUsernameSuccess] = useState('');
  const [isSavingUsername, setIsSavingUsername] = useState(false);

  // Password form
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Portfolio visibility
  const [resume, setResume] = useState(null);
  const [isLoadingResume, setIsLoadingResume] = useState(true);
  const [isTogglingPublish, setIsTogglingPublish] = useState(false);
  const [publishError, setPublishError] = useState('');

  useEffect(() => {
    let cancelled = false;
    api
      .get('/resumes/mine')
      .then((res) => {
        if (!cancelled) setResume(res.data.resume);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingResume(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleUsernameSubmit(e) {
    e.preventDefault();
    setUsernameError('');
    setUsernameSuccess('');

    if (!/^[a-z0-9-]{3,30}$/.test(usernameInput)) {
      setUsernameError('3-30 characters: lowercase letters, numbers, and hyphens only.');
      return;
    }

    setIsSavingUsername(true);
    try {
      const res = await api.put('/auth/username', { username: usernameInput });
      updateUser({ username: res.data.user.username });
      setUsernameSuccess('Username updated.');
      setTimeout(() => setUsernameSuccess(''), 2500);
    } catch (err) {
      setUsernameError(err.response?.data?.error || 'Could not update username.');
    } finally {
      setIsSavingUsername(false);
    }
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      setPasswordError('Both fields are required.');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }

    setIsSavingPassword(true);
    try {
      await api.put('/auth/password', passwordForm);
      setPasswordSuccess('Password updated.');
      setPasswordForm({ currentPassword: '', newPassword: '' });
      setTimeout(() => setPasswordSuccess(''), 2500);
    } catch (err) {
      setPasswordError(err.response?.data?.error || 'Could not update password.');
    } finally {
      setIsSavingPassword(false);
    }
  }

  async function handleTogglePublish() {
    if (!resume) return;
    setPublishError('');
    setIsTogglingPublish(true);
    try {
      const res = await api.patch(`/resumes/${resume._id}/publish`);
      setResume((prev) => ({ ...prev, isPublished: res.data.isPublished }));
    } catch (err) {
      setPublishError(err.response?.data?.error || 'Could not update publish status.');
    } finally {
      setIsTogglingPublish(false);
    }
  }

  const shareUrl = user?.username ? `${window.location.origin}/u/${user.username}` : null;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="font-semibold text-slate-900">
            Resume → Portfolio
          </Link>
          <span className="text-sm text-slate-400">Settings</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-10 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Settings</h1>
          <p className="mt-1 text-sm text-slate-500">Manage your account and portfolio.</p>
        </div>

        {/* Account info (read-only email) */}
        <Section title="Account">
          <Field label="Email">
            <div className="text-sm text-slate-700">{user?.email}</div>
          </Field>
        </Section>

        {/* Username */}
        <Section title="Portfolio username">
          <form onSubmit={handleUsernameSubmit} className="space-y-3">
            {usernameError && <ErrorBanner>{usernameError}</ErrorBanner>}
            {usernameSuccess && <SuccessBanner>{usernameSuccess}</SuccessBanner>}
            <div className="flex items-center rounded-md border border-slate-300 overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500">
              <span className="pl-3 text-sm text-slate-400 select-none">
                {window.location.host}/u/
              </span>
              <input
                type="text"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value.toLowerCase())}
                className="flex-1 px-2 py-2 text-sm text-slate-900 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={isSavingUsername}
              className="text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md px-4 py-2 disabled:opacity-60"
            >
              {isSavingUsername ? 'Saving...' : 'Save username'}
            </button>
          </form>
        </Section>

        {/* Password */}
        <Section title="Change password">
          <form onSubmit={handlePasswordSubmit} className="space-y-3">
            {passwordError && <ErrorBanner>{passwordError}</ErrorBanner>}
            {passwordSuccess && <SuccessBanner>{passwordSuccess}</SuccessBanner>}
            <Field label="Current password">
              <input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) =>
                  setPasswordForm((p) => ({ ...p, currentPassword: e.target.value }))
                }
                className={inputClass}
                autoComplete="current-password"
              />
            </Field>
            <Field label="New password">
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))}
                className={inputClass}
                autoComplete="new-password"
                placeholder="At least 6 characters"
              />
            </Field>
            <button
              type="submit"
              disabled={isSavingPassword}
              className="text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md px-4 py-2 disabled:opacity-60"
            >
              {isSavingPassword ? 'Saving...' : 'Update password'}
            </button>
          </form>
        </Section>

        {/* Portfolio visibility */}
        <Section title="Portfolio visibility">
          {isLoadingResume ? (
            <p className="text-sm text-slate-400">Loading...</p>
          ) : !resume ? (
            <p className="text-sm text-slate-500">
              You haven't uploaded a resume yet.{' '}
              <Link to="/" className="text-indigo-600 font-medium hover:text-indigo-700">
                Upload one
              </Link>{' '}
              to publish a portfolio.
            </p>
          ) : (
            <>
              {publishError && <ErrorBanner>{publishError}</ErrorBanner>}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-700">
                    Your portfolio is currently{' '}
                    <span className={resume.isPublished ? 'text-emerald-600' : 'text-slate-500'}>
                      {resume.isPublished ? 'public' : 'private'}
                    </span>
                    .
                  </p>
                  {shareUrl && resume.isPublished && (
                    <a
                      href={shareUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-indigo-600 hover:text-indigo-700"
                    >
                      {shareUrl}
                    </a>
                  )}
                </div>
                <button
                  onClick={handleTogglePublish}
                  disabled={isTogglingPublish}
                  className={`text-sm font-medium rounded-md px-4 py-2 transition-colors disabled:opacity-60 ${
                    resume.isPublished
                      ? 'border border-slate-300 text-slate-700 hover:bg-slate-100'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  {isTogglingPublish
                    ? 'Updating...'
                    : resume.isPublished
                    ? 'Make private'
                    : 'Publish'}
                </button>
              </div>
            </>
          )}
        </Section>
      </main>
    </div>
  );
}

const inputClass =
  'w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500';

function Section({ title, children }) {
  return (
    <section className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
      <h2 className="text-sm font-semibold text-slate-900 mb-4">{title}</h2>
      {children}
    </section>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-500 mb-1">{label}</label>
      {children}
    </div>
  );
}

function ErrorBanner({ children }) {
  return (
    <div className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-md px-3 py-2">
      {children}
    </div>
  );
}

function SuccessBanner({ children }) {
  return (
    <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-md px-3 py-2">
      {children}
    </div>
  );
}