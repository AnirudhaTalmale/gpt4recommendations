// App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import HomePage from './components/HomePage';
import LoginPage from './components/LoginPage';
import SignupPage from './components/SignupPage';
import OnboardingPage from './components/OnboardingPage';
import Chat from './components/Chat';
import BlogPage from './components/BlogPage';
import BlogPostPage from './components/BlogPostPage';
import NewBlogPost from './components/NewBlogPost';
import ChatWithUs from './components-chat-with-us/Chat';
import './App.css';

function RouteWrapper() {
  const location = useLocation();

  return (
    <Routes>
      <Route path="/auth/login" element={<LoginPage />} />
      <Route path="/auth/signup" element={<SignupPage />} />
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route path="/chat" element={<Chat />} />
      <Route path="/" element={<HomePage key={location.pathname} />} />
      <Route path="/chat-with-us" element={<ChatWithUs />} />
      <Route path="/blog" element={<BlogPage />} />
      <Route path="/blog/:postId" element={<BlogPostPage />} />
      <Route path="/new-blog-post" element={<NewBlogPost />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <div className="App">
        <RouteWrapper />
      </div>
    </Router>
  );
}

export default App;
