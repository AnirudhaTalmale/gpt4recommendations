import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import Comment from './Comment';
import { checkAuthStatus } from './CommonFunctions';

const CommentList = ({ bookId }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const [error, setError] = useState(null);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    checkAuthStatus().then((userData) => {
      if (userData) {
        setUserData(userData);
      }
    });
  }, [setUserData]);

  const fetchComments = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/comments?bookId=${bookId}`);
      setComments(response.data);
      setError(null);
    } catch (error) {
      console.error('Failed to fetch comments:', error);
      setError('Failed to load comments');
    } finally {
      setLoading(false);
    }
  }, [bookId]);

  useEffect(() => {
    fetchComments();
  }, [bookId, fetchComments]);

  const handleCommentSubmit = async (event) => {
    event.preventDefault();
    try {
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/comments`, {
        text: newComment,
        bookId: bookId,
        userId: userData.id
      });
      setComments([...comments, response.data]); // Add new comment to the current list
      setNewComment(''); // Clear the input after submission
    } catch (error) {
      console.error('Failed to post comment:', error);
    }
  };

  const handleCancel = () => {
    setNewComment(''); // Clear the input
    setShowButton(false); // Hide the buttons
  };

  if (loading) return <div>Loading comments...</div>;
  if (error) return <div>Error loading comments.</div>;

  return (
    <div className="comment-panel">
      <div style={{ display: 'flex', alignItems: 'start' }}>
        <img src={userData?.image} alt="" className="user-avatar"/>
        <form className="comment-input-form" onSubmit={handleCommentSubmit} style={{ display: 'flex', flexDirection: 'column' }}>
            <textarea
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            onFocus={() => setShowButton(true)} // Show button when input is focused
            placeholder="Write a comment..."
            />
            {showButton && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button type="button" onClick={handleCancel} className="cancel-button">Cancel</button>
                <button type="submit" className="comment-button">Comment</button>
            </div>
            )}
        </form>
      </div>
      {comments.length > 0 && (
        comments.map(comment => (
          <Comment key={comment._id} comment={comment} fetchComments={fetchComments} />
        ))
      )}
    </div>
  );
  
};

export default CommentList;
