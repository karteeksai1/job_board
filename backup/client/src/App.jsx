import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import JobDetail from './pages/JobDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import SeekerDashboard from './pages/SeekerDashboard';
import EmployerDashboard from './pages/EmployerDashboard';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
          <Navbar />
          
          <main className="flex-1">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/jobs/:id" element={<JobDetail />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected Seeker Routes */}
              <Route
                path="/seeker"
                element={
                  <ProtectedRoute allowedRoles={['JOB_SEEKER']}>
                    <SeekerDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Protected Employer Routes */}
              <Route
                path="/employer"
                element={
                  <ProtectedRoute allowedRoles={['EMPLOYER']}>
                    <EmployerDashboard />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </main>

          {/* Toast notifications handler */}
          <Toaster
            position="bottom-right"
            toastOptions={{
              duration: 3000,
              className: 'dark:bg-slate-800 dark:text-white dark:border-slate-700 border border-slate-100 font-medium text-sm rounded-xl px-4 py-3 shadow-lg',
              success: {
                iconTheme: {
                  primary: '#4f46e5',
                  secondary: '#fff',
                },
              },
            }}
          />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
