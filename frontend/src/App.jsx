import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { GoalsProvider } from './context/GoalsContext';
import LandingPage from './components/layout/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VerifyOtpPage from './pages/VerifyOtpPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ProfilePage from './pages/ProfilePage';
import DashboardPage from './pages/DashboardPage';
import GoalsPage from './pages/GoalsPage';
import CreateGoalPage from './pages/CreateGoalPage';
import EditGoalPage from './pages/EditGoalPage';
import InvestmentSimulatorPage from './pages/InvestmentSimulatorPage';
import StockDetailPage from './pages/StockDetailPage'; 
import PortfolioPage from './pages/PortfolioPage';
import InvestmentStoriesPage from './pages/InvestmentStoriesPage';
import StoryPlayPage from './pages/StoryPlayPage';
import StoryViewPage from "./pages/StoryViewPage";
import StoryEditorPage from './pages/admin/StoryEditorPage';
import GenerateStoryPage from './pages/admin/GenerateStoryPage';
import AdminStoryViewPage from './pages/admin/AdminStoryViewPage';
import GoalDetail from './pages/GoalDetail';

function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!user.isAdmin) return <Navigate to="/dashboard" replace />;
  return children;
}

function GuestRoute({ children }) {
  const { user } = useAuth();
  return !user ? children : <Navigate to="/dashboard" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
      <Route path="/verify-otp" element={<GuestRoute><VerifyOtpPage /></GuestRoute>} />
      <Route path="/forgot-password" element={<GuestRoute><ForgotPasswordPage /></GuestRoute>} />
      <Route path="/reset-password" element={<GuestRoute><ResetPasswordPage /></GuestRoute>} />

      {/* Protected User Routes - ORDER MATTERS! Specific paths FIRST */}
      <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
      <Route path="/goals/create" element={<PrivateRoute><CreateGoalPage /></PrivateRoute>} />
      <Route path="/goals/:id/edit" element={<PrivateRoute><EditGoalPage /></PrivateRoute>} />
      <Route path="/goals/:id" element={<PrivateRoute><GoalDetail /></PrivateRoute>} />
      <Route path="/goals" element={<PrivateRoute><GoalsPage /></PrivateRoute>} />
      <Route path="/simulator/:symbol" element={<PrivateRoute><StockDetailPage /></PrivateRoute>} />
      <Route path="/simulator" element={<PrivateRoute><InvestmentSimulatorPage /></PrivateRoute>} />
      <Route path="/portfolio" element={<PrivateRoute><PortfolioPage /></PrivateRoute>} />
      <Route path="/stories" element={<PrivateRoute><InvestmentStoriesPage /></PrivateRoute>} />
      <Route path="/stories/:id/play" element={<PrivateRoute><StoryPlayPage /></PrivateRoute>} />
      <Route path="/stories/:id/view" element={<PrivateRoute><StoryViewPage /></PrivateRoute>} />
      <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />

      {/* Admin Routes */}
      <Route path="/admin/stories" element={<AdminRoute><InvestmentStoriesPage /></AdminRoute>} />
      <Route path="/admin/stories/:id/view" element={<AdminRoute><AdminStoryViewPage /></AdminRoute>} />
      <Route path="/stories/new" element={<AdminRoute><StoryEditorPage /></AdminRoute>} />
      <Route path="/stories/generate" element={<AdminRoute><GenerateStoryPage /></AdminRoute>} />
      <Route path="/stories/:id/edit" element={<AdminRoute><StoryEditorPage /></AdminRoute>} />

      {/* Catch all - redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <GoalsProvider>
          <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
          <AppRoutes />
        </GoalsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}