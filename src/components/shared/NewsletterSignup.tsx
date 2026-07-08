import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { notifySuccess, notifyError } from '../../utils/toast';

const NewsletterSignup: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitting(true);
    const { error } = await supabase.from('newsletter_subscriptions').insert({
      email,
      source: 'footer',
    });
    setSubmitting(false);
    if (error) {
      if (error.code === '23505') {
        notifySuccess('You are already subscribed!');
      } else {
        notifyError('Failed to subscribe. Please try again.');
      }
      return;
    }
    notifySuccess('Thanks for subscribing!');
    setEmail('');
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="your@email.com"
        required
        className="w-full bg-white/10 border border-white/20 focus:border-white/50 rounded-xl py-2.5 px-4 text-xs font-medium outline-none transition-colors text-white placeholder:text-white/40"
      />
      <button
        type="submit"
        disabled={submitting}
        className="px-4 py-2.5 bg-white text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/90 transition-all disabled:opacity-50"
      >
        {submitting ? '...' : 'Subscribe'}
      </button>
    </form>
  );
};

export default NewsletterSignup;
