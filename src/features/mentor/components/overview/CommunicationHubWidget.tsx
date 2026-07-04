import React from 'react';
import { Megaphone, MessageSquare } from 'lucide-react';
import type { Conversation } from '../../../../types';

interface Props {
  communities: Conversation[];
  conversations: Conversation[];
  onMessagingClick: () => void;
  onBroadcastClick: () => void;
}

export const CommunicationHubWidget: React.FC<Props> = ({ communities, conversations, onMessagingClick, onBroadcastClick }) => {
  return (
    <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex flex-col h-[420px]">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-black uppercase tracking-tighter text-slate-900">Communication Hub</h3>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Reach cohort and broadcast</p>
        </div>
        <button onClick={onMessagingClick} className="p-1.5 hover:bg-slate-50 rounded-full transition-colors relative">
          <MessageSquare className="text-slate-500" size={16} />
          {conversations.some((c: any) => (c.unreadCount || 0) > 0) && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-indigo-600 rounded-full animate-ping"></span>
          )}
        </button>
      </div>

      <div className="flex-1 flex flex-col justify-between">
        <div className="space-y-3">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Active Cohort Rooms</p>
          <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1 custom-scrollbar">
            {communities.slice(0, 2).map((community: any) => (
              <div
                key={community.id}
                onClick={onMessagingClick}
                className="p-2.5 rounded-xl bg-slate-50/60 hover:bg-slate-100 border border-slate-100 hover:border-slate-200 transition-all cursor-pointer flex justify-between items-center gap-3 group"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">{community.name}</p>
                  <p className="text-[10px] text-slate-500 truncate mt-0.5">{community.lastMessage || 'No messages yet'}</p>
                </div>
                {community.unreadCount > 0 && (
                  <span className="bg-indigo-600 text-[9px] font-black text-white px-1.5 py-0.5 rounded-full">{community.unreadCount}</span>
                )}
              </div>
            ))}
            {communities.length === 0 && (
              <div className="text-center py-4 bg-slate-50/40 rounded-xl border border-dashed border-slate-200">
                <p className="text-[9px] font-bold text-slate-400 uppercase">No active group channels</p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100">
          <button
            onClick={onBroadcastClick}
            className="w-full p-4 bg-indigo-50/40 hover:bg-indigo-50 rounded-2xl border border-indigo-100/50 transition-all flex items-center gap-3"
          >
            <div className="w-8 h-8 bg-indigo-100 rounded-xl flex items-center justify-center">
              <Megaphone size={14} className="text-indigo-600" />
            </div>
            <div className="text-left">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">Quick Broadcast</p>
              <p className="text-[9px] text-slate-400">Send message to all students</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
