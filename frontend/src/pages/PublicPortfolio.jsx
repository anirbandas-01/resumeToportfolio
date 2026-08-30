import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/client';

// Theme styling — ids must match ThemePicker.jsx's THEMES list.
const THEME_STYLES = {
  default: {
    page: 'bg-white text-slate-900',
    heading: 'font-sans font-semibold',
    accentText: 'text-indigo-600',
    accentBg: 'bg-indigo-600',
    chipBg: 'bg-indigo-50 text-indigo-700',
    border: 'border-slate-200',
    subtle: 'text-slate-500',
  },
  minimal: {
    page: 'bg-stone-50 text-stone-900',
    heading: 'font-serif font-medium',
    accentText: 'text-stone-900',
    accentBg: 'bg-stone-900',
    chipBg: 'bg-stone-100 text-stone-700',
    border: 'border-stone-200',
    subtle: 'text-stone-500',
  },
  bold: {
    page: 'bg-slate-950 text-slate-50',
    heading: 'font-sans font-bold',
    accentText: 'text-amber-400',
    accentBg: 'bg-amber-400',
    chipBg: 'bg-slate-800 text-amber-300',
    border: 'border-slate-800',
    subtle: 'text-slate-400',
  },
};

export default function PublicPortfolio() {
  const { username } = useParams();

  const [portfolio, setPortfolio] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await api.get(`/portfolio/${username}`);
        if (!cancelled) setPortfolio(res.data);
      } catch (err) {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [username]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        Loading...
      </div>
    );
  }

  if (notFound || !portfolio) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-2xl font-semibold text-slate-900">Portfolio not found</h1>
        <p className="mt-2 text-sm text-slate-500">
          This page doesn't exist, or hasn't been published yet.
        </p>
      </div>
    );
  }

  const { parsedData, profileImageUrl, theme } = portfolio;
  const t = THEME_STYLES[theme] || THEME_STYLES.default;
  const data = parsedData || {};

  return (
    <div className={`min-h-screen ${t.page}`}>
      <main className="max-w-2xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-12">
          {profileImageUrl && (
            <img
              src={profileImageUrl}
              alt={data.name || username}
              className="h-24 w-24 rounded-full object-cover mb-5"
            />
          )}
          <h1 className={`text-3xl ${t.heading}`}>{data.name || username}</h1>
          {(data.email || data.phone) && (
            <p className={`mt-2 text-sm ${t.subtle}`}>
              {[data.email, data.phone].filter(Boolean).join(' · ')}
            </p>
          )}
          {data.summary && (
            <p className={`mt-4 max-w-lg text-sm leading-relaxed ${t.subtle}`}>{data.summary}</p>
          )}
        </div>

        {/* Skills */}
        {data.skills?.length > 0 && (
          <Section title="Skills" theme={t}>
            <div className="flex flex-wrap gap-2">
              {data.skills.map((skill, i) => (
                <span key={i} className={`text-xs px-3 py-1 rounded-full ${t.chipBg}`}>
                  {skill}
                </span>
              ))}
            </div>
          </Section>
        )}

        {/* Experience */}
        {data.experience?.length > 0 && (
          <Section title="Experience" theme={t}>
            <div className="space-y-6">
              {data.experience.map((exp, i) => (
                <div key={i}>
                  <div className="flex items-baseline justify-between gap-4">
                    <h3 className="text-sm font-semibold">{exp.title}</h3>
                    <span className={`text-xs ${t.subtle} whitespace-nowrap`}>
                      {exp.duration}
                    </span>
                  </div>
                  <p className={`text-sm ${t.accentText}`}>{exp.company}</p>
                  {exp.description && (
                    <p className={`mt-1 text-sm leading-relaxed ${t.subtle}`}>
                      {exp.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Projects */}
        {data.projects?.length > 0 && (
          <Section title="Projects" theme={t}>
            <div className="space-y-6">
              {data.projects.map((proj, i) => (
                <div key={i}>
                  <h3 className="text-sm font-semibold">{proj.name}</h3>
                  {proj.description && (
                    <p className={`mt-1 text-sm leading-relaxed ${t.subtle}`}>
                      {proj.description}
                    </p>
                  )}
                  {proj.technologies?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {proj.technologies.map((tech, j) => (
                        <span key={j} className={`text-xs px-2.5 py-0.5 rounded-full ${t.chipBg}`}>
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Education */}
        {data.education?.length > 0 && (
          <Section title="Education" theme={t}>
            <div className="space-y-4">
              {data.education.map((edu, i) => (
                <div key={i} className="flex items-baseline justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-semibold">{edu.degree}</h3>
                    <p className={`text-sm ${t.subtle}`}>{edu.institution}</p>
                  </div>
                  <span className={`text-xs ${t.subtle} whitespace-nowrap`}>{edu.duration}</span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Certifications */}
        {data.certifications?.length > 0 && (
          <Section title="Certifications" theme={t}>
            <ul className={`text-sm space-y-1 ${t.subtle}`}>
              {data.certifications.map((cert, i) => (
                <li key={i}>{cert}</li>
              ))}
            </ul>
          </Section>
        )}
      </main>
    </div>
  );
}

function Section({ title, theme, children }) {
  return (
    <section className={`border-t ${theme.border} pt-6 mt-6`}>
      <h2 className={`text-xs font-semibold uppercase tracking-wide mb-4 ${theme.accentText}`}>
        {title}
      </h2>
      {children}
    </section>
  );
}