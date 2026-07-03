import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadResume } from '../api/resumeApi';
import { generateAnalysis } from '../api/analysisApi';
import useToast from '../hooks/useToast';
import LoadingSpinner from '../components/LoadingSpinner';

const ALLOWED_TYPES  = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
const ALLOWED_EXTS   = ['.pdf', '.docx'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

const ROLES = [
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'Software Engineer',
  'Data Analyst',
];

const UploadResume = () => {
  const navigate = useNavigate();
  const { toastError } = useToast();
  const fileInputRef = useRef(null);

  const [file, setFile]           = useState(null);
  const [targetRole, setTargetRole] = useState(ROLES[0]);
  const [fileError, setFileError]  = useState('');
  const [loading, setLoading]     = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [dragOver, setDragOver]   = useState(false);

  const validateFile = (f) => {
    if (!f) return 'No file selected.';
    const ext = '.' + f.name.split('.').pop().toLowerCase();
    if (!ALLOWED_TYPES.includes(f.type) || !ALLOWED_EXTS.includes(ext)) {
      return 'Only PDF and DOCX files are accepted.';
    }
    if (f.size > MAX_SIZE_BYTES) {
      return 'File size must not exceed 5 MB.';
    }
    return '';
  };

  const handleFileChange = (f) => {
    const err = validateFile(f);
    setFileError(err);
    setFile(err ? null : f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFileChange(dropped);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validateFile(file);
    if (err) { setFileError(err); return; }

    setLoading(true);

    try {
      // Step 1: upload file
      setLoadingMsg('Uploading resume…');
      const formData = new FormData();
      formData.append('resume', file);
      const uploadRes = await uploadResume(formData);
      const { resumeId } = uploadRes.data.data;

      // Step 2: run AI analysis (takes several seconds)
      setLoadingMsg('Analyzing your resume with AI… this may take a moment.');
      const analysisRes = await generateAnalysis({ resumeId, targetRole });
      const analysisId  = analysisRes.data.data._id;

      navigate(`/analysis/${analysisId}`);
    } catch (err) {
      const msg = err.response?.data?.error || 'Something went wrong. Please try again.';
      toastError(msg);
    } finally {
      setLoading(false);
      setLoadingMsg('');
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Upload Your Resume</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
        PDF or DOCX, max 5 MB. Our AI will analyze it in seconds.
      </p>

      {loading && <LoadingSpinner message={loadingMsg} fullScreen />}

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`cursor-pointer border-2 border-dashed rounded-2xl p-10 text-center transition-colors
            ${dragOver
              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
              : 'border-gray-300 dark:border-gray-600 hover:border-indigo-400 dark:hover:border-indigo-500 bg-white dark:bg-gray-900'
            }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx"
            className="hidden"
            onChange={(e) => handleFileChange(e.target.files[0])}
          />
          <p className="text-4xl mb-3">{file ? '✅' : '📁'}</p>
          {file ? (
            <p className="font-medium text-gray-800 dark:text-gray-200">{file.name}</p>
          ) : (
            <>
              <p className="font-medium text-gray-700 dark:text-gray-300">
                Drag & drop or <span className="text-indigo-600 dark:text-indigo-400">browse</span>
              </p>
              <p className="text-xs text-gray-400 mt-1">PDF or DOCX, max 5 MB</p>
            </>
          )}
        </div>
        {fileError && <p className="text-sm text-red-500">{fileError}</p>}

        {/* Role selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Target Job Role
          </label>
          <select
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            disabled={loading}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {ROLES.map((r) => <option key={r}>{r}</option>)}
          </select>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || !file}
          className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
        >
          {loading ? 'Analyzing…' : 'Analyze My Resume'}
        </button>
      </form>
    </div>
  );
};

export default UploadResume;
