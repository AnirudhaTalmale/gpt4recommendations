import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Chat from './components/Chat'; 
import LoginPage from './components/LoginPage';
import BlogPage from './components/BlogPage';
import BlogPostPage from './components/BlogPostPage';
import NewBlogPost from './components/NewBlogPost';
import './App.css'; 

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/" element={<Chat />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:postId" element={<BlogPostPage />} /> 
          <Route path="/new-blog-post" element={<NewBlogPost />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

