import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Chat from './components/Chat';
import LoginPage from './components/LoginPage';
import OnboardingPage from './components/OnboardingPage'; // Import the OnboardingPage component
import BlogPage from './components/BlogPage';
import BlogPostPage from './components/BlogPostPage';
import NewBlogPost from './components/NewBlogPost';
import ChatWithUs from './components-chat-with-us/Chat';
import HomePage from './components/HomePage';
import SignupPage from './components/SignupPage';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/auth/signup" element={<SignupPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} /> {/* Add the onboarding path */}
          <Route path="/chat" element={<Chat />} />
          <Route path="/" element={<HomePage />} />
          <Route path="/chat-with-us" element={<ChatWithUs />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:postId" element={<BlogPostPage />} />
          <Route path="/new-blog-post" element={<NewBlogPost />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
