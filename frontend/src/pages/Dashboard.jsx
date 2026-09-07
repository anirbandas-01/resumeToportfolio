import { useRef, useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

const PARSE_MESSAGES = [
  'Reading your resume...',
  'Extracting your details...',
  'Organizing your experience...',
  'Almost there...',
];

const ACCEPTED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
];

const THEME_NAMES = { default: 'Default', minimal: 'Minimal', bold: 'Bold' };

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // 'loading' while we check for an existing resume, then either
  // 'status' (has a resume) or 'upload' (doesn't, or chose to replace).
  const [view, setView] = useState('loading');
  const [resume, setResume] = useState(null);
  const [confirmingReplace, setConfirmingReplace] = useState(false);

  const [selectedFile, setSelectedFile] = useState(null);
  const [stage, setStage] = useState('idle'); // idle | uploading | parsing
  const [parseMessageIndex, setParseMessageIndex] = useState(0);
  const [error, setError] = useState('');
  const [isTogglingPublish, setIsTogglingPublish] = useState(false);

  const isBusy = stage === 'uploading' || stage === 'parsing';

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await api.get('/resumes/mine');
        if (cancelled) return;
        if (res.data.resume) {
          setResume(res.data.resume);
          setView('status');
        } else {
          setView('upload');
        }
      } catch (err) {
        if (!cancelled) {
          setError('Could not load your dashboard.');
          setView('upload');
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (stage !== 'parsing') return;
    const interval = setInterval(() => {
      setParseMessageIndex((i) => (i + 1) % PARSE_MESSAGES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [stage]);

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    setError('');
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Please choose a PDF or DOCX file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('File is too large — max 5MB.');
      return;
    }
    setSelectedFile(file);
  }

  async function handleUpload() {
    if (!selectedFile || isBusy) return;
    setError('');

    try {
      setStage('uploading');
      const formData = new FormData();
      formData.append('resume', selectedFile);

      const uploadRes = await api.post('/resumes/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const { resumeId } = uploadRes.data;

      setStage('parsing');
      setParseMessageIndex(0);
      const parseRes = await api.post(`/resumes/${resumeId}/parse`);

      if (!parseRes.data.parsed) {
        console.warn('AI parsing failed:', parseRes.data.message);
      }
      navigate(`/resumes/${resumeId}/review`);
    } catch (err) {
      const message = err.response?.data?.error || 'Something went wrong. Please try again.';
      setError(message);
      setStage('idle');
    }
  }

  async function handleQuickTogglePublish() {
    if (!resume) return;
    setIsTogglingPublish(true);
    setError('');
    try {
      const res = await api.patch(`/resumes/${resume._id}/publish`);
      setResume((prev) => ({ ...prev, isPublished: res.data.isPublished }));
    } catch (err) {
      const message = err.response?.data?.error;
      if (err.response?.status === 400 && message?.toLowerCase().includes('username')) {
        navigate(`/resumes/${resume._id}/publish`);
      } else {
        setError(message || 'Could not update publish status.');
      }
    } finally {
      setIsTogglingPublish(false);
    }
  }

  const name = resume?.parsedData?.name;
  const shareUrl = user?.username ? `${window.location.origin}/u/${user.username}` : null;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <span className="font-semibold text-slate-900">Resume → Portfolio</span>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500">{user?.email}</span>
            <Link
              to="/settings"
              className="text-sm text-slate-500 hover:text-slate-800 transition-colors"
            >
              Settings
            </Link>
            <button
              onClick={logout}
              className="text-sm text-slate-500 hover:text-slate-800 transition-colors"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-16">
        {error && (
          <div className="mb-6 text-sm text-red-700 bg-red-50 border border-red-100 rounded-md px-3 py-2">
            {error}
          </div>
        )}

        {view === 'loading' && (
          <div className="flex items-center justify-center py-20 text-slate-400 text-sm">
            Loading...
          </div>
        )}

        {view === 'status' && resume && (
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-8">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h1 className="text-xl font-semibold text-slate-900">
                  {name ? `Welcome back, ${name.split(' ')[0]}` : 'Your resume'}
                </h1>
                <div className="flex items-center gap-2 mt-2">
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
                      resume.isPublished
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        resume.isPublished ? 'bg-emerald-500' : 'bg-slate-400'
                      }`}
                    />
                    {resume.isPublished ? 'Published' : 'Draft'}
                  </span>
                  <span className="text-xs text-slate-400">
                    Theme: {THEME_NAMES[resume.theme] || resume.theme}
                  </span>
                </div>
              </div>
              {resume.profileImageUrl && (
                <img
                  src={resume.profileImageUrl}
                  alt=""
                  className="h-14 w-14 rounded-full object-cover"
                />
              )}
            </div>

            {shareUrl && resume.isPublished && (
              <div className="flex items-center rounded-md border border-slate-200 bg-slate-50 px-3 py-2 mb-6">
                <a
                  href={shareUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 text-sm text-indigo-600 hover:text-indigo-700 truncate"
                >
                  {shareUrl}
                </a>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(shareUrl)}
                  className="text-xs font-medium text-slate-500 hover:text-slate-800 ml-3"
                >
                  Copy
                </button>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Link
                to={`/resumes/${resume._id}/review`}
                className="text-center text-sm font-medium text-slate-700 border border-slate-300 rounded-md py-2 hover:bg-slate-100 transition-colors"
              >
                Edit resume
              </Link>
              <Link
                to={`/resumes/${resume._id}/theme`}
                className="text-center text-sm font-medium text-slate-700 border border-slate-300 rounded-md py-2 hover:bg-slate-100 transition-colors"
              >
                Change theme
              </Link>
              <button
                onClick={handleQuickTogglePublish}
                disabled={isTogglingPublish}
                className={`text-sm font-medium rounded-md py-2 transition-colors disabled:opacity-60 ${
                  resume.isPublished
                    ? 'border border-slate-300 text-slate-700 hover:bg-slate-100'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                {isTogglingPublish
                  ? 'Updating...'
                  : resume.isPublished
                  ? 'Unpublish'
                  : 'Publish'}
              </button>
              <button
                onClick={() => setConfirmingReplace(true)}
                className="text-sm font-medium text-red-600 border border-red-200 rounded-md py-2 hover:bg-red-50 transition-colors"
              >
                Upload new resume
              </button>
            </div>

            {confirmingReplace && (
              <div className="mt-4 border border-amber-200 bg-amber-50 rounded-md p-4">
                <p className="text-sm text-amber-800">
                  Uploading a new resume replaces this one entirely — your current data,
                  theme, photo, and published status will all be reset. This can't be undone.
                </p>
                <div className="flex gap-3 mt-3">
                  <button
                    onClick={() => {
                      setConfirmingReplace(false);
                      setView('upload');
                    }}
                    className="text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md px-4 py-1.5"
                  >
                    Yes, replace it
                  </button>
                  <button
                    onClick={() => setConfirmingReplace(false)}
                    className="text-sm font-medium text-slate-600 hover:text-slate-900"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {view === 'upload' && (
          <>
            <div className="text-center mb-10">
              <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
                Upload your resume
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                We'll pull out your details automatically — you can review and edit everything
                before it goes live.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-8">
              {stage === 'parsing' ? (
                <div className="flex flex-col items-center justify-center py-10">
                  <div className="h-8 w-8 rounded-full border-2 border-indigo-200 border-t-indigo-600 animate-spin mb-4" />
                  <p className="text-sm text-slate-600">{PARSE_MESSAGES[parseMessageIndex]}</p>
                </div>
              ) : (
                <>
                  <div
                    onClick={() => !isBusy && fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-lg px-6 py-10 text-center transition-colors ${
                      isBusy
                        ? 'border-slate-200 cursor-not-allowed'
                        : 'border-slate-300 hover:border-indigo-400 cursor-pointer'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.docx"
                      onChange={handleFileChange}
                      disabled={isBusy}
                      className="hidden"
                    />
                    {selectedFile ? (
                      <p className="text-sm text-slate-700 font-medium">{selectedFile.name}</p>
                    ) : (
                      <>
                        <p className="text-sm text-slate-600 font-medium">
                          Click to choose a file
                        </p>
                        <p className="mt-1 text-xs text-slate-400">PDF or DOCX, up to 5MB</p>
                      </>
                    )}
                  </div>

                  <button
                    onClick={handleUpload}
                    disabled={!selectedFile || isBusy}
                    className="mt-6 w-full bg-indigo-600 text-white text-sm font-medium rounded-md py-2 hover:bg-indigo-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {stage === 'uploading' ? 'Uploading...' : 'Upload and continue'}
                  </button>

                  {resume && (
                    <button
                      onClick={() => {
                        setSelectedFile(null);
                        setError('');
                        setView('status');
                      }}
                      disabled={isBusy}
                      className="mt-3 w-full text-sm text-slate-500 hover:text-slate-800"
                    >
                      Cancel
                    </button>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}