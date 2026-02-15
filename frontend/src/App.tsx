/**
 * App Component
 * Main application with routing and authentication.
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Lawyer from './pages/Lawyer';
import Validator from './pages/Validator';
import Generator from './pages/Generator';
import History from './pages/History';
import Admin from './pages/Admin';
import DocumentValidator from './pages/DocumentValidator';
import About from './pages/About';
import PendingApproval from './pages/PendingApproval';
import ProjectBoard from './pages/ProjectBoard';
import TaskForm from './pages/TaskForm';
import TaskDetail from './pages/TaskDetail';
import TeamManagement from './pages/TeamManagement';
import Calendar from './pages/Calendar';

// Protected Route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="spinner">⚖️</div>
        <p>Загрузка...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // If user is not approved, redirect to pending approval
  if (user && !user.is_approved && !user.role?.includes('HEAD') && window.location.pathname !== '/pending-approval') {
    return <Navigate to="/pending-approval" replace />;
  }

  return <>{children}</>;
}

// Public Route wrapper (redirect if authenticated)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="spinner">⚖️</div>
        <p>Загрузка...</p>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />
      <Route
        path="/pending-approval"
        element={
          <ProtectedRoute>
            <PendingApproval />
          </ProtectedRoute>
        }
      />

      <Route
        path="/project-board"
        element={
          <ProtectedRoute>
            <ProjectBoard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/project-board/new"
        element={
          <ProtectedRoute>
            <TaskForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/project-board/:id"
        element={
          <ProtectedRoute>
            <TaskDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/project-board/:id/edit"
        element={
          <ProtectedRoute>
            <TaskForm />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/team"
        element={
          <ProtectedRoute>
            <TeamManagement />
          </ProtectedRoute>
        }
      />

      <Route
        path="/calendar"
        element={
          <ProtectedRoute>
            <Calendar />
          </ProtectedRoute>
        }
      />

      {/* ... existing routes ... */}
      <Route
        path="/"
        element={<About />}
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      {/* ... */}
      <Route
        path="/lawyer"
        element={
          <ProtectedRoute>
            <Lawyer />
          </ProtectedRoute>
        }
      />
      <Route
        path="/validator"
        element={
          <ProtectedRoute>
            <Validator />
          </ProtectedRoute>
        }
      />
      <Route
        path="/generator"
        element={
          <ProtectedRoute>
            <Generator />
          </ProtectedRoute>
        }
      />
      <Route
        path="/history"
        element={
          <ProtectedRoute>
            <History />
          </ProtectedRoute>
        }
      />
      <Route
        path="/document-validator"
        element={
          <ProtectedRoute>
            <DocumentValidator />
          </ProtectedRoute>
        }
      />
      <Route
        path="/document-validator/:analysisId"
        element={
          <ProtectedRoute>
            <DocumentValidator />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={<Admin />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
