import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';

// Code-split heavy pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Operators = lazy(() => import('./pages/Operators'));

function App() {
  return (
    <Router>
      <Suspense fallback={<div style={{ background: '#050b16', minHeight: '100vh' }} />}>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/operators" element={<Operators />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
