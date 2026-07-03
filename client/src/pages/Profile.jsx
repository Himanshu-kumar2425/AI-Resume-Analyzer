import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getResumeHistory } from '../api/resumeApi';

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [total, setTotal] = useState('—');

  useEffect(() => {
    getResumeHistory(1, 1)
      .then((res) => setTotal(res.data.data.total))
      .catch(() => {});
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const rows = [
    { label: 'Full Name',  value: user?.name },
    { label: 'Email',      value: user?.email },
    { label: 'Role',       value: user?.role === 'admin' ? 'Admin' : 'User' },
    { label: 'Total Uploads', value: total },
  ];

  return (
    <div className="max-w-xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Your Profile</h1>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="flex items-center gap-4 px-6 py-6 border-b border-gray-100 dark:border-gray-800">
          <div className="w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-2xl font-bold text-indigo-600 dark:text-indigo-400">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">{user?.name}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
          </div>
        </div>

        <dl className="divide-y divide-gray-100 dark:divide-gray-800">
          {rows.map(({ label, value }) => (
            <div key={label} className="flex justify-between px-6 py-4">
              <dt className="text-sm text-gray-500 dark:text-gray-400">{label}</dt>
              <dd className="text-sm font-medium text-gray-900 dark:text-white">{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <button
        onClick={handleLogout}
        className="mt-6 w-full py-2.5 rounded-xl border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 font-semibold hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
      >
        Logout
      </button>
    </div>
  );
};

export default Profile;
