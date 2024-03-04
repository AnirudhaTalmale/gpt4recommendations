//BlogPage.js
import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../App.css'; // Import the CSS file

const BlogPostPreview = ({ title, image, postId }) => (
  <div className="blog-post-preview">
    {image && <img src={`data:image/jpeg;base64,${image}`} alt={title} />}
    <div class="blog-title">{title}</div>
  </div>
);

const BlogPage = () => {
  const [posts, setPosts] = useState([]);
  // const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = location.state?.isAdmin; 

  useEffect(() => {
    fetch(`${process.env.REACT_APP_BACKEND_URL}/api/blogposts`)
      .then(response => response.json())
      .then(data => {
        if (Array.isArray(data)) {
          setPosts(data);
        } else {
          console.error('Data is not an array:', data);
        }
      })
      .catch(error => console.error('Error fetching blog posts:', error));
  }, []);

  // const handleCreateNewPost = () => {
  //   navigate('/new-blog-post'); 
  // };

  return (
    <div className="blog-page">
      <div className='blog-page-heading'>Blog</div>
      <hr /> 
      <div className="blog-posts-container">
        {posts.length > 0 ? (
          posts.map(post => (
            <Link to={`/blog/${post._id}`} state={{ isAdmin }} className="blog-post-link" key={post._id}>
              <BlogPostPreview title={post.title} image={post.image} postId={post._id} />
            </Link>
          ))
        ) : (
          <p>Loading Posts...</p>
        )}
      </div>
      
      {/* {isAdmin && (
        <button onClick={handleCreateNewPost} className="new-post-button">
          Create New Blog Post
        </button>
      )} */}
    </div>
  );
};

export default BlogPage;