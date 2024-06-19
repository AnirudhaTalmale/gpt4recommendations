import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';

function BookDetailHeader() {


  const navigate = useNavigate(); 
  const onNewSession = async () => {
    navigate(`/chat`);
  };

  return (
    <div className="header">
        <>
          <button className="new-session-button-small-screen-book-detail" onClick={onNewSession}>
            <i class="fa-solid fa-house"></i>
          </button>
        </>
    </div>
  );
}

export default BookDetailHeader;
