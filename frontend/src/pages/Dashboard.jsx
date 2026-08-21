import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [stage, setStage] = useState('idle'); // idle | uploading | parsing
  const [parseMessageIndex, setParseMessageIndex] = useState(0);
  const [error, setError] = useState('');

  const isBusy = stage === 'uploading' || stage === 'parsing';

  // Rotate the "parsing" status message every couple seconds while we wait.
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

      const uploadRes = await api.post('/resume/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const { resumeId } = uploadRes.data;

      setStage('parsing');
      setParseMessageIndex(0);
      const parseRes = await api.post(`/resume/${resumeId}/parse`);

      // Whether parsing succeeded or the AI failed, move on to the review
      // screen — on failure it just opens with an empty, editable form.
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

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <span className="font-semibold text-slate-900">Resume → Portfolio</span>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500">{user?.email}</span>
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
          {error && (
            <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-100 rounded-md px-3 py-2">
              {error}
            </div>
          )}

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
            </>
          )}
        </div>
      </main>
    </div>
  );
}