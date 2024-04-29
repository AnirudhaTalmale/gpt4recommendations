import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { checkAuthStatus } from './CommonFunctions';
import '../App.css';


const Comment = ({ comment, fetchComments }) => {
    const [commentData, setCommentData] = useState({
        ...comment,
        likes: comment.likes || [],
        dislikes: comment.dislikes || []
      });
      
  const [replyText, setReplyText] = useState('');
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [activeReplyId, setActiveReplyId] = useState(null);

  const [userData, setUserData] = useState(null);

  useEffect(() => {
    checkAuthStatus().then((userData) => {
      if (userData) {
        setUserData(userData);
      }
    });
  }, [setUserData]);

  const handleReplyInputChange = (e) => {
    setReplyText(e.target.value);
  };

  const submitReply = async () => {
    if (replyText.trim()) {
      try {
        const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/comments/${commentData._id}/replies`, {
          text: replyText,
          userId: userData.id
        });
  
        // Assuming the server now returns the entire comment with populated replies
        setCommentData(response.data);  // Update the entire comment data with the new reply included
        setReplyText('');
        setShowReplyInput(false);
        setActiveReplyId(null);
      } catch (error) {
        console.error('Error posting reply:', error);
      }
    }
  };
  
  const handleLike = async () => {
    if (userData) {
      try {
        // Optimistically update the like status
        setCommentData(prevState => {
          const isAlreadyLiked = prevState.likes.includes(userData.id);
          const isDisliked = prevState.dislikes.includes(userData.id);
  
          let newLikes = [...prevState.likes];
          let newDislikes = [...prevState.dislikes];
  
          if (isAlreadyLiked) {
            newLikes = newLikes.filter(id => id !== userData.id);
          } else {
            newLikes.push(userData.id);
            if (isDisliked) {
              newDislikes = newDislikes.filter(id => id !== userData.id);
            }
          }
  
          return { ...prevState, likes: newLikes, dislikes: newDislikes };
        });
  
        // Make the API call
        await axios.patch(`${process.env.REACT_APP_BACKEND_URL}/api/comments/${commentData._id}/like`, { userId: userData.id });
  
      } catch (error) {
        console.error('Error updating likes:', error);
        // Optionally handle error state by reverting changes or showing a message
      }
    }
  };
  
  const handleDislike = async () => {
    if (userData) {
      try {
        // Optimistically update the dislike status
        setCommentData(prevState => {
          const isAlreadyDisliked = prevState.dislikes.includes(userData.id);
          const isLiked = prevState.likes.includes(userData.id);
  
          let newDislikes = [...prevState.dislikes];
          let newLikes = [...prevState.likes];
  
          if (isAlreadyDisliked) {
            newDislikes = newDislikes.filter(id => id !== userData.id);
          } else {
            newDislikes.push(userData.id);
            if (isLiked) {
              newLikes = newLikes.filter(id => id !== userData.id);
            }
          }
  
          return { ...prevState, dislikes: newDislikes, likes: newLikes };
        });
  
        // Make the API call
        await axios.patch(`${process.env.REACT_APP_BACKEND_URL}/api/comments/${commentData._id}/dislike`, { userId: userData.id });
  
      } catch (error) {
        console.error('Error updating dislikes:', error);
        // Optionally handle error state by reverting changes or showing a message
      }
    }
  };
  

  const handleLikeReply = async (replyId) => {
    try {
      setCommentData(prevState => {
        const updatedReplies = prevState.replies.map(reply => {
          if (reply._id === replyId) {
            const isAlreadyLiked = reply.likes.includes(userData.id);
            const newLikes = isAlreadyLiked ? reply.likes.filter(id => id !== userData.id) : [...reply.likes, userData.id];
            const newDislikes = isAlreadyLiked ? reply.dislikes : reply.dislikes.filter(id => id !== userData.id);
  
            return { ...reply, likes: newLikes, dislikes: newDislikes };
          }
          return reply;
        });
  
        return { ...prevState, replies: updatedReplies };
      });
  
      await axios.patch(`${process.env.REACT_APP_BACKEND_URL}/api/comments/replies/${replyId}/like`, { userId: userData.id });
    } catch (error) {
      console.error('Error updating reply like:', error);
    }
  };
  
  const handleDislikeReply = async (replyId) => {
    try {
      setCommentData(prevState => {
        const updatedReplies = prevState.replies.map(reply => {
          if (reply._id === replyId) {
            const isAlreadyDisliked = reply.dislikes.includes(userData.id);
            const newDislikes = isAlreadyDisliked ? reply.dislikes.filter(id => id !== userData.id) : [...reply.dislikes, userData.id];
            const newLikes = isAlreadyDisliked ? reply.likes : reply.likes.filter(id => id !== userData.id);
  
            return { ...reply, dislikes: newDislikes, likes: newLikes };
          }
          return reply;
        });
  
        return { ...prevState, replies: updatedReplies };
      });
  
      await axios.patch(`${process.env.REACT_APP_BACKEND_URL}/api/comments/replies/${replyId}/dislike`, { userId: userData.id });
    } catch (error) {
      console.error('Error updating reply dislike:', error);
    }
  };

    const isLikedByUser = userData && commentData.likes.includes(userData.id);
    const isDislikedByUser = userData && commentData.dislikes.includes(userData.id);

    return (
        <div className="comment-container">
           <img src={userData?.image} alt="" className="user-avatar"/>
           <div>
                <div className="comment-sender">
                    {commentData.user.displayName}
                </div>
                <div className="comment-text">{commentData.text}</div>
                <div className="comment-reaction">
                    <i className={`fa ${isLikedByUser ? 'fa-solid' : 'fa-regular'} fa-thumbs-up comment-like`} onClick={handleLike}></i> <span className="comment-like-count">{commentData.likes.length}</span>
                    <i className={`fa ${isDislikedByUser ? 'fa-solid' : 'fa-regular'} fa-thumbs-down comment-dislike`} onClick={handleDislike}></i>
                    <button className="comment-reply-button" onClick={() => setShowReplyInput(true)}>Reply</button>
                </div>
                {showReplyInput && (
                    <div className="reply">
                        <textarea
                            value={replyText}
                            onChange={handleReplyInputChange}
                            placeholder="Add a reply..."
                        />
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.4rem', marginBottom: '1rem' }}>
                            <button type="button" onClick={() => setShowReplyInput(!showReplyInput)} className="cancel-button">Cancel</button>
                            <button onClick={submitReply} className="comment-button">Reply</button>
                        </div>
                    </div>
                )}
                {commentData.replies.map(reply => (
                    <div key={reply._id} style={{ marginLeft: '20px' }}>
                        <div className="comment-sender">
                            {reply.user.displayName}
                        </div>
                        <div className="comment-text">{reply.text}</div>

                        <div className="comment-reaction">
                            <i className={`fa ${reply.likes.includes(userData?.id) ? 'fa-solid' : 'fa-regular'} fa-thumbs-up comment-like`} onClick={() => userData && handleLikeReply(reply._id)}></i> <span className="comment-like-count">{reply.likes.length}</span>
                            <i className={`fa ${reply.dislikes.includes(userData?.id) ? 'fa-solid' : 'fa-regular'} fa-thumbs-down comment-dislike`} onClick={() => userData && handleDislikeReply(reply._id)}></i>
                            <button className="comment-reply-button" onClick={() => setActiveReplyId(reply._id)}>Reply</button>
                        </div>
                        {activeReplyId === reply._id && (
                            <div className="reply">
                                <textarea
                                    value={replyText}
                                    onChange={handleReplyInputChange}
                                    placeholder="Add a reply..."
                                />
                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.4rem', marginBottom: '1rem' }}>
                                    <button type="button" onClick={() => setActiveReplyId(null)} className="cancel-button">Cancel</button>
                                    <button onClick={submitReply} className="comment-button">Reply</button>
                                </div>
                            </div>
                        )}
                    </div>
                    ))}
                </div>
            </div>
      );
      
};

export default Comment;
