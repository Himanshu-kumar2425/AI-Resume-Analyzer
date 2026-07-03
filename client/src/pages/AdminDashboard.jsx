import { useState, useEffect } from 'react';
import { getAdminStats } from '../api/analysisApi';
import LoadingSpinner from '../components/LoadingSpinner';
import useToast from '../hooks/useToast';

const StatCard = ({ label, value }) => (
  <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm text-center">
    <p className="text-4xl font-extrabold text-indigo-600 dark:text-indigo-400">{value}</p>
    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{label}</p>
  </div>
);

const AdminDashboard = () => {
  const { toastError } = useToast();
  const [stats, setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminStats()
      .then((res) => setStats(res.data.data))
      .catch(() => toastError('Failed to load admin stats.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner message="Loading admin stats…" />;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Admin Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
        <StatCard label="Total Users"   value={stats?.totalUsers   ?? '—'} />
        <StatCard label="Total Resumes" value={stats?.totalResumes ?? '—'} />
      </div>

      <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
        Top 10 Missing Skills
      </h2>

      {!stats?.topSkills?.length ? (
        <p className="text-gray-400 text-sm">No data yet.</p>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-5 py-3 text-left">#</th>
                <th className="px-5 py-3 text-left">Skill</th>
                <th className="px-5 py-3 text-left">Count</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {stats.topSkills.map((s, i) => (
                <tr key={s.skill} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-5 py-3 text-gray-400">{i + 1}</td>
                  <td className="px-5 py-3 font-medium text-gray-800 dark:text-gray-200">{s.skill}</td>
                  <td className="px-5 py-3 text-gray-500 dark:text-gray-400">{s.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
