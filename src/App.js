import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { WorkspaceProvider } from './context/WorkspaceContext';
import { DocumentProvider } from './context/DocumentContext';
import ProtectedRoute from './routes/ProtectedRoute';
import PublicRoute from './routes/PublicRoute';
import AppLayout from './layouts/Applayout';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import DocumentEditor from './pages/DocumentEditor';
import NotFound from './pages/NotFound';

const App = () => {
  return (
    <AuthProvider>
      <WorkspaceProvider>
        <DocumentProvider>
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
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

              {/* Protected routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Dashboard />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/document/:id"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <DocumentEditor />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />

              {/* Redirects */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </DocumentProvider>
      </WorkspaceProvider>
    </AuthProvider>
  );
};

export default App;
