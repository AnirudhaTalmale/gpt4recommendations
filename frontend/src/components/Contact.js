import React from 'react';
import '../App.css';

const Contact = () => {
  return (
    <div className="contact-container">
      <h1>Contact us</h1>
      <div className="contact-buttons-container">
        <p>
          <a href="mailto:getbooksai@gmail.com">
            <i className="fa-solid fa-envelope"></i> Mail us
          </a>
        </p>
        <p>
          <button onClick={() => window.location.href = '/chat-with-us'}>
            <i className="fa-solid fa-comments"></i> Chat with us
          </button>
        </p>
      </div>
    </div>
  );
};

export default Contact;
