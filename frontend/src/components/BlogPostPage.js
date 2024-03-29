// BlogPostPage.js
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import DOMPurify from 'dompurify';
import importedBlogs from './Blogs.js'; 
import HeaderWithBackButton from './HeaderWithBackButton'; 
import '../App.css';

const BlogPostPage = () => {
  const { postId } = useParams();
  const [post] = useState(importedBlogs[postId] || null);

  if (!post) {
    return <div className="loading">Post not found</div>;
  }

  const createMarkup = (htmlContent) => {
    return { __html: DOMPurify.sanitize(htmlContent) };
  };

  return (
    <div>
      <HeaderWithBackButton />
      <div className="blogPostContainer">
        
        <h1>{post.title}</h1>
        {post.imagePath && <img src={post.imagePath} alt={post.title} style={{ maxWidth: '100%' }} />}
        <div dangerouslySetInnerHTML={createMarkup(post.content)} />
      </div>
    </div>
  );
};

export default BlogPostPage;

