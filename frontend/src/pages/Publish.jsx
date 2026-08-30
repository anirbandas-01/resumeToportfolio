import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Publish() {
  const { id } = useParams();
  const { user, updateUser } = useAuth();

  const [isPublished, setIsPublished] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isToggling, setIsToggling] = useState(false);
  const [error, setError] = useState('');

  // Username-setup sub-form, shown inline when the user doesn't have one yet.
  const [needsUsername, setNeedsUsername] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [isSavingUsername, setIsSavingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await api.get(`/resume/${id}`);
        if (cancelled) return;
        setIsPublished(res.data.resume.isPublished);
      } catch (err) {
        setError(err.response?.data?.error || 'Could not load this resume.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function handleTogglePublish() {
    setError('');
    setIsToggling(true);
    try {
      const res = await api.patch(`/resume/${id}/publish`);
      setIsPublished(res.data.isPublished);
      setNeedsUsername(false);
    } catch (err) {
      const message = err.response?.data?.error;
      if (err.response?.status === 400 && message?.toLowerCase().includes('username')) {
        setNeedsUsername(true);
      } else {
        setError(message || 'Could not update publish status.');
      }
    } finally {
      setIsToggling(false);
    }
  }

  async function handleSetUsername(e) {
    e.preventDefault();
    setUsernameError('');

    if (!/^[a-z0-9-]{3,30}$/.test(usernameInput)) {
      setUsernameError('3-30 characters: lowercase letters, numbers, and hyphens only.');
      return;
    }

    setIsSavingUsername(true);
    try {
      const res = await api.put('/auth/username', { username: usernameInput });
      updateUser({ username: res.data.user.username });
      setNeedsUsername(false);
      // Now that a username exists, retry publishing.
      await handleTogglePublish();
    } catch (err) {
      setUsernameError(err.response?.data?.error || 'Could not save that username.');
    } finally {
      setIsSavingUsername(false);
    }
  }

  const shareUrl = user?.username ? `${window.location.origin}/u/${user.username}` : null;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="font-semibold text-slate-900">
            Resume → Portfolio
          </Link>
          <span className="text-sm text-slate-400">Step 4 of 4 — Publish</span>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-16">
        {error && (
          <div className="mb-6 text-sm text-red-700 bg-red-50 border border-red-100 rounded-md px-3 py-2">
            {error}
          </div>
        )}

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-8 text-center">
          {needsUsername ? (
            <>
              <h1 className="text-lg font-semibold text-slate-900 mb-1">
                Choose your portfolio address
              </h1>
              <p className="text-sm text-slate-500 mb-5">
                This becomes your public link — you can't change it as easily later, so pick
                something you like.
              </p>
              <form onSubmit={handleSetUsername} className="text-left space-y-3">
                {usernameError && (
                  <div className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-md px-3 py-2">
                    {usernameError}
                  </div>
                )}
                <div className="flex items-center rounded-md border border-slate-300 overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500">
                  <span className="pl-3 text-sm text-slate-400 select-none">
                    {window.location.host}/u/
                  </span>
                  <input
                    type="text"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value.toLowerCase())}
                    placeholder="jane-doe"
                    className="flex-1 px-2 py-2 text-sm text-slate-900 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSavingUsername}
                  className="w-full bg-indigo-600 text-white text-sm font-medium rounded-md py-2 hover:bg-indigo-700 transition-colors disabled:opacity-60"
                >
                  {isSavingUsername ? 'Saving...' : 'Save and publish'}
                </button>
              </form>
            </>
          ) : (
            <>
              <div
                className={`h-10 w-10 rounded-full mx-auto mb-4 flex items-center justify-center ${
                  isPublished ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'
                }`}
              >
                {isPublished ? '●' : '○'}
              </div>
              <h1 className="text-lg font-semibold text-slate-900 mb-1">
                {isPublished ? 'Your portfolio is live' : 'Ready to publish'}
              </h1>
              <p className="text-sm text-slate-500 mb-6">
                {isPublished
                  ? 'Anyone with the link below can view your portfolio.'
                  : 'Publishing makes your portfolio visible at your public link.'}
              </p>

              {shareUrl && isPublished && (
                <div className="flex items-center rounded-md border border-slate-200 bg-slate-50 px-3 py-2 mb-6">
                  <span className="flex-1 text-sm text-slate-700 text-left truncate">
                    {shareUrl}
                  </span>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(shareUrl)}
                    className="text-xs font-medium text-indigo-600 hover:text-indigo-700 ml-3"
                  >
                    Copy
                  </button>
                </div>
              )}

              <button
                onClick={handleTogglePublish}
                disabled={isToggling}
                className={`w-full text-sm font-medium rounded-md py-2 transition-colors disabled:opacity-60 ${
                  isPublished
                    ? 'border border-slate-300 text-slate-700 hover:bg-slate-100'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                {isToggling ? 'Updating...' : isPublished ? 'Unpublish' : 'Publish'}
              </button>
            </>
          )}
        </div>
      </main>
    </div>
  );
}