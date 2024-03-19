import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../App.css';

const videos = [
  { id: '5d6f8da0c9f1c76a627d3671e74cf86c', title: 'Cloudflare Stream Video 1' },
  { id: 'cc171a3156411e97b890dcd4d7a2ebc2', title: 'Cloudflare Stream Video 2' },
  { id: 'eba951e393da90ce85526bcb7ac26abe', title: 'Cloudflare Stream Video 3' }
];

const VideoDetail = () => {
  const { videoId } = useParams();
  const navigate = useNavigate();
  const [currentVideo, setCurrentVideo] = useState(videoId);
  const containerRef = useRef(null);

  useEffect(() => {
    const findVideoIndex = () => videos.findIndex(video => video.id === videoId);
    const scrollToVideo = () => {
      const videoIndex = findVideoIndex();
      if (videoIndex >= 0) {
        // Temporarily disable smooth scrolling
        const originalScrollBehavior = containerRef.current.style.scrollBehavior;
        containerRef.current.style.scrollBehavior = 'auto';
  
        const scrollPosition = videoIndex * window.innerHeight;
        containerRef.current.scrollTo(0, scrollPosition);
  
        // Re-enable smooth scrolling
        containerRef.current.style.scrollBehavior = originalScrollBehavior;
      }
    };
  
    scrollToVideo();
  }, [videoId]);
  

  const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };
  
  useEffect(() => {
    const handleScroll = () => {
      const index = Math.round(containerRef.current.scrollTop / window.innerHeight);
      const newVideoId = videos[index] ? videos[index].id : currentVideo;
      if (newVideoId !== currentVideo) {
        setCurrentVideo(newVideoId);
        navigate(`/shorts/${newVideoId}`, { replace: true });
      }
    };
  
    const debouncedHandleScroll = debounce(handleScroll, 100);
  
    const container = containerRef.current;
    container.addEventListener('scroll', debouncedHandleScroll);
  
    return () => {
      container.removeEventListener('scroll', debouncedHandleScroll);
    };
  }, [currentVideo, navigate]);

  return (
    <div className="video-details-container" ref={containerRef}>
      {videos.map((video, index) => (
        <div key={video.id} className="video-details-video-container">
          <iframe
            className="video-details-iframe"
            title={`Video ${video.id}`}
            src={`https://customer-0k9lje40lp7rnz83.cloudflarestream.com/${video.id}/iframe`}
            loading="lazy"
            allowFullScreen={true}
          ></iframe>
        </div>
      ))}
    </div>
  );
};

export default VideoDetail;
