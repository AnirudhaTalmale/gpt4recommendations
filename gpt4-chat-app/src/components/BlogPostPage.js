// BlogPostPage.js
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom'; // Import useLocation
import DOMPurify from 'dompurify';
import '../App.css';

const BlogPostPage = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const location = useLocation(); // Use location to access state
  const [post, setPost] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const isAdmin = location.state?.isAdmin; 

  useEffect(() => {
    fetch(`http://localhost:3000/api/blogposts/${postId}`)
      .then(response => response.json())
      .then(data => setPost(data))
      .catch(error => console.error('Error fetching blog post:', error));
  }, [postId]);

  const handleUpdate = (event) => {
    event.preventDefault();
    fetch(`http://localhost:3000/api/blogposts/${postId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(post),
    })
    .then(response => response.json())
    .then(updatedPost => {
      setPost(updatedPost);
      setIsEditing(false);
    })
    .catch(error => console.error('Error updating blog post:', error));
  };

  const handleDelete = () => {
    fetch(`http://localhost:3000/api/blogposts/${postId}`, {
      method: 'DELETE',
    })
    .then(response => {
      if (response.ok) {
        console.log('Post deleted');
        navigate('/blog'); // Redirect to /blog after successful deletion
      }
    })
    .catch(error => console.error('Error deleting blog post:', error));
  };

  if (!post) {
    return <div className="loading"></div>;
  }

  const createMarkup = (htmlContent) => {
    return { __html: DOMPurify.sanitize(htmlContent) };
  };

  return (
    <div className="blogPostContainer">
      {isEditing ? (
        <form onSubmit={handleUpdate}>
          <label>
            Title:
            <input type="text" value={post.title} onChange={e => setPost({ ...post, title: e.target.value })} />
          </label>
          <label>
            Image:
            <input type="file" onChange={e => setPost({ ...post, image: e.target.files[0] })} />
          </label>
          <label>
            Content:
            <textarea value={post.content} onChange={e => setPost({ ...post, content: e.target.value })} />
          </label>
          <button type="submit">Update Post</button>
          <button onClick={() => setIsEditing(false)}>Cancel</button>
        </form>
      ) : (
        <>
          <h1>{post.title}</h1>
          {post.image && <img src={`data:image/jpeg;base64,${post.image}`} alt={post.title} style={{ maxWidth: '100%' }} />}
          <div dangerouslySetInnerHTML={createMarkup(post.content)} />
          {isAdmin && <button onClick={() => setIsEditing(true)}>Edit</button>}
          {isAdmin && <button onClick={handleDelete}>Delete Post</button>}
        </>
      )}
    </div>
  );
};

export default BlogPostPage;
