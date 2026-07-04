import React, { useState, useMemo } from 'react';
import { Search, X, Users, CheckCheck } from 'lucide-react';
import { Conversation } from '../../types/messaging';

interface ConversationHeaderProps {
  selectedConversation: Conversation;
  role: 'student' | 'mentor';
  onBack: () => void;
  onHeaderClick: () => void;
}

export const ConversationHeader: React.FC<ConversationHeaderProps> = ({
  selectedConversation,
  role,
  onBack,
  onHeaderClick,
}) => {
  const [showInChatSearch, setShowInChatSearch] = useState(false);
  const [searchInChatQuery, setSearchInChatQuery] = useState('');

  const displayName = useMemo(() => {
    if (selectedConversation.isGroup) return selectedConversation.name || 'Group Chat';
    return role === 'mentor' ? (selectedConversation.studentName || 'Unknown Student') : (selectedConversation.mentorName || 'Unknown Mentor');
  }, [selectedConversation, role]);

  const headerInitial = useMemo(() => {
    if (selectedConversation.isGroup) return '';
    return displayName.charAt(0) || '?';
  }, [selectedConversation, displayName]);

  return (
    <>
      <div className="h-[60px] bg-[#f0f2f5] px-4 flex items-center justify-between border-b border-[#d1d7db] shrink-0 z-10 w-full relative">
        <div className="flex items-center gap-3 cursor-pointer flex-1 min-w-0 h-full py-1" onClick={onHeaderClick}>
          <button 
            className="md:hidden p-2 -ml-2 text-[#54656f]" 
            onClick={(e) => { e.stopPropagation(); onBack(); }}
          >
            <X size={20} />
          </button>
          <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center shrink-0 text-indigo-700 font-bold">
            {selectedConversation.isGroup ? <Users size={18} /> : headerInitial}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base text-[#111b21] truncate font-medium hover:text-indigo-600 transition-colors">
              {displayName}
            </h3>
            <p className="text-xs text-[#667781] truncate hover:underline flex items-center gap-1">
              {selectedConversation.isGroup ? (
                <>{selectedConversation.participants?.length || 0} participants</>
              ) : (
                <><CheckCheck size={12} className="text-[#53bdeb]" /> Tap here for contact info</>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[#54656f] px-1 shrink-0">
          <button 
            onClick={() => {
              setShowInChatSearch(!showInChatSearch);
              setSearchInChatQuery('');
            }}
            className={`p-1.5 hover:bg-slate-200 rounded-full transition-colors ${showInChatSearch ? 'text-[#00a884]' : ''}`}
            title="Search Messages"
          >
            <Search size={18} />
          </button>
        </div>
      </div>

      {showInChatSearch && (
        <div className="h-[45px] bg-[#f0f2f5] px-4 flex items-center border-b border-[#d1d7db] shrink-0 z-10 w-full relative">
          <div className="bg-white rounded-lg flex items-center px-3 py-1.5 gap-3 w-full">
            <Search size={14} className="text-[#54656f]" />
            <input 
              type="text" 
              placeholder="Search messages in this chat" 
              className="bg-transparent border-none outline-none w-full text-xs"
              value={searchInChatQuery}
              onChange={(e) => setSearchInChatQuery(e.target.value)}
              autoFocus
            />
            {searchInChatQuery && (
              <button onClick={() => setSearchInChatQuery('')} className="text-slate-400 hover:text-slate-600" aria-label="Clear search"><X size={14} /></button>
            )}
          </div>
        </div>
      )}
    </>
  );
};
