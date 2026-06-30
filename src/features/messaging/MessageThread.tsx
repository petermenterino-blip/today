import React from 'react';
import { VoiceMessagePlayer } from './VoiceMessagePlayer';

interface Message {
  id: string;
  senderId: string;
  senderName?: string;
  conversationId: string;
  content: string;
  type: 'text' | 'voice' | 'file' | 'system' | 'image';
  timestamp: string;
  audioUrl?: string;
  duration?: number;
}

interface MessageThreadProps {
  messages: Message[];
  currentUserId: string;
  isGroup: boolean;
  chatContainerRef: React.RefObject<HTMLDivElement | null>;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

export const MessageThread = React.memo<MessageThreadProps>(({
  messages,
  currentUserId,
  isGroup,
  chatContainerRef,
  messagesEndRef,
}) => {
  return (
    <div ref={chatContainerRef} className="flex-1 overflow-y-auto px-6 md:px-12 py-6 z-0 relative custom-scrollbar flex flex-col bg-[#efeae2]"
      style={{ backgroundImage: "url('data:image/svg+xml;utf8,<svg width=\"200\" height=\"200\" xmlns=\"http://www.w3.org/2000/svg\"><g opacity=\"0.05\"><circle cx=\"20\" cy=\"20\" r=\"10\" fill=\"%23000\"/><path d=\"M10 50L50 10M100 50L150 10\" stroke=\"%23000\" stroke-width=\"2\"/></g></svg>')", backgroundSize: '200px', backgroundRepeat: 'repeat' }}>
      {messages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center select-none p-6">
          <div className="py-8 border-y border-dashed border-[#8696a0]/30 px-6 max-w-sm">
            <h3 className="text-base font-bold text-[#111b21] mb-3">No messages yet</h3>
            <p className="text-[14px] text-[#667781] leading-relaxed">
              Start the conversation by sending<br />
              your first message to your mentor.
            </p>
          </div>
        </div>
      ) : (
        messages.map((m, i, filtered) => {
          if (m.type === 'system') {
            return (
              <div key={m.id} className="flex justify-center w-full my-3">
                <div className="px-3 py-1.5 bg-[#ffeecd] text-[#111b21] rounded-lg text-xs font-medium text-center shadow-sm max-w-[80%] border border-[#ffe0b2]/30 select-none">
                  {m.content}
                </div>
              </div>
            );
          }

          const isMine = m.senderId === currentUserId;
          const isPrevSameSender = i > 0 && filtered[i-1].senderId === m.senderId && filtered[i-1].type !== 'system';
          const showTail = !isPrevSameSender;

          return (
            <div 
              key={m.id} 
              className={`flex ${isMine ? 'justify-end' : 'justify-start'} w-full relative ${
                isPrevSameSender ? 'mt-[3px]' : 'mt-[12px]'
              }`}
            >
              <div 
                className={`relative w-fit min-w-[80px] max-w-[60%] shadow-[0_1px_0.5px_rgba(0,0,0,0.13)] text-[14.2px] leading-[19px] flex flex-col group transition-all duration-150 hover:shadow-[0_2px_4px_rgba(0,0,0,0.15)]
                  ${isMine ? 'bg-[#d9fdd3] text-[#111b21]' : 'bg-white text-[#111b21]'}
                  ${showTail ? (isMine ? 'rounded-[8px] rounded-tr-none' : 'rounded-[8px] rounded-tl-none') : 'rounded-[8px]'}
                  pt-[10px] pb-[22px] pl-[12px] ${isMine ? 'pr-[55px]' : 'pr-[48px]'}
                `}
              >
                {showTail && (
                  <svg viewBox="0 0 8 13" width="8" height="13" className={`absolute top-0 ${isMine ? '-right-2 text-[#d9fdd3]' : '-left-2 text-white'}`}>
                    <path opacity=".13" fill="#000000" d={isMine ? "M5.188 1H0v11.193l6.467-8.625C7.526 2.156 6.958 1 5.188 1z" : "M2.812 1H8v11.193L1.533 3.568C.474 2.156 1.042 1 2.812 1z"}></path>
                    <path fill="currentColor" d={isMine ? "M5.188 0H0v11.193l6.467-8.625C7.526 1.156 6.958 0 5.188 0z" : "M2.812 0H8v11.193L1.533 2.568C.474 1.156 1.042 0 2.812 0z"}></path>
                  </svg>
                )}

                {isGroup && !isMine && (
                  <span className="text-[11px] font-black text-indigo-600 mb-1 px-1 select-none">
                    {m.senderName || 'Participant'}
                  </span>
                )}
                
                {m.type === 'voice' ? (
                  <VoiceMessagePlayer audioUrl={m.audioUrl || m.content} duration={m.duration} />
                ) : (
                  <div 
                    className="block whitespace-pre-wrap break-words text-[#111b21] pl-1 text-[14.2px] leading-[19px]"
                    style={{ overflowWrap: 'anywhere' }}
                  >
                    {m.content}
                  </div>
                )}

                <div className="absolute right-[12px] bottom-[6px] flex items-center gap-[4px] text-[10px] text-[#667781] select-none pointer-events-none">
                  <span>{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }).toLowerCase()}</span>
                </div>
              </div>
            </div>
          );
        })
      )}
      <div ref={messagesEndRef} />
    </div>
  );
});
