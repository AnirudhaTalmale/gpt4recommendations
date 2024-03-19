import React, { useState } from 'react';
import DOMPurify from 'dompurify';
import '../App.css';

function AnswerDisplay({ role, content, userImage, onMoreDetailsClick, attachments, showRoleLabel, timestamp }) {

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const [showModal, setShowModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const handleImageClick = (imageData) => {
    setSelectedImage(imageData);
    setShowModal(true);
  };

  const renderContent = (content) => {
    if (!content.trim()) {
      return null;
    } else {
      const formattedContent = content.replace(/\n/g, '<br/>');
      return <span className="message-question-chat-with-us" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(formattedContent) }}></span>;
    }
  };

  const renderImageAttachments = (attachments) => {
    return attachments.map((attachment, index) => {
      let imageData;

      if (attachment.mimetype && attachment.mimetype.startsWith('image/')) {
        imageData = attachment.data;
      } else if (typeof attachment === 'string' && attachment.startsWith('data:image/')) {
        imageData = attachment;
      }

      if (imageData) {
        return (
          <div key={index} className="attachment-chat-with-us" onClick={() => handleImageClick(imageData)}>
            <img src={imageData} alt={`Attachment ${index}`} />
          </div>
        );
      }
      return null;
    });
  };

  const renderImageOrPlaceholder = () => {
    if (showRoleLabel) {
      return role === 'user' ? (
        userImage ? (
          <div><img src={userImage} alt="" className="display-image-chat-with-us" /></div>
        ) : (
          <span>U</span>
        )
      ) : (
        <div><img src="/GetBooks.webp" alt="" className="display-image-chat-with-us" /></div>
      );
    } else {
      return <div className="display-image-chat-with-us"></div>;
    }
  };

  return (
    <div className={`chat-area-wrapper`}>
      <div className={`message-chat-with-us ${role}`}>
        <div className="message-icon-chat-with-us">
          {renderImageOrPlaceholder()}
        </div>
        <div className="message-content-chat-with-us">
          {showRoleLabel && (
            <div className="message-sender-chat-with-us">{role === 'user' ? 'You' : 'GetBooks Team'}</div>
          )}

          <div className="combined-message-block-chat-with-us">
            {['user', 'assistant'].includes(role) && (
              <>
                <div className="message-attachments-chat-with-us">
                  {attachments && renderImageAttachments(attachments)}
                </div>
                {renderContent(content)}
              </>
            )}

            <div className="message-footer-chat-with-us">
              <div className="message-timestamp-chat-with-us">{formatTimestamp(timestamp)}</div>
            </div>
          </div>
        </div>
      </div>
      {showModal && (
        <div className="modal-chat-with-us" onClick={() => setShowModal(false)}>
          <div className="modal-content-chat-with-us" onClick={e => e.stopPropagation()}>
            <img src={selectedImage} alt="Enlarged Attachment" />
            <button className="close-button-chat-with-us" onClick={() => setShowModal(false)}>
              <i class="fa-solid fa-x"></i>
            </button>
          </div>
        </div>
      )}
    </div>
  );  
}

export default AnswerDisplay;
