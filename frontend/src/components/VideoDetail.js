import React, { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import _ from 'lodash';

const videos = [
  { id: '5d6f8da0c9f1c76a627d3671e74cf86c', title: 'Cloudflare Stream Video 1' },
  { id: 'cc171a3156411e97b890dcd4d7a2ebc2', title: 'Cloudflare Stream Video 2' },
  { id: 'eba951e393da90ce85526bcb7ac26abe', title: 'Cloudflare Stream Video 3' }
];

const findVideoIndex = (videoId) => videos.findIndex(video => video.id === videoId);

const VideoDetail = () => {
  const { videoId } = useParams();
  const navigate = useNavigate();

  const debouncedNavigateRef = useRef(_.debounce((index) => {
    navigate(`/shorts/${videos[index].id}`);
  }, 1000));

  useEffect(() => {
    // Capture the current debounced function in a local variable
    const currentDebouncedNavigate = debouncedNavigateRef.current;

    const handleScroll = () => {
      const currentIndex = findVideoIndex(videoId);
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 100) {
        const nextIndex = (currentIndex + 1) % videos.length;
        currentDebouncedNavigate(nextIndex);
      } else if (window.scrollY <= 100) {
        const prevIndex = (currentIndex - 1 + videos.length) % videos.length;
        currentDebouncedNavigate(prevIndex);
      }
    };

    window.addEventListener('scroll', handleScroll);

    // Use the local variable in the cleanup function
    return () => {
      currentDebouncedNavigate.cancel();
      window.removeEventListener('scroll', handleScroll);
    };
  }, [videoId]); // `debouncedNavigateRef` is stable, so it's omitted from the dependencies

  return (
    <div style={{
      display: 'flex',          
      alignItems: 'center',    
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '5vh 0',
    }}>
      <div style={{ 
        height: '80vh',
        width: '50%', 
        position: 'relative', 
        overflow: 'hidden',
      }}>
        <iframe
          title={`Video ${videoId}`}
          src={`https://customer-0k9lje40lp7rnz83.cloudflarestream.com/${videoId}/iframe?preload=true&loop=true&poster=https%3A%2F%2Fcustomer-0k9lje40lp7rnz83.cloudflarestream.com%2F${videoId}%2Fthumbnails%2Fthumbnail.jpg%3Ftime%3D%26height%3D600`}
          loading="lazy"
          style={{
            border: 'none',
            position: 'absolute',
            top: '50%',
            left: '50%',
            height: '100%', 
            width: '100%',
            borderRadius: '0.8rem',
            transform: 'translate(-50%, -50%)',
          }}
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
          allowFullScreen={true}
        ></iframe>
      </div>
    </div>
  );
};

export default VideoDetail;
