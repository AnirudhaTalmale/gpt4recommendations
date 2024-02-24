// NewBlogPost.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';

const NewBlogPost = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [image, setImage] = useState(null);
  const [isPostCreated, setIsPostCreated] = useState(false);
  const navigate = useNavigate();

  const handleImageChange = (event) => {
    setImage(event.target.files[0]);
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content);
    if (image) {
      formData.append('image', image);
    }

    fetch('http://localhost:3000/api/blogposts', {
      method: 'POST',
      body: formData,
    })
    .then(response => response.json())
    .then(data => {
      setIsPostCreated(true);
      // Redirect or handle the response as needed
    })
    .catch(error => {
      console.error('Error:', error);
    });
  };

  const handleGoToBlogPage = () => {
    navigate('/blog'); // Navigate to Blog Page
  };

  const handleCreateNewPost = () => {
    setIsPostCreated(false); // Reset the post creation state
    setTitle(''); // Reset the title
    setContent(''); // Reset the content
  };

  return (
    <div className="new-blog-post-container">
      {!isPostCreated ? (
        <>
          <h1 className="new-blog-post-title">Create a New Blog Post</h1>
          <form onSubmit={handleSubmit} className="new-blog-post-form">
          <label>
            Image:
            <input
              type="file"
              onChange={handleImageChange}
              className="new-blog-post-input"
            />
          </label>
          <label>
            Title:
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="new-blog-post-input"
            />
          </label>
          <label>
            Content (HTML allowed):
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              className="new-blog-post-textarea"
            />
          </label>
          <button type="submit" className="new-blog-post-button">
            Create Post
          </button>
        </form>
        </>
      ) : (
        <>
          <h1>Blog Post Created Successfully!</h1>
          <button onClick={handleGoToBlogPage} className="new-blog-post-button">
            Go Back to Blog Page
          </button>
          <button onClick={handleCreateNewPost} className="new-blog-post-button">
            Create New Blog Post
          </button>
        </>
      )}
    </div>
  );
};

export default NewBlogPost;
