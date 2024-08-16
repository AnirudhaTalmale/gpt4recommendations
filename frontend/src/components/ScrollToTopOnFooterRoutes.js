import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Define footerRoutes outside the component
const footerRoutes = ['/about-us', '/blog', '/privacy-policy'];

const ScrollToTopOnFooterRoutes = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    if (footerRoutes.includes(pathname)) {
      window.scrollTo(0, 0);
    }
  }, [pathname]); // Only pathname needs to be in the dependency array

  return null;
};

export default ScrollToTopOnFooterRoutes;
 