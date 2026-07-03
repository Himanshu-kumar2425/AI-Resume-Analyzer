import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const features = [
  { icon: '🎯', title: 'ATS Score', desc: 'Know exactly how well your resume passes automated filters.' },
  { icon: '📊', title: 'Resume Score', desc: 'Get an overall quality score with detailed feedback.' },
  { icon: '🔍', title: 'Skill Gap Analysis', desc: 'Discover which skills you need for your target role.' },
  { icon: '💼', title: 'Job Role Matching', desc: 'See your match % against 5 tech roles.' },
  { icon: '🎤', title: 'Interview Questions', desc: 'Prepare with AI-generated questions at 3 difficulty levels.' },
  { icon: '✍️', title: 'Resume Rewriter', desc: 'Before/after suggestions for projects, skills, and summary.' },
];

const Home = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-4 pt-24 pb-16 text-center">
        <span className="inline-block text-5xl mb-6">📄</span>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white leading-tight">
          Land your next role with<br />
          <span className="text-indigo-600 dark:text-indigo-400">AI-powered resume analysis</span>
        </h1>
        <p className="mt-6 text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Upload your resume and get instant feedback on ATS compatibility, skill gaps,
          job role match, and tailored interview prep — all in one place.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          {user ? (
            <Link
              to="/upload"
              className="px-8 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors shadow-md"
            >
              Analyze My Resume
            </Link>
          ) : (
            <>
              <Link
                to="/register"
                className="px-8 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors shadow-md"
              >
                Get Started — It's Free
              </Link>
              <Link
                to="/login"
                className="px-8 py-3 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Sign In
              </Link>
            </>
          )}
        </div>
      </section>

      {/* Features grid */}
      <section className="max-w-5xl mx-auto px-4 pb-24">
        <h2 className="text-center text-2xl font-bold text-gray-800 dark:text-white mb-10">
          Everything you need to stand out
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{f.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
