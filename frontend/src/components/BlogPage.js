// BlogPage.js

import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import importedBlogs from './Blogs.js'; 
import HomePageHeader from './HomePageHeader'; 
import '../App.css'; 

const BlogPostPreview = ({ title, imagePath }) => (
  <div className="blog-post-preview">
    {imagePath && <img src={imagePath} alt={title} />}
    <div className="blog-title">{title}</div>
  </div>
);

const BlogPage = () => {
  const [posts] = useState(Object.keys(importedBlogs).map(key => ({
    _id: key,
    title: importedBlogs[key].title,
    imagePath: importedBlogs[key].imagePath
  })));
  const location = useLocation();
  const isAdmin = location.state?.isAdmin; 

  return (
    <div>
      <HomePageHeader />
      <div className="blog-page">
        
        <div className='blog-page-heading'>Blog</div>
        <hr /> 
        <div className="blog-posts-container">
          {posts.length > 0 ? (
            posts.map(post => (
              <Link to={`/blog/${post._id}`} state={{ isAdmin }} className="blog-post-link" key={post._id}>
                <BlogPostPreview title={post.title} imagePath={post.imagePath} />
              </Link>
            ))
          ) : (
            <p>Loading Posts</p>
          )}
        </div>
      </div>

      <footer className="footer">
        <nav>
            <a href="/about-us">About Us</a><span>|</span>
            <a href="/blog">Blog</a><span>|</span>
            <a href="/privacy-policy">Privacy Policy</a><span>|</span>
            <a href="/contact-us">Contact Us</a>
        </nav>
      </footer>
    </div>
  );
};

export default BlogPage;
