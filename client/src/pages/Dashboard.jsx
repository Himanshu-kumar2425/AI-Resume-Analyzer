import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getResumeHistory } from '../api/resumeApi';
import { getAnalysisById } from '../api/analysisApi';
import { useAuth } from '../context/AuthContext';
import ScoreBadge from '../components/ScoreBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import useToast from '../hooks/useToast';

const StatCard = ({ label, value }) => (
  <div className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
    <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const { toastError } = useToast();

  const [loading, setLoading]   = useState(true);
  const [resumes, setResumes]   = useState([]);
  const [total, setTotal]       = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getResumeHistory(1, 5);
        setResumes(res.data.data.resumes);
        setTotal(res.data.data.total);
      } catch {
        toastError('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <LoadingSpinner message="Loading dashboard…" />;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Welcome back, {user?.name} 👋
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Here's a summary of your resume activity.
          </p>
        </div>
        <Link
          to="/upload"
          className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
        >
          + Upload Resume
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        <StatCard label="Total Uploads" value={total} />
        <StatCard label="Analyses Done" value={total} />
        <StatCard label="Account" value={user?.role === 'admin' ? 'Admin' : 'User'} />
      </div>

      {/* Recent analyses */}
      <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Recent Uploads</h2>

      {resumes.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
          <p className="text-4xl mb-3">📂</p>
          <p className="text-gray-600 dark:text-gray-400 font-medium">No resumes uploaded yet.</p>
          <Link
            to="/upload"
            className="inline-block mt-4 px-6 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors"
          >
            Upload Your First Resume
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {resumes.map((r) => (
            <ResumeRow key={r._id} resume={r} />
          ))}
          {total > 5 && (
            <div className="text-center pt-2">
              <Link to="/history" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
                View all {total} uploads →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const ResumeRow = ({ resume }) => (
  <div className="flex items-center justify-between bg-white dark:bg-gray-900 rounded-xl px-5 py-4 border border-gray-200 dark:border-gray-700 shadow-sm">
    <div>
      <p className="font-medium text-gray-900 dark:text-white text-sm truncate max-w-xs">
        {resume.fileName}
      </p>
      <p className="text-xs text-gray-400 mt-0.5">
        {new Date(resume.uploadDate).toLocaleDateString()}
      </p>
    </div>
    <Link
      to={`/history`}
      className="text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
    >
      View →
    </Link>
  </div>
);

export default Dashboard;
