// BlogPostPage.js
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom'; // Import useLocation
import DOMPurify from 'dompurify';
import '../App.css';

const BlogPostPage = () => {
  const { postId } = useParams();
  // const navigate = useNavigate();
  // const location = useLocation(); // Use location to access state
  const [post, setPost] = useState(null);
  // const [isEditing, setIsEditing] = useState(false);
  // const isAdmin = location.state?.isAdmin; 

  useEffect(() => {
    fetch(`${process.env.REACT_APP_BACKEND_URL}/api/blogposts/${postId}`)
      .then(response => response.json())
      .then(data => setPost(data))
      .catch(error => console.error('Error fetching blog post:', error));
  }, [postId]);

  if (!post) {
    return <div className="loading"></div>;
  }

  const createMarkup = (htmlContent) => {
    return { __html: DOMPurify.sanitize(htmlContent) };
  };

  return (
    <div className="blogPostContainer">
      <>
        <h1>{post.title}</h1>
        {post.image && <img src={`data:image/jpeg;base64,${post.image}`} alt={post.title} style={{ maxWidth: '100%' }} />}
        <div dangerouslySetInnerHTML={createMarkup(post.content)} />
      </>
    </div>
  );
};

export default BlogPostPage;
