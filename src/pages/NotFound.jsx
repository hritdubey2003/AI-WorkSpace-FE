import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50">
    <div className="text-center">
      <div className="text-8xl mb-4">🌌</div>
      <h1 className="text-4xl font-bold text-slate-800 mb-2">404</h1>
      <p className="text-slate-500 mb-6">Page not found</p>
      <Link
        to="/dashboard"
        className="px-6 py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors"
      >
        Go Home
      </Link>
    </div>
  </div>
);

export default NotFound;