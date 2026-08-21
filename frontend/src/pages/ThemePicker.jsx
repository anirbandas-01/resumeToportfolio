import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../api/client';

// Theme ids are stored as-is on the resume (`theme` field) and drive rendering
// on the public portfolio page (step 8). Keep these ids in sync with that page.
const THEMES = [
  {
    id: 'default',
    name: 'Default',
    description: 'Clean and professional, indigo accents.',
    preview: { bg: '#ffffff', accent: '#4f46e5', text: '#0f172a' },
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Quiet monochrome, serif headings.',
    preview: { bg: '#fafaf9', accent: '#292524', text: '#292524' },
  },
  {
    id: 'bold',
    name: 'Bold',
    description: 'Dark background, high-contrast accent.',
    preview: { bg: '#0f172a', accent: '#f59e0b', text: '#f8fafc' },
  },
];

export default function ThemePicker() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [selectedTheme, setSelectedTheme] = useState('default');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await api.get(`/resume/${id}`);
        if (cancelled) return;
        setSelectedTheme(res.data.resume.theme || 'default');
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

  async function handleContinue() {
    setIsSaving(true);
    setError('');
    try {
      await api.put(`/resume/${id}`, { theme: selectedTheme });
      navigate(`/resumes/${id}/publish`);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save your theme.');
    } finally {
      setIsSaving(false);
    }
  }

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
          <span className="text-sm text-slate-400">Step 3 of 4 — Choose a theme</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10">
        {error && (
          <div className="mb-6 text-sm text-red-700 bg-red-50 border border-red-100 rounded-md px-3 py-2">
            {error}
          </div>
        )}

        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
            Pick a look for your portfolio
          </h1>
          <p className="mt-1 text-sm text-slate-500">You can change this anytime.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {THEMES.map((theme) => {
            const isSelected = selectedTheme === theme.id;
            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => setSelectedTheme(theme.id)}
                className={`text-left rounded-xl border-2 p-4 transition-colors bg-white ${
                  isSelected
                    ? 'border-indigo-600 ring-2 ring-indigo-100'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div
                  className="h-20 rounded-md mb-3 flex items-center px-3"
                  style={{ backgroundColor: theme.preview.bg }}
                >
                  <div>
                    <div
                      className="h-2 w-16 rounded-full mb-2"
                      style={{ backgroundColor: theme.preview.text, opacity: 0.8 }}
                    />
                    <div
                      className="h-2 w-10 rounded-full"
                      style={{ backgroundColor: theme.preview.accent }}
                    />
                  </div>
                </div>
                <p className="text-sm font-medium text-slate-900">{theme.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">{theme.description}</p>
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between mt-10 pb-10">
          <Link
            to="#"
            onClick={(e) => {
              e.preventDefault();
              navigate(-1);
            }}
            className="text-sm font-medium text-slate-500 hover:text-slate-800"
          >
            ← Back
          </Link>
          <button
            onClick={handleContinue}
            disabled={isSaving}
            className="bg-indigo-600 text-white text-sm font-medium rounded-md px-5 py-2 hover:bg-indigo-700 transition-colors disabled:opacity-60"
          >
            {isSaving ? 'Saving...' : 'Continue to publish'}
          </button>
        </div>
      </main>
    </div>
  );
}