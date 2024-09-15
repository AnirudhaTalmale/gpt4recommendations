import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Chat from './components/Chat';
import OnboardingPage from './components/OnboardingPage'; 
import BlogPage from './components/BlogPage';
import BlogPostPage from './components/BlogPostPage';
import HomePage from './components/HomePage';
import EmailVerificationPage from './components/EmailVerificationPage'; 
import ManageSubscriptionPage from './components/ManageSubscriptionPage'; 
import About from './components/About'; 
import PrivacyPolicy from './components/PrivacyPolicy';
import BookDetail from './components/BookDetail';
import ScrollToTopOnFooterRoutes from './components/ScrollToTopOnFooterRoutes';
import ContactUs from './components/ContactUs'; 

import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <ScrollToTopOnFooterRoutes />
        <Routes>
          <Route path="/verify-email" element={<EmailVerificationPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} /> 
          <Route path="/chat/:sessionId" element={<Chat />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/login" element={<HomePage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:postId" element={<BlogPostPage />} />
          <Route path="/about-us" element={<About />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/books/:bookId/:countryCode" element={<BookDetail />} />
          <Route path="/manage-subscription" element={<ManageSubscriptionPage />} />
          <Route path="/contact-us" element={<ContactUs />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
