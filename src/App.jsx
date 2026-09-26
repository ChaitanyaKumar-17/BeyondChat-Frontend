import { Routes, Route, Navigate } from 'react-router-dom';
import Login          from '@/features/auth/components/Login';
import Register       from '@/features/auth/components/Register';
import ForgotPassword from '@/features/auth/components/ForgotPassword';
import TwoFactorAuth  from '@/features/auth/components/TwoFactorAuth';
import TwoFactorSetup from '@/features/auth/components/TwoFactorSetup';
import ChatApp        from '@/features/chat/ChatApp';

/**
 * Root router — maps URL paths to pages.
 * /app is the protected chat app; all auth routes are public.
 * No auth guard yet — will be added once the backend is connected.
 */
export default function App() {
  return (
    <Routes>
      {/* Default → login */}
      <Route path="/"               element={<Navigate to="/login" replace />} />

      {/* Auth pages */}
      <Route path="/login"          element={<Login />} />
      <Route path="/register"       element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/2fa"            element={<TwoFactorAuth />} />
      <Route path="/2fa-setup"      element={<TwoFactorSetup />} />

      {/* Chat application */}
      <Route path="/app"            element={<ChatApp />} />

      {/* Catch-all → login */}
      <Route path="*"               element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
