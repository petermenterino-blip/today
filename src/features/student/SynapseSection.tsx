import React, { useEffect, useRef, memo } from 'react';
import { motion } from 'motion/react';
import Hls from 'hls.js';

interface VideoPlayerProps {
  src: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = memo(({ src }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let hls: Hls | null = null;

    if (videoRef.current) {
      if (Hls.isSupported()) {
        hls = new Hls();
        hls.loadSource(src);
        hls.attachMedia(videoRef.current);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          videoRef.current?.play().catch(e => console.error("Auto-play failed", e));
        });
      } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
        videoRef.current.src = src;
        videoRef.current.addEventListener('loadedmetadata', () => {
          videoRef.current?.play().catch(e => console.error("Auto-play failed", e));
        });
      }
    }

    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [src]);

  return (
    <video
      ref={videoRef}
      className="w-full h-full object-cover"
      muted
      loop
      playsInline
      autoPlay
    />
  );
});

VideoPlayer.displayName = 'VideoPlayer';

const SynapseSection: React.FC = () => {
  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
  };

  return (
    <section className="relative w-full bg-black min-h-screen overflow-hidden flex flex-col font-sans">
      {/* Background Video */}
      <div className="absolute inset-x-0 bottom-[35vh] h-[80vh] z-0 overflow-hidden">
        <VideoPlayer src="https://stream.mux.com/9JXDljEVWYwWu01PUkAemafDugK89o01BR6zqJ3aS9u00A.m3u8" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center pt-32 pb-24 px-6 text-center max-w-5xl mx-auto">
        {/* Headline */}
        <motion.h1 
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.3, duration: 0.8 }}
          className="text-5xl md:text-8xl font-black text-white tracking-tighter leading-[0.9] uppercase mb-8"
        >
          READY FOR <br />
          CLARITY?
        </motion.h1>

        {/* Subtext */}
        <div className="space-y-4 mb-12">
          <motion.p 
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-slate-400 text-lg md:text-2xl font-medium max-w-2xl leading-relaxed"
          >
            Take your next step with confidence. Apply or book today.
          </motion.p>
          
          <motion.div
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.6, duration: 0.8 }}
            className="space-y-2"
          >
            <p className="text-white text-sm md:text-base font-bold uppercase tracking-widest">Apply for Programs (takes 2 minutes)</p>
            <p className="text-slate-500 text-xs md:text-sm font-medium">Once approved, you'll be able to book your consultation.</p>
          </motion.div>
        </div>

        {/* Buttons */}
        <motion.div 
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.7, duration: 0.8 }}
          className="flex flex-col sm:flex-row items-center gap-6"
        >
          <button onClick={() => window.location.hash = '#/apply'} className="px-12 py-6 bg-black border border-white text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-full hover:bg-white hover:text-black transition-all">
            Apply for Programs
          </button>
          <button onClick={() => window.location.hash = '#/booking'} className="px-12 py-6 bg-white/5 backdrop-blur-xl border border-white/10 text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-full hover:bg-white/10 transition-all">
            Book Consultation
          </button>
        </motion.div>
      </div>

    </section>
  );
};

export default SynapseSection;
