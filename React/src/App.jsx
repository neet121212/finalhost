import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Auth from './Auth';
import Dashboard from './Dashboard';
import { ThemeProvider } from './ThemeContext';
import './index.css';

function App() {
  const isAuthenticated = !!(localStorage.getItem('token') || sessionStorage.getItem('token'));

  return (
    <ThemeProvider>
      <Router>
      <Routes>
        <Route path="/" element={<Auth />} />
        <Route path="/dashboard" element={<Dashboard />} />
        {/* Redirect unknown routes */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
    </ThemeProvider>
  );
}

export default App;
