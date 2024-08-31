import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; 
import axios from 'axios';
import '../App.css';
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import HomePageHeader from './HomePageHeader';
import Footer from './Footer';
import { v4 as uuidv4 } from 'uuid';
import Cookies from 'js-cookie';


function SampleNextArrow(props) {
  const { className, style, onClick } = props;
  return (
    <div
      className={`sample-next-arrow ${className}`} // Add unique class name
      style={{ ...style, display: "block", borderRadius: "50%", zIndex: 25, width: "50px", height: "50px" }}
      onClick={onClick}
    >
      <i className="fa-solid fa-chevron-right home-page-right-arrow"></i>
    </div>
  );
}

function SamplePrevArrow(props) {
  const { className, style, onClick } = props;
  return (
    <div
      className={`sample-prev-arrow ${className}`} // Add unique class name
      style={{ ...style, display: "block", borderRadius: "50%", zIndex: 25, width: "50px", height: "50px" }}
      onClick={onClick}
    >
      <i className="fa-solid fa-chevron-left home-page-left-arrow"></i>
    </div>
  );
}

const sliderSettings = {
    dots: false,
    infinite: true,
    speed: 400,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 10000,
    cssEase: "linear",
    nextArrow: <SampleNextArrow />,
    prevArrow: <SamplePrevArrow />,
};

