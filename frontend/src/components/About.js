import React from 'react';
import HeaderWithBackButton from './HeaderWithBackButton'; 
import '../App.css';

const About = () => {
    return (
      <div className="entire-about-us-page">
        <HeaderWithBackButton />
        <div className="about-container">
            <h1>Founder's Story</h1>
            <p>Hi, I am Anirudha Talmale, the founder of GetBooks.ai, a cutting-edge book recommendation app powered by the advanced AI capabilities of GPT-4. With a background as a software engineer at Amazon, I have a deep passion for reading and exploring books across various genres like entrepreneurship, self-help, and time management.</p>
            <p>Understanding the transformative power of books, I developed GetBooks.ai to simplify the process of finding and choosing books. Our app combines AI efficiency with comprehensive data, offering personalized book recommendations along with detailed insights like Amazon star ratings, summaries, author credibility, and key lessons—all at your fingertips.</p>
            <p>Our mission is to connect every reader with the perfect book, minimizing effort and saving time. Let GetBooks.ai guide you to your next great read.</p>
            <div className="mission-statement">
                <h2>Mission Statement</h2>
                <p>"To ensure everyone can find the perfect book for themselves quickly and easily."</p>
            </div>
        </div>
      </div>
    );
};

export default About;
