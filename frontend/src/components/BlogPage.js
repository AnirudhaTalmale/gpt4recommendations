// BlogPage.js

import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import importedBlogs from './Blogs.js'; // Import the Blogs data
import '../App.css'; // Import the CSS file

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
      
      {/* Admin button for creating new posts can be re-enabled if needed */}
    </div>
  );
};

export default BlogPage;
