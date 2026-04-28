/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Users from './pages/Users';
import { Toaster } from './components/ui/sonner';
import ErrorBoundary from './components/ErrorBoundary';
import RouteGuard from './components/auth/RouteGuard';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={
        <RouteGuard mode="public-only" redirectTo="/dashboard">
          <Login />
        </RouteGuard>
      } />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={
        <RouteGuard mode="protected" redirectTo="/login">
          <Layout>
            <Dashboard />
          </Layout>
        </RouteGuard>
      } />
      <Route path="/leads" element={
        <RouteGuard mode="protected" redirectTo="/login">
          <Layout>
            <Leads />
          </Layout>
        </RouteGuard>
      } />

      <Route path="/profile" element={
        <RouteGuard mode="protected" redirectTo="/login">
          <Layout>
            <Profile />
          </Layout>
        </RouteGuard>
      } />
      <Route path="/users" element={
        <RouteGuard mode="protected" redirectTo="/login">
          <Layout>
            <Users />
          </Layout>
        </RouteGuard>
      } />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <ErrorBoundary>
          <AppRoutes />
        </ErrorBoundary>
        <Toaster />
      </AuthProvider>
    </Router>
  );
}

