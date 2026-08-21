import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../api/client';

const EMPTY_PARSED_DATA = {
  name: '',
  email: '',
  phone: '',
  summary: '',
  skills: [],
  experience: [],
  education: [],
  projects: [],
  certifications: [],
};

function emptyExperience() {
  return { title: '', company: '', duration: '', description: '' };
}
function emptyEducation() {
  return { degree: '', institution: '', duration: '' };
}
function emptyProject() {
  return { name: '', description: '', technologies: [] };
}

export default function ReviewEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const imageInputRef = useRef(null);

  const [data, setData] = useState(EMPTY_PARSED_DATA);
  const [profileImageUrl, setProfileImageUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [error, setError] = useState('');
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await api.get(`/resume/${id}`);
        if (cancelled) return;
        const resume = res.data.resume;
        setData({ ...EMPTY_PARSED_DATA, ...(resume.parsedData || {}) });
        setProfileImageUrl(resume.profileImageUrl || null);
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

  function updateField(field, value) {
    setData((prev) => ({ ...prev, [field]: value }));
  }

  function updateListItem(field, index, itemPatch) {
    setData((prev) => {
      const list = [...prev[field]];
      list[index] = { ...list[index], ...itemPatch };
      return { ...prev, [field]: list };
    });
  }

  function addListItem(field, factory) {
    setData((prev) => ({ ...prev, [field]: [...prev[field], factory()] }));
  }

  function removeListItem(field, index) {
    setData((prev) => ({ ...prev, [field]: prev[field].filter((_, i) => i !== index) }));
  }

  // Skills and certifications are plain string arrays — edited as comma-separated text.
  function handleStringListChange(field, rawValue) {
    const list = rawValue
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    updateField(field, list);
  }

  async function handleSave() {
    setIsSaving(true);
    setError('');
    setSaveMessage('');
    try {
      await api.put(`/resume/${id}`, { parsedData: data });
      setSaveMessage('Saved.');
      setTimeout(() => setSaveMessage(''), 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save your changes.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleContinue() {
    await handleSave();
    navigate(`/resumes/${id}/theme`);
  }

  async function handleImageChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Please choose a JPEG, PNG, or WEBP image.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('Image is too large — max 2MB.');
      return;
    }

    setError('');
    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await api.post(`/resume/${id}/image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setProfileImageUrl(res.data.profileImageUrl);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not upload image.');
    } finally {
      setIsUploadingImage(false);
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
          <span className="text-sm text-slate-400">Step 2 of 4 — Review & edit</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10 space-y-6">
        {error && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-md px-3 py-2">
            {error}
          </div>
        )}

        {/* Profile photo */}
        <Section title="Profile photo">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center text-slate-400 text-xs">
              {profileImageUrl ? (
                <img src={profileImageUrl} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                'No photo'
              )}
            </div>
            <div>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageChange}
                disabled={isUploadingImage}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                disabled={isUploadingImage}
                className="text-sm font-medium text-indigo-600 hover:text-indigo-700 disabled:opacity-60"
              >
                {isUploadingImage ? 'Uploading...' : profileImageUrl ? 'Change photo' : 'Upload photo'}
              </button>
              <p className="text-xs text-slate-400 mt-1">JPEG, PNG, or WEBP, up to 2MB</p>
            </div>
          </div>
        </Section>

        {/* Basic info */}
        <Section title="Basic info">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Name">
              <input
                type="text"
                value={data.name}
                onChange={(e) => updateField('name', e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Email">
              <input
                type="email"
                value={data.email}
                onChange={(e) => updateField('email', e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Phone">
              <input
                type="text"
                value={data.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                className={inputClass}
              />
            </Field>
          </div>
          <Field label="Summary" className="mt-4">
            <textarea
              rows={3}
              value={data.summary}
              onChange={(e) => updateField('summary', e.target.value)}
              className={inputClass}
            />
          </Field>
        </Section>

        {/* Skills */}
        <Section title="Skills">
          <Field label="Comma-separated">
            <input
              type="text"
              value={data.skills.join(', ')}
              onChange={(e) => handleStringListChange('skills', e.target.value)}
              placeholder="React, Node.js, SQL"
              className={inputClass}
            />
          </Field>
        </Section>

        {/* Experience */}
        <Section title="Experience">
          <div className="space-y-4">
            {data.experience.map((exp, i) => (
              <div key={i} className="border border-slate-200 rounded-lg p-4 relative">
                <RemoveButton onClick={() => removeListItem('experience', i)} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Title">
                    <input
                      type="text"
                      value={exp.title}
                      onChange={(e) => updateListItem('experience', i, { title: e.target.value })}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Company">
                    <input
                      type="text"
                      value={exp.company}
                      onChange={(e) => updateListItem('experience', i, { company: e.target.value })}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Duration">
                    <input
                      type="text"
                      value={exp.duration}
                      onChange={(e) => updateListItem('experience', i, { duration: e.target.value })}
                      placeholder="2022 — Present"
                      className={inputClass}
                    />
                  </Field>
                </div>
                <Field label="Description" className="mt-4">
                  <textarea
                    rows={2}
                    value={exp.description}
                    onChange={(e) =>
                      updateListItem('experience', i, { description: e.target.value })
                    }
                    className={inputClass}
                  />
                </Field>
              </div>
            ))}
          </div>
          <AddButton onClick={() => addListItem('experience', emptyExperience)}>
            + Add experience
          </AddButton>
        </Section>

        {/* Education */}
        <Section title="Education">
          <div className="space-y-4">
            {data.education.map((edu, i) => (
              <div key={i} className="border border-slate-200 rounded-lg p-4 relative">
                <RemoveButton onClick={() => removeListItem('education', i)} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Degree">
                    <input
                      type="text"
                      value={edu.degree}
                      onChange={(e) => updateListItem('education', i, { degree: e.target.value })}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Institution">
                    <input
                      type="text"
                      value={edu.institution}
                      onChange={(e) =>
                        updateListItem('education', i, { institution: e.target.value })
                      }
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Duration">
                    <input
                      type="text"
                      value={edu.duration}
                      onChange={(e) => updateListItem('education', i, { duration: e.target.value })}
                      placeholder="2018 — 2022"
                      className={inputClass}
                    />
                  </Field>
                </div>
              </div>
            ))}
          </div>
          <AddButton onClick={() => addListItem('education', emptyEducation)}>
            + Add education
          </AddButton>
        </Section>

        {/* Projects */}
        <Section title="Projects">
          <div className="space-y-4">
            {data.projects.map((proj, i) => (
              <div key={i} className="border border-slate-200 rounded-lg p-4 relative">
                <RemoveButton onClick={() => removeListItem('projects', i)} />
                <Field label="Name">
                  <input
                    type="text"
                    value={proj.name}
                    onChange={(e) => updateListItem('projects', i, { name: e.target.value })}
                    className={inputClass}
                  />
                </Field>
                <Field label="Description" className="mt-4">
                  <textarea
                    rows={2}
                    value={proj.description}
                    onChange={(e) =>
                      updateListItem('projects', i, { description: e.target.value })
                    }
                    className={inputClass}
                  />
                </Field>
                <Field label="Technologies (comma-separated)" className="mt-4">
                  <input
                    type="text"
                    value={(proj.technologies || []).join(', ')}
                    onChange={(e) =>
                      updateListItem('projects', i, {
                        technologies: e.target.value
                          .split(',')
                          .map((s) => s.trim())
                          .filter(Boolean),
                      })
                    }
                    className={inputClass}
                  />
                </Field>
              </div>
            ))}
          </div>
          <AddButton onClick={() => addListItem('projects', emptyProject)}>
            + Add project
          </AddButton>
        </Section>

        {/* Certifications */}
        <Section title="Certifications">
          <Field label="Comma-separated">
            <input
              type="text"
              value={data.certifications.join(', ')}
              onChange={(e) => handleStringListChange('certifications', e.target.value)}
              placeholder="AWS Certified Developer, Scrum Master"
              className={inputClass}
            />
          </Field>
        </Section>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 pb-10">
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="text-sm font-medium text-slate-700 border border-slate-300 rounded-md px-4 py-2 hover:bg-slate-100 transition-colors disabled:opacity-60"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
            {saveMessage && <span className="text-sm text-emerald-600">{saveMessage}</span>}
          </div>
          <button
            onClick={handleContinue}
            disabled={isSaving}
            className="bg-indigo-600 text-white text-sm font-medium rounded-md px-5 py-2 hover:bg-indigo-700 transition-colors disabled:opacity-60"
          >
            Continue to theme
          </button>
        </div>
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

function Field({ label, children, className = '' }) {
  return (
    <div className={className}>
      <label className="block text-xs font-medium text-slate-500 mb-1">{label}</label>
      {children}
    </div>
  );
}

function AddButton({ onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-4 text-sm font-medium text-indigo-600 hover:text-indigo-700"
    >
      {children}
    </button>
  );
}

function RemoveButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute top-3 right-3 text-xs text-slate-400 hover:text-red-600"
    >
      Remove
    </button>
  );
}