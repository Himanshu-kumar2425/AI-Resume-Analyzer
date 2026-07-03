import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getAnalysisById } from '../api/analysisApi';
import ScoreBadge from '../components/ScoreBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import useToast from '../hooks/useToast';

// ── Small reusable pieces ──────────────────────────────────────────────────────

const Section = ({ title, icon, children }) => (
  <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
    <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
      <span className="text-xl">{icon}</span>
      <h2 className="font-semibold text-gray-900 dark:text-white">{title}</h2>
    </div>
    <div className="px-6 py-5">{children}</div>
  </div>
);

const Chip = ({ label, color = 'gray' }) => {
  const colors = {
    gray:   'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
    red:    'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
    green:  'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
    indigo: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300',
  };
  return (
    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${colors[color]}`}>
      {label}
    </span>
  );
};

const BulletList = ({ items = [] }) => (
  <ul className="space-y-2">
    {items.map((item, i) => (
      <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
        <span className="mt-0.5 text-indigo-500">•</span>
        <span>{item}</span>
      </li>
    ))}
  </ul>
);

const BeforeAfter = ({ label, original, rewritten }) => (
  <div className="mb-6 last:mb-0">
    <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">{label}</p>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
        <p className="text-xs font-bold text-red-500 mb-2 uppercase tracking-wide">Before</p>
        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">{original || '—'}</p>
      </div>
      <div className="rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4">
        <p className="text-xs font-bold text-green-600 mb-2 uppercase tracking-wide">After</p>
        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">{rewritten || '—'}</p>
      </div>
    </div>
  </div>
);

// ── Interview questions tab component ─────────────────────────────────────────

const CATEGORIES = ['Technical', 'HR', 'Project-Based'];
const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

const diffColor = { Easy: 'green', Medium: 'indigo', Hard: 'red' };

const InterviewTab = ({ questions = [] }) => {
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0]);

  const filtered = questions.filter((q) => q.category === activeCategory);

  return (
    <div>
      {/* Category tabs */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors
              ${activeCategory === cat
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Questions grouped by difficulty */}
      {DIFFICULTIES.map((diff) => {
        const qs = filtered.filter((q) => q.difficulty === diff);
        if (!qs.length) return null;
        return (
          <div key={diff} className="mb-4">
            <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">{diff}</p>
            <div className="space-y-2">
              {qs.map((q, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3"
                >
                  <Chip label={diff} color={diffColor[diff]} />
                  <p className="text-sm text-gray-700 dark:text-gray-300">{q.question}</p>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ── Main page ──────────────────────────────────────────────────────────────────

const AnalysisResult = () => {
  const { id } = useParams();
  const { toastError } = useToast();

  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getAnalysisById(id);
        setData(res.data.data);
      } catch (err) {
        toastError(err.response?.data?.error || 'Failed to load analysis.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) return <LoadingSpinner message="Loading your analysis…" />;
  if (!data)   return (
    <div className="text-center py-20 text-gray-500 dark:text-gray-400">
      Analysis not found. <Link to="/dashboard" className="text-indigo-500 hover:underline">Go back</Link>
    </div>
  );

  const { resumeScore, atsScore, strengths, weaknesses, missingSkills,
          grammarSuggestions, formattingSuggestions, jobRoleMatch,
          interviewQuestions, improvements } = data;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-6">

      {/* Nav */}
      <div className="flex gap-3 text-sm">
        <Link to="/dashboard" className="text-indigo-600 dark:text-indigo-400 hover:underline">← Dashboard</Link>
        <span className="text-gray-300 dark:text-gray-600">|</span>
        <Link to="/history"   className="text-indigo-600 dark:text-indigo-400 hover:underline">History</Link>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analysis Result</h1>

      {/* Scores */}
      <Section title="Scores" icon="📊">
        <div className="flex flex-wrap gap-10 justify-center">
          <ScoreBadge score={resumeScore} label="Resume Score" />
          <ScoreBadge score={atsScore}    label="ATS Score" />
        </div>
      </Section>

      {/* Strengths & Weaknesses */}
      <Section title="Strengths & Weaknesses" icon="⚖️">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-green-600 mb-3">Strengths</p>
            <BulletList items={strengths} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-red-500 mb-3">Weaknesses</p>
            <BulletList items={weaknesses} />
          </div>
        </div>
      </Section>

      {/* Missing Skills */}
      <Section title="Missing Skills" icon="🔍">
        <div className="flex flex-wrap gap-2">
          {missingSkills?.length
            ? missingSkills.map((s, i) => <Chip key={i} label={s} color="red" />)
            : <p className="text-sm text-gray-400">No missing skills identified.</p>
          }
        </div>
      </Section>

      {/* Grammar & Formatting */}
      <Section title="Grammar & Formatting" icon="✍️">
        {grammarSuggestions?.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">Grammar</p>
            <BulletList items={grammarSuggestions} />
          </div>
        )}
        {formattingSuggestions?.length > 0 && (
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">Formatting</p>
            <BulletList items={formattingSuggestions} />
          </div>
        )}
      </Section>

      {/* Job Role Match */}
      {jobRoleMatch?.role && (
        <Section title={`Job Role Match — ${jobRoleMatch.role}`} icon="💼">
          <div className="flex items-center gap-4 mb-5">
            <div className="flex-1 h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-indigo-500 transition-all duration-700"
                style={{ width: `${jobRoleMatch.matchPercent}%` }}
              />
            </div>
            <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400 w-12 text-right">
              {jobRoleMatch.matchPercent}%
            </span>
          </div>
          {jobRoleMatch.missingTech?.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">Missing Technologies</p>
              <div className="flex flex-wrap gap-2">
                {jobRoleMatch.missingTech.map((t, i) => <Chip key={i} label={t} color="indigo" />)}
              </div>
            </div>
          )}
          {jobRoleMatch.recommendations?.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">Recommendations</p>
              <BulletList items={jobRoleMatch.recommendations} />
            </div>
          )}
        </Section>
      )}

      {/* Interview Questions */}
      <Section title="Interview Questions" icon="🎤">
        <InterviewTab questions={interviewQuestions} />
      </Section>

      {/* Resume Improvements */}
      {improvements && (
        <Section title="Resume Improvements" icon="✨">
          <BeforeAfter
            label="Project Descriptions"
            original={improvements.projectDescriptions?.original}
            rewritten={improvements.projectDescriptions?.rewritten}
          />
          <BeforeAfter
            label="Skills Section"
            original={improvements.skillsSection?.original}
            rewritten={improvements.skillsSection?.rewritten}
          />
          <BeforeAfter
            label="Professional Summary"
            original={improvements.summarySection?.original}
            rewritten={improvements.summarySection?.rewritten}
          />
        </Section>
      )}
    </div>
  );
};

export default AnalysisResult;
