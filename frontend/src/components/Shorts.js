import React from 'react';
import { Link } from 'react-router-dom';
import '../App.css';

function Shorts() {
  const videos = [
    { id: '5d6f8da0c9f1c76a627d3671e74cf86c', title: 'Cloudflare Stream Video 1' },
    { id: 'cc171a3156411e97b890dcd4d7a2ebc2', title: 'Cloudflare Stream Video 2' },
    { id: 'eba951e393da90ce85526bcb7ac26abe', title: 'Cloudflare Stream Video 3' }
  ];

  return (
    <div className="shorts">
      {/* Display videos in a grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
        {videos.map((video, index) => (
          <Link key={video.id} to={`/shorts/${video.id}`}>
            <div>
              <img src={`https://customer-0k9lje40lp7rnz83.cloudflarestream.com/${video.id}/thumbnails/thumbnail.jpg?time=&height=600`} alt={video.title} style={{ width: '100%', height: 'auto' }} />
              <p>{video.title}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default Shorts;
