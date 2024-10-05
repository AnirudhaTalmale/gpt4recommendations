
import { useState } from 'react';
import CustomerInfoModal from './CustomerInfoModal';
import axios from 'axios';

export const handleActionButtonClick = async (className, bookTitle, author, userEmail) => {
  if (!className || !userEmail || !bookTitle) {
    console.error('Missing required information:', { className, bookTitle, userEmail });
    return;  // Stop execution if any required field is missing
  }

  try {
    await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/book-action`, {
        buttonClassName: className,
        title: bookTitle,
        author: author,
        userEmail: userEmail
    });
  } catch (error) {
    console.error(`Error handling ${className} click:`, error);
  }
};

export const fetchAnecdotes = async (bookDataObjectId, bookTitle) => {
  try {
    const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/anecdotes`, {
      params: { bookDataObjectId, bookTitle }
    });
    return response.data.anecdotes; 
  } catch (error) {
    throw error; 
  }
};  

export const handleAnecdotesRequest = async (bookDataObjectId, bookTitle, author, handleQuerySubmit, setIsLightboxOpen, setLightboxContent, bookData) => {
  try {
    const anecdotes = await fetchAnecdotes(bookDataObjectId, bookTitle);
    if (!anecdotes) {
      const userQuery = `${bookTitle} by ${author}`;
      handleQuerySubmit(bookData, userQuery, false, bookDataObjectId, bookTitle, author, false, false, true);
    } else {
      setLightboxContent(''); // Reset the content
      setLightboxContent(anecdotes);
      setIsLightboxOpen(true);
    }
  } catch (error) {
    const userQuery = `${bookTitle} by ${author}`;
    handleQuerySubmit(bookData, userQuery, false, bookDataObjectId, bookTitle, author, false, false, true);
  }
};

export const fetchQuotes = async (bookDataObjectId, bookTitle) => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/quotes`, {
        params: { bookDataObjectId, bookTitle }
      });
      return response.data.quotes; 
    } catch (error) {
      throw error; 
    }
  };  
  
  export const handleQuotesRequest = async (bookDataObjectId, bookTitle, author, handleQuerySubmit, setIsLightboxOpen, setLightboxContent, bookData) => {
    try {
      const quotes = await fetchQuotes(bookDataObjectId, bookTitle);
      if (!quotes) {
        const userQuery = `${bookTitle} by ${author}`;
        handleQuerySubmit(bookData, userQuery, false, bookDataObjectId, bookTitle, author, false, false, false, true);
      } else {
        setLightboxContent(''); // Reset the content
        setLightboxContent(quotes);
        setIsLightboxOpen(true);
      }
    } catch (error) {
      const userQuery = `${bookTitle} by ${author}`;
      handleQuerySubmit(bookData, userQuery, false, bookDataObjectId, bookTitle, author, false, false, false, true);
    }
  };

export const fetchKeyInsights = async (bookDataObjectId, bookTitle) => {
  try {
    const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/key-insights`, {
      params: { bookDataObjectId, bookTitle }
    });
    return response.data.keyInsights; 
  } catch (error) {
    throw error;
  }
};

export const handleKeyInsightsRequest = async (bookDataObjectId, bookTitle, author, handleQuerySubmit, setIsLightboxOpen, setLightboxContent, bookData) => {
  try {
    const keyInsights = await fetchKeyInsights(bookDataObjectId, bookTitle);
    if (!keyInsights) {
      const userQuery = `${bookTitle} by ${author}`;
      handleQuerySubmit(bookData, userQuery, false, bookDataObjectId, bookTitle, author, false, true);
    } else {
      setLightboxContent(''); // Reset the content
      setLightboxContent(keyInsights);
      setIsLightboxOpen(true);
    }
  } catch (error) {
    const userQuery = `${bookTitle} by ${author}`;
    handleQuerySubmit(bookData, userQuery, false, bookDataObjectId, bookTitle, author, false, true);
  }
};

