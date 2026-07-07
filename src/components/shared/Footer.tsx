import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Instagram, Twitter, Linkedin, Youtube, Facebook, Github, FileText, Globe2, Palette } from 'lucide-react';
import { socialLinksService, SocialLink } from '../../services/socialLinksService';
import { websiteSettingsService } from '../../services/websiteSettingsService';
import { QK } from '../../constants/queryKeys';
import { useRealtimeData } from '../../hooks/useRealtimeData';

const SOCIAL_ICONS: Record<string, React.FC<{ size?: number }>> = {
  Instagram: (props) => <Instagram size={props.size || 16} />,
  Twitter: (props) => <Twitter size={props.size || 16} />,
  Linkedin: (props) => <Linkedin size={props.size || 16} />,
  Youtube: (props) => <Youtube size={props.size || 16} />,
  Facebook: (props) => <Facebook size={props.size || 16} />,
  GitHub: (props) => <Github size={props.size || 16} />,
  Medium: (props) => <FileText size={props.size || 16} />,
  Website: (props) => <Globe2 size={props.size || 16} />,
  Behance: (props) => <Palette size={props.size || 16} />,
};

const Footer: React.FC = () => {
  useRealtimeData([
    { table: 'social_links', queryKey: [QK.socialLinks] },
    { table: 'website_settings', queryKey: [QK.websiteSettings] },
  ]);

  const { data: socialLinks = [] } = useQuery({
    queryKey: [QK.socialLinks],
    queryFn: async () => {
      const res = await socialLinksService.fetchAll();
      return res.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: settings } = useQuery({
    queryKey: [QK.websiteSettings],
    queryFn: async () => {
      const res = await websiteSettingsService.get();
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const enabledSocials = socialLinks.filter((s: SocialLink) => s.enabled && s.url);

  return (
    <footer className="bg-white text-black py-16 sm:py-24 px-6 border-t border-slate-100">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 sm:gap-16 mb-16 sm:mb-20">
          {/* Brand Column */}
          <div className="space-y-6 sm:space-y-8 lg:col-span-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-black rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-black italic">M</div>
              <span className="text-lg sm:text-xl font-black uppercase tracking-tighter">{settings?.site_name || 'Mentorino'}.</span>
            </div>
            <p className="text-slate-500 text-xs sm:text-sm font-medium leading-relaxed max-w-xs">
              {settings?.footer_text || 'We build the trajectory you were meant to follow.'}
            </p>
            <div className="flex items-center gap-4 sm:gap-5">
              {enabledSocials.map((s: SocialLink) => {
                const Icon = SOCIAL_ICONS[s.platform];
                return (
                  <a key={s.id || s.platform} href={s.url} target="_blank" rel="noopener noreferrer" className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:bg-black hover:text-white transition-all">
                    {Icon ? <Icon /> : null}
                  </a>
                );
              })}
            </div>
          </div>

          {/* Navigate Column */}
          <div>
            <h4 className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.4em] text-indigo-500 mb-6 sm:mb-8">Navigate</h4>
            <ul className="space-y-3 sm:space-y-4">
              {[
                { label: 'About Mentor', to: '/about' },
                { label: 'Programs', to: '/programs' },
                { label: 'Consultation', to: '/consultation' },
                { label: 'FAQ', to: '/faq' },
              ].map((item) => (
                <li key={item.label}>
                  <Link to={item.to} className="text-slate-500 hover:text-black transition-colors text-xs sm:text-sm font-medium">{item.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Connect Column */}
          <div>
            <h4 className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.4em] text-indigo-500 mb-6 sm:mb-8">Connect</h4>
            <ul className="space-y-3 sm:space-y-4">
              {[
                { label: 'Contact', to: '/contact' },
                { label: 'Gallery', to: '/gallery' },
                { label: 'MEMBERS PORTAL', to: '/auth' },
              ].map((item) => (
                <li key={item.label}>
                  <Link to={item.to} className="text-slate-500 hover:text-black transition-colors text-xs sm:text-sm font-medium">{item.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-10 sm:pt-12 border-t border-slate-100 flex flex-col md:flex-row items-center justify-center gap-6">
          <p className="text-slate-500 text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-center">
            {settings?.copyright || '© 2026 MEntorino ALL RIGHTS RESERVED'}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
