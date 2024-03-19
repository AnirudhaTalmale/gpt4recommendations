import React, { useEffect, useRef } from 'react';
import {  useNavigate } from 'react-router-dom';
import { debounce } from 'lodash';

const videos = [
  { id: '5d6f8da0c9f1c76a627d3671e74cf86c', title: 'Cloudflare Stream Video 1' },
  { id: 'cc171a3156411e97b890dcd4d7a2ebc2', title: 'Cloudflare Stream Video 2' },
  { id: 'eba951e393da90ce85526bcb7ac26abe', title: 'Cloudflare Stream Video 3' }
];

const VideoDetail = () => {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const playerInstances = useRef({});

  useEffect(() => {
    const script = document.createElement('script');
    script.src = "https://embed.cloudflarestream.com/embed/sdk.latest.js";
    script.async = true;
    script.onload = () => initializePlayers();
    document.body.appendChild(script);
  
    // Capture the current state of playerInstances.current for use in cleanup
    const currentPlayerInstances = { ...playerInstances.current };
  
    return () => {
      // Use captured state for cleanup
      Object.values(currentPlayerInstances).forEach(player => {
        if (player && player.destroy) {
          player.destroy();
        }
      });
      document.querySelectorAll('script[src="https://embed.cloudflarestream.com/embed/sdk.latest.js"]').forEach(script => script.remove());
    };
  }, []);

  const initializePlayers = () => {
    videos.forEach(video => {
      const elementId = `stream-player-${video.id}`;
      const iframe = document.getElementById(elementId);
      if (iframe && !playerInstances.current[video.id]) {
        const player = window.Stream(iframe);
        playerInstances.current[video.id] = player;
      }
    });
  };

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const videoId = entry.target.dataset.videoId;
          playerInstances.current[videoId]?.play().catch(err => console.error("Playback failed:", err));
          Object.entries(playerInstances.current).forEach(([id, player]) => {
            if (id !== videoId) {
              player.pause();
            }
          });
        }
      });
    }, { root: null, rootMargin: '0px', threshold: 0.75 });

    const videoElements = document.querySelectorAll('.video-details-video-container');
    videoElements.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, [playerInstances]);

  const handleScroll = debounce(() => {
    const index = Math.round(containerRef.current.scrollTop / window.innerHeight);
    const newVideoId = videos[index] ? videos[index].id : undefined;
    if (newVideoId) {
      navigate(`/shorts/${newVideoId}`, { replace: true });
    }
  }, 100);

  useEffect(() => {
    const container = containerRef.current;
    container.addEventListener('scroll', handleScroll);
    return () => {
      container.removeEventListener('scroll', handleScroll);
      handleScroll.cancel();
    };
  }, [handleScroll]);


  return (
    <div className="video-details-container" ref={containerRef}>
      {videos.map(video => (
        <div key={video.id} className="video-details-video-container" data-video-id={video.id}>
          <iframe
            id={`stream-player-${video.id}`}
            className="video-details-iframe"
            title={`Video ${video.id}`}
            src={`https://customer-0k9lje40lp7rnz83.cloudflarestream.com/${video.id}/iframe?preload=true&loop=true&autoplay=false&poster=https%3A%2F%2Fcustomer-0k9lje40lp7rnz83.cloudflarestream.com%2F${video.id}%2Fthumbnails%2Fthumbnail.jpg`}
            loading="lazy"
            allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
            allowFullScreen={true}
          ></iframe>
        </div>
      ))}
    </div>
  );
};

export default VideoDetail;