export const fetchMoreDetails = async (bookDataObjectId, bookTitle) => {
  try {
    
    const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/more-details`, {
      params: { bookDataObjectId, bookTitle }
    });
    return response.data.detailedDescription; 
  } catch (error) {
    console.log("unable to fetchMoreDetails ")
  }
};

export const handleMoreDetailsRequest = async (bookDataObjectId, bookTitle, author, handleQuerySubmit, setIsLightboxOpen, setLightboxContent, bookData) => {
  try {
    const detailedDescription = await fetchMoreDetails(bookDataObjectId, bookTitle);
    if (!detailedDescription) {
      const userQuery = `Explain the book - ${bookTitle} by ${author}`;
      handleQuerySubmit(bookData, userQuery, true, bookDataObjectId, bookTitle, author);
    } else {
      setLightboxContent(''); // Reset the content
      setLightboxContent(detailedDescription);
      setIsLightboxOpen(true);
    }
  } catch (error) {
    const userQuery = `Explain the book - ${bookTitle} by ${author}`;
    handleQuerySubmit(bookData, userQuery, true, bookDataObjectId, bookTitle, author);
  }
};

  export const checkAuthStatus = async () => {
    try {
      const authResponse = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/check-auth`, { withCredentials: true });
  
      if (authResponse.status === 200 && authResponse.data.isAuthenticated) {
        if (!authResponse.data.onboardingComplete) {
          const onboardingUrl = new URL(`${process.env.REACT_APP_FRONTEND_URL}/onboarding`);
          
          // Append the verification token to the URL
          if (authResponse.data.verificationToken) {
            onboardingUrl.searchParams.append('token', authResponse.data.verificationToken);
          }
          
          // Append the display name to the URL if it exists
          if (authResponse.data.displayName) {
            onboardingUrl.searchParams.append('displayName', authResponse.data.displayName);
          }
        
          // You could also append the flags for hasDisplayName and hasCountry if needed
          if (authResponse.data.hasDisplayName) {
            onboardingUrl.searchParams.append('hasDisplayName', authResponse.data.hasDisplayName);
          }
          if (authResponse.data.hasCountry) {
            onboardingUrl.searchParams.append('hasCountry', authResponse.data.hasCountry);
          }
        
          // Redirect to the onboarding page with the appended parameters
          window.location.href = onboardingUrl.href;
          return;
        }        
  
        const userInfoResponse = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/user-info`, { withCredentials: true });
  
        if (userInfoResponse.status === 200) {
          const userData = userInfoResponse.data.user;
          return userData;
        }
      } else {
        const userInfoResponse = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/user-info`, { withCredentials: true });
        const userData = userInfoResponse.data.user;
        return userData;   
      }
    } catch (error) {
      const userInfoResponse = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/user-info`, { withCredentials: true });
      const userData = userInfoResponse.data.user;
      return userData;   
    }
  };

  export const renderStarRating = (rating) => {
    let stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const maxStars = 5;

    // Add full stars
    for (let i = 0; i < fullStars; i++) {
        stars.push(<i key={`star-${i}`} className="fa-solid fa-star"></i>);
    }

    // Add half star if necessary
    if (hasHalfStar) {
        stars.push(<i key="half-star" className="fa-solid fa-star-half-stroke"></i>);
    }

    // Calculate remaining stars needed to make total of 5
    const totalStars = hasHalfStar ? fullStars + 1 : fullStars;
    for (let i = totalStars; i < maxStars; i++) {
        stars.push(<i key={`empty-star-${i}`} className="fa-regular fa-star"></i>);
    }

    return <div className="star-rating">{stars}</div>; 
};

export const handleRazorpayPayment = async (amount, bookTitle, customerInfo, author, amazonLink) => {
  try {
      const orderResponse = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/orders`, {
          amount: amount * 100,  // Convert Rs to paise
          currency: "INR"
      });

      const handlePaymentSuccess = async (response) => {
        try {
          const verificationResponse = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/verify-payment`, {
            orderId: orderResponse.data.id,
            paymentId: response.razorpay_payment_id,
            signature: response.razorpay_signature
          });

          if (verificationResponse.data.verified) {

            await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/orders`, {
              email: customerInfo.email,
              firstName: customerInfo.firstName,
              lastName: customerInfo.lastName,
              streetAddress: customerInfo.streetAddress,
              city: customerInfo.city,
              state: customerInfo.state,
              pinCode: customerInfo.pinCode,
              phone: customerInfo.phone,
              deliveryDate: customerInfo.deliveryDate,
              bookTitle: bookTitle,  
              author: author,        
              amountPaid: amount,    
              amazonLink: amazonLink,
              orderId: orderResponse.data.id
            });

            const deliveryDate = customerInfo.deliveryDate.replace("Free Delivery ", "");

            // Send order confirmation email
            await axios.post(`${process.env.REACT_APP_BACKEND_URL}/send-order-confirmation-email`, {
              email: customerInfo.email,
              customerName: `${customerInfo.firstName}`,
              orderId: orderResponse.data.id,
              deliveryDate: deliveryDate  // Send the modified delivery date
            });

            // // Facebook Pixel Tracking
            // const trimmedInput = `To buy the book - ${bookTitle} by ${author}`;
            // if (!isAdmin && process.env.REACT_APP_ENV !== 'local') {
            //   window.fbq && window.fbq('track', 'Search', {
            //     search_string: trimmedInput
            //   });
            // }
          }
        } catch (error) {
          console.error('Error during payment process:', error);
        }
      };
    
      // Prepare Razorpay options
      const options = {
          "key": process.env.REACT_APP_RAZORPAY_KEY_ID,
          "amount": orderResponse.data.amount, 
          "currency": orderResponse.data.currency,
          "name": "GetBooks.ai",
          "description": `Book Purchase - ${bookTitle}`,
          "image": "/GetBooks_64_64.png",
          "order_id": orderResponse.data.id,
          "handler": handlePaymentSuccess,
      };
      const rzp1 = new window.Razorpay(options);
      rzp1.on('payment.failed', function (response) {
          console.error(response.error.code);
      });
      rzp1.open();
  } catch (error) {
      console.error('Error creating order:', error);
  }
};

