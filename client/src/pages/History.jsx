import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getResumeHistory } from '../api/resumeApi';
import ScoreBadge from '../components/ScoreBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import useToast from '../hooks/useToast';

const History = () => {
  const { toastError } = useToast();

  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage]       = useState(1);
  const [pages, setPages]     = useState(1);
  const [total, setTotal]     = useState(0);

  const LIMIT = 10;

  const load = async (p = 1) => {
    setLoading(true);
    try {
      const res = await getResumeHistory(p, LIMIT);
      const d   = res.data.data;
      setResumes(d.resumes);
      setTotal(d.total);
      setPages(d.pages);
      setPage(p);
    } catch {
      toastError('Failed to load history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(1); }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Upload History</h1>
        <Link
          to="/upload"
          className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors"
        >
          + New Upload
        </Link>
      </div>

      {loading ? (
        <LoadingSpinner message="Loading history…" />
      ) : resumes.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
          <p className="text-4xl mb-3">📂</p>
          <p className="text-gray-500 dark:text-gray-400">No uploads yet.</p>
          <Link
            to="/upload"
            className="inline-block mt-4 px-5 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700"
          >
            Upload Your First Resume
          </Link>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-5 py-3 text-left">File</th>
                  <th className="px-5 py-3 text-left">Date</th>
                  <th className="px-5 py-3 text-left">Resume</th>
                  <th className="px-5 py-3 text-left">ATS</th>
                  <th className="px-5 py-3 text-left">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800">
                {resumes.map((r) => (
                  <tr key={r._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-5 py-4 font-medium text-gray-800 dark:text-gray-200 max-w-xs truncate">
                      {r.fileName}
                    </td>
                    <td className="px-5 py-4 text-gray-500 dark:text-gray-400">
                      {new Date(r.uploadDate).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4 font-semibold text-gray-800 dark:text-gray-200">
                      {r.latestAnalysis?.resumeScore ?? '—'}
                    </td>
                    <td className="px-5 py-4 font-semibold text-gray-800 dark:text-gray-200">
                      {r.latestAnalysis?.atsScore ?? '—'}
                    </td>
                    <td className="px-5 py-4">
                      {r.latestAnalysis ? (
                        <Link
                          to={`/analysis/${r.latestAnalysis._id}`}
                          className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
                        >
                          View Analysis →
                        </Link>
                      ) : (
                        <span className="text-gray-400 text-xs">No analysis yet</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-between mt-5 text-sm">
              <span className="text-gray-500 dark:text-gray-400">
                {total} total · page {page} of {pages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => load(page - 1)}
                  disabled={page === 1}
                  className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  ← Prev
                </button>
                <button
                  onClick={() => load(page + 1)}
                  disabled={page === pages}
                  className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default History;
