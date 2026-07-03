import { Routes, Route } from 'react-router-dom';
import Navbar          from './components/Navbar';
import ProtectedRoute  from './components/ProtectedRoute';

import Home            from './pages/Home';
import Login           from './pages/Login';
import Register        from './pages/Register';
import Dashboard       from './pages/Dashboard';
import UploadResume    from './pages/UploadResume';
import AnalysisResult  from './pages/AnalysisResult';
import History         from './pages/History';
import Profile         from './pages/Profile';
import AdminDashboard  from './pages/AdminDashboard';

const App = () => (
  <>
    <Navbar />
    <main>
      <Routes>
        {/* Public */}
        <Route path="/"         element={<Home />} />
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected */}
        <Route path="/dashboard" element={
          <ProtectedRoute><Dashboard /></ProtectedRoute>
        } />
        <Route path="/upload" element={
          <ProtectedRoute><UploadResume /></ProtectedRoute>
        } />
        <Route path="/analysis/:id" element={
          <ProtectedRoute><AnalysisResult /></ProtectedRoute>
        } />
        <Route path="/history" element={
          <ProtectedRoute><History /></ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute><Profile /></ProtectedRoute>
        } />

        {/* Admin only */}
        <Route path="/admin" element={
          <ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>
        } />

        {/* 404 fallback */}
        <Route path="*" element={
          <div className="text-center py-32 text-gray-400 dark:text-gray-500">
            <p className="text-6xl mb-4">404</p>
            <p>Page not found.</p>
          </div>
        } />
      </Routes>
    </main>
  </>
);

export default App;