export const BuyNowButton = ({ link, userEmail, bookTitle, author, price }) => {
  const numericPrice = Number(price.replace('₹', '').trim());
  const getBooksPrice = Math.floor(numericPrice / 2);
  const amazonLink = `${link}/ref=nosim?tag=getbooksai-21`;

  const [customerInfo, setCustomerInfo] = useState({
      name: '',
      email: '',
      contact: '',
  });

  const [showModal, setShowModal] = useState(false);

  const handleSubmit = async (e) => {
      e.preventDefault();
      setShowModal(false); // Hide modal after submitting
      await handleRazorpayPayment(getBooksPrice, bookTitle, customerInfo, author, link);
  };

  const toggleModal = () => setShowModal(!showModal);

  return (
      <>
          <div>
              <button className="buy-now-button" onClick={toggleModal}>
                  GetBooks ₹{getBooksPrice}
              </button>
              <CustomerInfoModal
                  isVisible={showModal}
                  onClose={() => setShowModal(false)}
                  onSubmit={handleSubmit}
                  customerInfo={customerInfo}
                  setCustomerInfo={setCustomerInfo}
              />
          </div>
          <div>
              <a href={amazonLink} target="_blank" rel="noreferrer">
                  <button className="buy-now-button" onClick={() => handleActionButtonClick('buy-now-btn', bookTitle, author, userEmail)}>
                      Amazon {price}
                  </button>
              </a>
          </div>
      </>
  );
};

export const PreviewButton = ({ previewLink, onClick }) => {
  // Define styles for disabled state
  const buttonStyles = previewLink ? {} : { cursor: 'not-allowed', opacity: 0.5, pointerEvents: 'none' };

  return (
    <div>
      <button type="button" 
              className="preview-btn" 
              style={buttonStyles} 
              disabled={!previewLink} 
              data-preview-link={previewLink || undefined}
              onClick={onClick}>
        Preview
      </button>
    </div>
  );
};

export const MoreDetailsButton = ({ bookDataObjectId, bookTitle, author, onClick }) => {
  return (
    <div>
      <button type="button" className="more-details-btn" 
              data-book-data-object-id={bookDataObjectId}
              data-book-title={bookTitle} 
              data-author={author}
              onClick={onClick}>
        Book Info
      </button>
    </div>
  );
};

export const KeyInsightsButton = ({ bookDataObjectId, bookTitle, author, onClick }) => {
  return (
    <div>
      <button type="button" className="key-insights-btn"
              data-book-data-object-id={bookDataObjectId}
              data-book-title={bookTitle}
              data-author={author}
              onClick={onClick}>
        Insights
      </button>
    </div>
  );
};

export const AnecdotesButton = ({ bookDataObjectId, bookTitle, author, onClick }) => {
  return (
    <div>
      <button type="button" className="anecdotes-btn"
              data-book-data-object-id={bookDataObjectId}
              data-book-title={bookTitle}
              data-author={author}
              onClick={onClick}>
        Anecdotes
      </button>
    </div>
  );
};

export const QuotesButton = ({ bookDataObjectId, bookTitle, author, onClick }) => {
  return (
    <div>
      <button type="button" className="quotes-btn"
              data-book-data-object-id={bookDataObjectId}
              data-book-title={bookTitle}
              data-author={author}
              onClick={onClick}>
        Quotes
      </button>
    </div>
  );
};

export const mapCountryNameToCode = (countryName) => {
  const countryMapping = {
    'India': 'IN',
    'United States': 'US',
    'United Kingdom': 'GB',
    'Germany': 'DE',
    'Canada': 'CA',
    'France': 'FR',
    'Japan': 'JP',
    'Netherlands': 'NL',
    'Sweden': 'SE'
  };

  return countryMapping[countryName] || null; // returns null if no match found
};

