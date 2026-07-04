import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
  const { pathname, search, hash } = useLocation();
  const locationKey = `${pathname}${search}${hash}`;

  useEffect(() => {
    const scrollToId = sessionStorage.getItem('scrollToSection');
    if (scrollToId) {
      sessionStorage.removeItem('scrollToSection');
      requestAnimationFrame(() => {
        const el = document.getElementById(scrollToId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return;
        }
      });
      return;
    }

    const html = document.documentElement;
    const originalBehavior = html.style.scrollBehavior;
    html.style.scrollBehavior = 'auto';

    const doScroll = () => {
      window.scrollTo(0, 0);
      const main = document.querySelector('main');
      if (main) main.scrollTop = 0;
    };

    doScroll();
    requestAnimationFrame(doScroll);

    setTimeout(() => { html.style.scrollBehavior = originalBehavior; }, 100);
  }, [locationKey]);

  return null;
};

export default ScrollToTop;
