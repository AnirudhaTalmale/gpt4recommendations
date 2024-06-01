import React from 'react';
import HeaderWithHomeButton from './HeaderWithHomeButton';
import '../App.css';

const About = () => {
    return (
      <div className="entire-about-us-page">
        <HeaderWithHomeButton />
        <div className="about-container">
            <h1>Founder's Story</h1>
            <p>Hi, I'm Anirudha, the founder of GetBooks.ai. As a software engineer with a tenure at Amazon and an avid reader, I've always been passionate about discovering the right books across genres like entrepreneurship, self-help, and time management. However, I faced significant challenges in this pursuit, which inspired me to create a solution.</p>
            <p>Firstly, finding books that precisely matched my interests was tedious and time-consuming. Once I found potential reads, comparing them was another hurdle due to scattered information like Amazon star ratings and varying reviews. Additionally, gaining quick insights into books—such as summaries, the credibility of authors, and key takeaways—was nearly impossible without extensive research.</p>
            <p>To address these issues, I developed GetBooks.ai, a one-stop book recommendation platform powered by the advanced AI capabilities of GPT-4. Our app not only recommends books based on your specific queries but also provides immediate access to detailed book comparisons, Amazon star ratings, and essential information like book summaries, author credibility, and key insights with the click of a button.</p>
            <p>Our mission is to streamline your book discovery process, ensuring you can quickly and easily find your next great read without the hassle. Let GetBooks.ai guide you to the perfect book, saving you time and enhancing your reading experience.</p>
            <div className="mission-statement">
                <h2>Mission Statement</h2>
                <p>"To ensure everyone can find the perfect book for themselves quickly and easily."</p>
            </div>
        </div>
      </div>
    );
};

export default About;
