import { Link } from 'react-router-dom';

const NotFound = () => (
  <div className="min-h-[70vh] flex items-center justify-center p-8">
    <div className="text-center max-w-md">
      <h1 className="text-8xl font-black text-slate-200 mb-4">404</h1>
      <p className="text-slate-500 font-medium mb-8">Page not found</p>
      <Link to="/" className="inline-block py-4 px-8 bg-black text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-full hover:scale-[1.02] active:scale-95 transition-all">Go Home</Link>
    </div>
  </div>
);

export default NotFound;