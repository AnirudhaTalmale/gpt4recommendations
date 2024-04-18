import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Chat from './components/Chat';
import OnboardingPage from './components/OnboardingPage'; 
import BlogPage from './components/BlogPage';
import BlogPostPage from './components/BlogPostPage';
import HomePage from './components/HomePage';
import EmailVerificationPage from './components/EmailVerificationPage'; 
import Contact from './components/Contact'; 
import About from './components/About'; 
import PrivacyPolicy from './components/PrivacyPolicy';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/auth/login" element={<HomePage />} />
          <Route path="/verify-email" element={<EmailVerificationPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} /> 
          <Route path="/chat/:sessionId" element={<Chat />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/" element={<HomePage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:postId" element={<BlogPostPage />} />
          <Route path="/contact-us" element={<Contact />} />
          <Route path="/about-us" element={<About />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} /> 
        </Routes>
      </div>
    </Router>
  );
}

export default App;
