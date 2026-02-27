import { useEffect } from 'react';
import { Navigate, createBrowserRouter } from 'react-router-dom';

import { bootstrapAuth } from '../features/auth/authSlice';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import AdminPage from '../pages/AdminPage';
import AnalyticsPage from '../pages/AnalyticsPage';
import DashboardPage from '../pages/DashboardPage';
import LandingPage from '../pages/LandingPage';
import LoginPage from '../pages/LoginPage';
import AIPerformancePage from '../pages/AIPerformancePage';
import MealTrackerPage from '../pages/MealTrackerPage';
import ProfilePage from '../pages/ProfilePage';
import RegisterPage from '../pages/RegisterPage';
import SubscriptionPage from '../pages/SubscriptionPage';
import SuperAdminPage from '../pages/SuperAdminPage';
import WorkoutTrackerPage from '../pages/WorkoutTrackerPage';

function Protected({ children }: { children: JSX.Element }) {
  const dispatch = useAppDispatch();
  const { user, loading } = useAppSelector((s) => s.auth);

  useEffect(() => {
    if (!user) {
      void dispatch(bootstrapAuth());
    }
  }, [dispatch, user]);

  if (loading) return <div className="p-6">Loading session...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export const router = createBrowserRouter([
  { path: '/', element: <LandingPage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  { path: '/subscription', element: <Protected><SubscriptionPage /></Protected> },
  { path: '/dashboard', element: <Protected><DashboardPage /></Protected> },
  { path: '/ai-performance', element: <Protected><AIPerformancePage /></Protected> },
  { path: '/meals', element: <Protected><MealTrackerPage /></Protected> },
  { path: '/workouts', element: <Protected><WorkoutTrackerPage /></Protected> },
  { path: '/analytics', element: <Protected><AnalyticsPage /></Protected> },
  { path: '/profile', element: <Protected><ProfilePage /></Protected> },
  { path: '/admin', element: <Protected><AdminPage /></Protected> },
  { path: '/superadmin', element: <Protected><SuperAdminPage /></Protected> },
]);
