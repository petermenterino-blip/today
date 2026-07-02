import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
  const { pathname, search, hash } = useLocation();
  const locationKey = `${pathname}${search}${hash}`;

  useEffect(() => {
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
