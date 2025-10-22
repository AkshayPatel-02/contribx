// This file ensures React is properly loaded before anything else
import React from 'react';
import ReactDOM from 'react-dom/client';

// Make sure React is available globally
window.React = React;

// Verify environment variables are loaded
console.log('Environment check: Firebase config available:', 
  !!import.meta.env.VITE_FIREBASE_API_KEY &&
  !!import.meta.env.VITE_FIREBASE_PROJECT_ID);