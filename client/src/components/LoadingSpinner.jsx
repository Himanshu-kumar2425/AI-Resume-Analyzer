const LoadingSpinner = ({ message = 'Loading…', fullScreen = false }) => {
  const wrapper = fullScreen
    ? 'fixed inset-0 flex flex-col items-center justify-center bg-white/70 dark:bg-gray-900/70 z-50'
    : 'flex flex-col items-center justify-center py-12 gap-4';

  return (
    <div className={wrapper} role="status" aria-live="polite">
      {/* Spinner ring */}
      <div className="w-12 h-12 rounded-full border-4 border-indigo-200 dark:border-indigo-900 border-t-indigo-600 dark:border-t-indigo-400 animate-spin" />
      {message && (
        <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
          {message}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner;
