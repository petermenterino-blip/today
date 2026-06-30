import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
  const { pathname, search, hash } = useLocation();
  const prevKey = useRef('');

  const locationKey = `${pathname}${search}${hash}`;

  useEffect(() => {
    if (prevKey.current === locationKey) return;
    prevKey.current = locationKey;

    const html = document.documentElement;
    const originalBehavior = html.style.scrollBehavior;
    html.style.scrollBehavior = 'auto';

    const scroll = () => window.scrollTo(0, 0);
    scroll();
    requestAnimationFrame(scroll);
    requestAnimationFrame(() => requestAnimationFrame(scroll));

    setTimeout(() => { html.style.scrollBehavior = originalBehavior; }, 100);
  }, [locationKey]);

  return null;
};

export default ScrollToTop;
