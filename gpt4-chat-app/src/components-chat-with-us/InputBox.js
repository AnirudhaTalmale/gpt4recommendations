import React, { useState, useEffect, useRef } from 'react';
import '../App.css';

function InputBox({ onSubmit, isStreaming, onStopStreaming }) {
  const [input, setInput] = useState('');
  const [isInputNotEmpty, setIsInputNotEmpty] = useState(false);
  const [rows, setRows] = useState(1);
  const [attachments, setAttachments] = useState([]);
  const [attachmentPreviews, setAttachmentPreviews] = useState([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setIsInputNotEmpty(input.trim().length > 0 || attachments.length > 0);
  }, [input, attachments]);

  // Handle drag events
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragOver) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget)) {
      return; // Ignore drag leave if still within the container
    }
    setIsDragOver(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  };

  const processFiles = (files) => {
    // Append new files to the existing attachments
    const updatedAttachments = [...attachments, ...files];
    setAttachments(updatedAttachments);

    // Create previews for new files and append to the existing previews
    const newAttachmentPreviews = files.map(file => URL.createObjectURL(file));
    const updatedAttachmentPreviews = [...attachmentPreviews, ...newAttachmentPreviews];
    setAttachmentPreviews(updatedAttachmentPreviews);
  };

  const handleAttachmentButtonClick = () => {
    // Trigger click on the actual file input
    fileInputRef.current.click();
  };

  const initialHeightRem = 2.5; // Initial height in rem
  const maxHeightRem = 12; // Max height in rem
  const rowHeightRem = 1.75; // Estimated row height in rem

  useEffect(() => {
    // Adjust the row count when input changes
    const lineCount = input.split('\n').length;
    setRows(lineCount >= 1 ? lineCount : 1);
  }, [input]);

  const handleAttachmentChange = (e) => {
    const newFiles = Array.from(e.target.files);
  
    // Append new files to the existing attachments
    const updatedAttachments = [...attachments, ...newFiles];
    setAttachments(updatedAttachments);
  
    // Create previews for new files and append to the existing previews
    const newAttachmentPreviews = newFiles.map(file => URL.createObjectURL(file));
    const updatedAttachmentPreviews = [...attachmentPreviews, ...newAttachmentPreviews];
    setAttachmentPreviews(updatedAttachmentPreviews);
  
    // Reset the file input value
    e.target.value = '';
  };
  
  

  const handleSubmit = (e) => {
    e.preventDefault();

    // Allow submission if there's either text input or attachments
    if (!input.trim() && attachments.length === 0) {
      return; // Prevent submission if both are empty
    }
    
    // Create a FormData object to submit files along with text input
    const formData = new FormData();
    formData.append('text', input);
    
    // Append attachments using a consistent key
    attachments.forEach((file, index) => {
      formData.append('attachments', file); // Using 'attachments' as the key for each file
    });

    // console.log('Submitting FormData:', formData); // Debugging line
    // for (let pair of formData.entries()) {
    //     console.log(pair[0]+ ', ' + pair[1]); 
    // }
    
    // Pass formData to onSubmit instead of just the input value
    onSubmit(formData);
    
    // Reset the input, attachments, and attachment previews state
    setInput('');
    setAttachments([]);
    setAttachmentPreviews([]); // Clearing attachment previews as well
    setIsInputNotEmpty(false);
    setRows(1);
    if (textareaRef.current) {
      textareaRef.current.scrollTop = 0;
    }
  };
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // Prevent default to stop new line

      // Check if streaming is active; if so, do not submit
      if (isStreaming) {
        return;
      }

      if (input.trim() || attachments.length > 0) {
        handleSubmit(e);
      }
    } else if (e.key === 'Enter' && e.shiftKey) {
      setTimeout(() => {
        if (textareaRef.current) {
          const currentScrollPosition = textareaRef.current.scrollTop;
          textareaRef.current.scrollTop = currentScrollPosition;
        }
      }, 0);
    }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    setIsInputNotEmpty(e.target.value.length > 0);
    const lineCount = e.target.value.split('\n').length;
    setRows(lineCount >= 1 ? lineCount : 1);
  };

  const headerHeightRem = 4.7; // Adjust based on your actual header height
  const baseContainerHeight = Math.max(Math.min(rows * rowHeightRem, maxHeightRem), initialHeightRem);
  const containerHeight = baseContainerHeight + (attachmentPreviews.length > 0 ? headerHeightRem : 0);
  
  useEffect(() => {
    return () => {
      attachmentPreviews.forEach(url => URL.revokeObjectURL(url));
    };
  }, [attachmentPreviews]);

  const handleRemoveAttachment = (indexToRemove) => {
    // Remove the preview and file from their respective arrays
    const newAttachmentPreviews = attachmentPreviews.filter((_, index) => index !== indexToRemove);
    const newAttachments = attachments.filter((_, index) => index !== indexToRemove);
  
    setAttachmentPreviews(newAttachmentPreviews);
    setAttachments(newAttachments);
  };  

  const textareaStyle = {
    marginTop: attachmentPreviews.length > 0 ? '4.7rem' : '0',
  };

  const dragOverStyle = {
    backgroundColor: isDragOver ? '#e0e0e0' : 'transparent',
  };

  return (
    <form onSubmit={handleSubmit} className="input-area-chat-with-us">
      <div className="input-box-container-chat-with-us" style={{ height: `${containerHeight}rem`, ...dragOverStyle }}>
        {attachmentPreviews.length > 0 && (
          <div className="attachment-previews-header-chat-with-us">
            {attachmentPreviews.map((previewUrl, index) => (
              <div key={index} className="attachment-preview-chat-with-us">
                <img src={previewUrl} alt={`attachment-${index}`} />
                <button className="remove-attachment-button-chat-with-us" onClick={() => handleRemoveAttachment(index)}>
                  <i class="fa-regular fa-circle-xmark"></i>
                </button>
              </div> 
            ))}
          </div>
        )}
        <button type="button" className="attachment-button-chat-with-us" onClick={handleAttachmentButtonClick}>
          <i className="fa-solid fa-paperclip"></i>
        </button>
        <div className="textarea-wrapper-chat-with-us" style={textareaStyle}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}>
          <textarea ref={textareaRef}
            className="input-box-chat-with-us"
            value={input} 
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Explain your query..."
            rows={rows}
          />
        </div>
        <input
          ref={fileInputRef}
          type="file"
          className="attachment-input-chat-with-us"
          onChange={handleAttachmentChange}
          multiple
          style={{ display: 'none' }}
        />
        {isStreaming ? (
          <button type="button" className="stop-button-chat-with-us" onClick={onStopStreaming}>
            <i class="fa-regular fa-circle-stop"></i>
          </button>
        ) : (
          <button type="submit" className={`send-button-chat-with-us ${isInputNotEmpty ? 'active' : ''}`}>
            <i className="fa-solid fa-arrow-up"></i>
          </button>
        )}
      </div>
    </form>
  );
};

export default InputBox;
