import React, {useState} from 'react';
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
      // Content is empty or whitespace only
      return null; // Don't render the span at all
    } else {
      const formattedContent = content.replace(/\n/g, '<br/>');
      return <span className="message-question-chat-with-us" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(formattedContent) }}></span>;
    }
  };
  

  const renderImageAttachments = (attachments) => {
    return attachments.map((attachment, index) => {
      let imageData;
      let isBase64 = false;
  
      if (attachment.mimetype && attachment.mimetype.startsWith('image/')) {
        // Backend processed attachment
        imageData = attachment.data;
      } else if (typeof attachment === 'string' && attachment.startsWith('data:image/')) {
        // Frontend Base64 encoded image
        imageData = attachment;
        isBase64 = true;
      }
  
      if (imageData) {
        return (
          <div key={index} className="attachment" onClick={() => handleImageClick(imageData)}>
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
          <div><img src={userImage} alt="User" className="display-image" /></div>
        ) : (
          <span>U</span> // Fallback if no user image is available
        )
      ) : (
        <div><img src="/favicon.ico" alt="Assistant" className="display-image" /></div> // Icon for the assistant
      );
    } else {
      // Return an invisible placeholder with the same dimensions as the display image
      return <div className="display-image"></div>;
    }
  };

  return (
    <div className={`chat-area-wrapper`}>
      <div className={`message ${role}`}>
        <div className="message-icon">
          {renderImageOrPlaceholder()}
        </div>
        <div className="message-content">
          {/* Role label for user or assistant */}
          {showRoleLabel && (
            <div className="message-sender-chat-with-us">{role === 'user' ? 'You' : 'OpenAI Team'}</div>
          )}

          {/* Wrap common elements in a single block */}
          <div className="combined-message-block">
            {/* Common rendering for both user and assistant */}
            {['user', 'assistant'].includes(role) && (
              <>
                <div className="message-attachments">
                  {attachments && renderImageAttachments(attachments)}
                </div>
                {renderContent(content)}
              </>
            )}

            {/* Footer */}
            <div className="message-footer">
              <div className="message-timestamp">{formatTimestamp(timestamp)}</div>
              {/* Additional message details can go here */}
            </div>
          </div>
        </div>
      </div>
      {showModal && (
        <div className="modal" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}> {/* Prevent modal close when clicking inside */}
            <img src={selectedImage} alt="Enlarged Attachment" />
            <button className="close-button" onClick={() => setShowModal(false)}>
              <i class="fa-solid fa-x"></i>
            </button>
          </div>
        </div>
      )}
    </div>
  );  
}

export default AnswerDisplay;
