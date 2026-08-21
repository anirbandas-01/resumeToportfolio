import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import Signup from './pages/Signup';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ReviewEdit from './pages/ReviewEdit';
import ThemePicker from './pages/ThemePicker';
import Publish from './pages/Publish';
import PublicPortfolio from './pages/PublicPortfolio';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public auth routes */}
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />

        {/* Protected app routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/resumes/:id/review"
          element={
            <ProtectedRoute>
              <ReviewEdit />
            </ProtectedRoute>
          }
        />
        <Route
          path="/resumes/:id/theme"
          element={
            <ProtectedRoute>
              <ThemePicker />
            </ProtectedRoute>
          }
        />
        <Route
          path="/resumes/:id/publish"
          element={
            <ProtectedRoute>
              <Publish />
            </ProtectedRoute>
          }
        />

        {/* Public portfolio — no auth */}
        <Route path="/u/:username" element={<PublicPortfolio />} />

        {/* Fallback */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  );
}