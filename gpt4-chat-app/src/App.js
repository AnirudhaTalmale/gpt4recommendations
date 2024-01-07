import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Chat from './components/Chat'; 
import LoginPage from './components/LoginPage';
import BlogPage from './components/BlogPage';
import BlogPostPage from './components/BlogPostPage';
import NewBlogPost from './components/NewBlogPost';
import ChatWithUs from './components-chat-with-us/Chat';
import './App.css'; 

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/" element={<Chat />} />
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

