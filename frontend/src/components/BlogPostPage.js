// BlogPostPage.js
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import DOMPurify from 'dompurify';
import importedBlogs from './Blogs.js'; 
import HomePageHeader from './HomePageHeader'; 
import '../App.css';

const BlogPostPage = () => {
  const { postId } = useParams();
  const [post] = useState(importedBlogs[postId] || null);

  // Scroll to the top when the component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (!post) {
    return <div className="loading">Post not found</div>;
  }

  const createMarkup = (htmlContent) => {
    return { __html: DOMPurify.sanitize(htmlContent) };
  };

  return (
    <div>
      <HomePageHeader />
      <div className="blogPostContainer">
        
        <h1>{post.title}</h1>
        {post.imagePath && <img src={post.imagePath} alt={post.title} className='topmost-blog-image' style={{ maxWidth: '100%' }} />}
        <div dangerouslySetInnerHTML={createMarkup(post.content)} />
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

export default BlogPostPage;