const HomePage = () => {
  let navigate = useNavigate();
  const carouselImages = [
    {
      src: '/worlds_most_influential_people_biographies.png',
      alt: 'GetBooks.ai recommends biographies of world\'s most influential people, including "Steve Jobs" by Walter Isaacson and "Long Walk to Freedom" by Nelson Mandela'
    },    
    {
      src: '/nail_biting_mystery_books.png',
      alt: 'GetBooks.ai responds to a query for top nail-biting mystery books with recommendations including "Gone Girl" by Gillian Flynn and "The Girl with the Dragon Tattoo" by Stieg Larsson'
    },
    {
      src: '/the_most_inspirational_book_of_all_time.png',
      alt: 'GetBooks.ai suggests "Man\'s Search for Meaning" by Viktor E. Frankl and "The Alchemist" by Paulo Coelho as the most inspirational books of all time'
    },
    {
      src: '/most_romantic_book_of_all_times.png',
      alt: 'GetBooks.ai recommends the most romantic books including "Pride and Prejudice" by Jane Austen and "Wuthering Heights" by Emily Brontë'
    },
    {
      src: '/the_subtle_art_of_not_giving.png',
      alt: 'GetBooks.ai presents "The Subtle Art of Not Giving a F*ck" by Mark Manson and "Everything is F*cked: A Book About Hope" by Mark Manson for personal development'
    },
    {
      src: '/top_fiction_books.png',
      alt: 'GetBooks.ai showcases top fiction books that will keep readers engaged, featuring "The Night Circus" by Erin Morgenstern and "Shantaram" by Gregory David Roberts'
    }
  ];
  
  

  const features = [
    {
      id: 'book-info',
      title: 'Book Info Button',
      description: 'Get detailed summaries, author backgrounds, and critical acclaim with a single click',
      imgSrc: '/book_info_cant_hurt_me.png',
      alt: 'Book Info feature for Can\'t Hurt Me by David Goggins, showing book summary, author credibility, and endorsements'
    },
    {
      id: 'key-insights',
      title: 'Insights Button',
      description: 'Discover the core concepts of each book with single-click access',
      imgSrc: '/insights_steve_jobs.png',
      alt: 'Book Insights feature presenting key concepts from Steve Jobs biography'
    },
    {
      id: 'anecdotes',
      title: 'Anecdotes Button',
      description: 'Explore captivating stories and moments from the book with just one click',
      imgSrc: '/anecdotes_shoe_dog.png',
      alt: 'Book Anecdotes feature sharing stories from Shoe Dog by Phil Knight'
    },
    {
      id: 'quotes',
      title: 'Quotes Button',
      description: 'Find powerful, inspirational quotes from books at the click of a button',
      imgSrc: '/quotes_warren_buffett.png',
      alt: 'Book Quotes feature with inspirational sayings from The Snowball: Warren Buffett and the Business of Life'
    },
    {
      id: 'preview_on_google_books',
      title: 'Preview Button',
      description: 'Preview your next book instantly with Google Books through a single click',
      imgSrc: '/preview_rework.png',
      alt: 'Book Preview feature showing a glimpse of Rework via Google Books'
    },
    {
      id: 'buy_now_on_amazon',
      title: 'Buy Now Button',
      description: 'Purchase your next read on Amazon instantly with just one click',
      imgSrc: '/amazon_zero_to_one.png',
      alt: 'Buy Now feature for Zero to One displayed on Amazon website'
    },
  ];
   

  const [email, setEmail] = useState('');
    const [emailError, setEmailError] = useState('');

    const validateEmail = (email) => {
        const re = /\S+@\S+\.\S+/;
        return re.test(email);
    };

    const handleLoginWithEmail = async (event) => { 
      event.preventDefault();
    
      if (email && validateEmail(email)) {
        setEmailError('');
        axios.post(`${process.env.REACT_APP_BACKEND_URL}/send-verification-email`, { email })
          .then(() => {
            navigate('/verify-email', { state: { emailToBeVerified: email } });
          })
          .catch(error => {
            if (error.response && error.response.status === 429) {
              const resetTime = new Date(error.response.data.resetTime);
              const formattedTime = resetTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              setEmailError(`You already sent 8 emails in the last hour. Please try again after ${formattedTime}.`);
            } else {
              console.error('Error sending email:', error);
              setEmailError('Error sending verification email. Please try again.');
            }
          }); 
      } else {
        setEmailError('Email is not valid');
      }
    };
    
    const handleEmailChange = (event) => {
      const newEmail = event.target.value;
      setEmail(newEmail);
  
      // Clear the error message if the input is empty
      if (newEmail === '') {
          setEmailError('');
      }
    };
  

    const handleSignupGoogle = () => {
        window.location.href = `${process.env.REACT_APP_BACKEND_URL}/auth/google?prompt=select_account`;
    };

    useEffect(() => {
      let userId = Cookies.get('user_id');
    
      if (!userId) {
        userId = uuidv4(); // Generate a new unique identifier
        Cookies.set('user_id', userId, { expires: 365 }); // Set cookie for 1 year
    
        // Document the new user visit in the database
        axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/record_visit`, { page: 'home', userId })
          .then(response => {
            // console.log('Visit recorded successfully:', response.data);
          })
          .catch(error => {
            console.error('Error recording visit:', error);
          });
      } else {
        // console.log('User has already visited, no need to document again.');
      }
    }, []);
  
  return (
    <div className="homepage">
      <HomePageHeader />

      <section className="hero">
        <h2>AI-Powered Book Recommendation App</h2>
          <div className="login-container">
            <button onClick={handleSignupGoogle} className="login-button">
                <img src="/icons8-google-logo.svg" alt="" className="google-logo" />
                Continue with Google
            </button>
            
            <div className="divider">
                <span className="line"></span>
                OR
                <span className="line"></span>
            </div>

            <form onSubmit={handleLoginWithEmail} noValidate>
                <div className="email-input-group">
                    <input
                        type="email"
                        id="email"
                        placeholder="Email address"
                        required
                        className={`email-input ${emailError ? 'input-error' : ''}`}
                        value={email}
                        onChange={handleEmailChange}
                    />
                </div>
                {emailError && (
                    <div className="error-message">{emailError}</div>
                )}
                <button type="submit" className="continue-button">
                    Continue with Email
                </button>
            </form>
          </div>
      </section>

      {/* Carousel Section */}
      <section className="carousel">
      <h2 style={{ textAlign: 'center' }}>See it in action</h2>
        <Slider {...sliderSettings}>
          {carouselImages.map((img, index) => (
            <div key={index}>
              <img src={img.src} alt={img.alt} style={{ width: '100%', height: 'auto' }} />
            </div>
          ))}
        </Slider>
      </section>

      <div className="features-div">
        <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', lineHeight: '2rem' }}>
          Six Interactive Buttons for Each Recommendation
        </h2>
      </div>
      <section className="features-carousel">
      
        <Slider {...sliderSettings}>
          {features.map((feature, index) => (
            <div key={index} className="feature">
              <div className="feature-text">
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
              <img src={feature.imgSrc} alt={feature.alt} style={{ width: '100%', height: 'auto' }} />
            </div>
          ))}
        </Slider>
      </section>

      <section className="comparison">
        <h2>Why Choose Us</h2>
        <table>
          <thead>
            <tr>
              <th>Features</th>
              <th>GetBooks.ai</th>
              <th>Other Apps</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>AI Model</td>
              <td>Uses advanced GPT-4 for accurate recommendations</td>
              <td>Uses simpler AI models for basic recommendations</td>
            </tr>
            <tr>
            <td>Comprehensive Book Details</td>
                <td>Single-click access to book summaries, author credibility, and endorsements</td>
                <td>Additional queries required</td>
            </tr>
            <tr>
              <td>Book Insights, Anecdotes & Quotes</td>
              <td>Single-click access</td>
              <td>Additional queries required</td>
            </tr>
            <tr>
              <td>Amazon Star Ratings</td>
              <td>Available</td>
              <td>Not available</td>
            </tr>
            <tr>
              <td>Direct Amazon Buy Now Links</td>
              <td>Available for 9 Countries</td>
              <td>Available only for Amazon US</td>
            </tr>
            <tr>
              <td>Book Preview</td>
              <td>Available</td>
              <td>Not available</td>
            </tr>
            <tr>
              <td>User Interface</td>
              <td>Simple, intuitive chat interface</td>
              <td>Generally more complex</td>
            </tr>
          </tbody>
        </table>
      </section>
      <Footer />
    </div>
  );
};

export default HomePage;


    
