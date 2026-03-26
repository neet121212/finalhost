// Configuration file for centralized domain management
// When deploying to a unified server (like Hostinger Node.js Web App), 
// the React frontend and Node API run on the exact same domain.
// Vite detects 'development' mode locally vs 'production' when built.

const isDeveloment = import.meta.env.MODE === 'development';

export const API_BASE_URL = isDeveloment 
    ? 'http://localhost:5000/api'   // Local dev server
    : '/api';                       // Production Server (Relative path)
