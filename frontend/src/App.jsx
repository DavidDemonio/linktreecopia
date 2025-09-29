import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './components/ThemeProvider.jsx';
import PublicLanding from './pages/PublicLanding.jsx';
import AdminApp from './admin/AdminApp.jsx';

function App() {
  return (
    <ThemeProvider>
      <Routes>
        <Route path="/" element={<PublicLanding />} />
        <Route path="/admin/*" element={<AdminApp />} />
      </Routes>
    </ThemeProvider>
  );
}

export default App;
