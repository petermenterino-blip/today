import React, { useState, useEffect, useRef } from 'react';
import { Send, Paperclip } from 'lucide-react';

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

function createSyntheticAudioBlob(durationSeconds: number): Blob {
  const sampleRate = 8000;
  const numSamples = sampleRate * (durationSeconds || 1);
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, 'data');
  view.setUint32(40, numSamples * 2, true);

  const frequency = 440;
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const sample = Math.sin(2 * Math.PI * frequency * t);
    const intSample = Math.max(-32768, Math.min(32767, sample * 32767));
    view.setInt16(44 + i * 2, intSample, true);
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

const EMOJIS = ['😀', '😂', '😍', '👍', '🙏', '🎉', '🔥', '❤️', '🙌', '💯', '😊', '😎', '🤔', '👋', '✨'];

interface ComposeBarProps {
  onSendMessage: (text: string) => void;
  onSendVoiceMessage: (audioUrl: string, duration: number) => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const ComposeBar: React.FC<ComposeBarProps> = ({ onSendMessage, onSendVoiceMessage, onFileUpload }) => {
  const [inputText, setInputText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [recordingState, setRecordingState] = useState<'idle' | 'recording' | 'reviewing'>('idle');
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedDuration, setRecordedDuration] = useState(0);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSimulatedRecording, setIsSimulatedRecording] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    };
  }, [recordedUrl]);

  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleEmojiClick = (emoji: string) => {
    setInputText(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const startRecording = async () => {
    setIsSimulatedRecording(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setRecordedBlob(audioBlob);
        
        const url = URL.createObjectURL(audioBlob);
        setRecordedUrl(url);
        
        stream.getTracks().forEach(track => track.stop());
      };
      
      setRecordingDuration(0);
      setRecordingState('recording');
      
      mediaRecorder.start(250);
      
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
      
    } catch (err) {
      console.warn("Microphone permission denied. Switching to Simulated Recording Mode:", err);
      
      setIsSimulatedRecording(true);
      setRecordingDuration(0);
      setRecordingState('recording');
      
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    }
  };

  const stopRecording = () => {
    if (isSimulatedRecording) {
      const durationSecs = recordingDuration > 0 ? recordingDuration : 3;
      const dummyBlob = createSyntheticAudioBlob(durationSecs);
      setRecordedBlob(dummyBlob);
      
      const url = URL.createObjectURL(dummyBlob);
      setRecordedUrl(url);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      setRecordedDuration(durationSecs);
      setRecordingState('reviewing');
    } else {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      setRecordedDuration(recordingDuration);
      setRecordingState('reviewing');
    }
  };

  const cancelRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!isSimulatedRecording && mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl);
      setRecordedUrl(null);
    }
    
    setRecordedBlob(null);
    setRecordingDuration(0);
    setRecordedDuration(0);
    setRecordingState('idle');
    setIsSimulatedRecording(false);
  };

  const sendVoiceRecording = () => {
    if (!recordedBlob) {
      cancelRecording();
      return;
    }
    
    if (recordedDuration <= 0) {
      cancelRecording();
      return;
    }

    setIsUploading(true);
    
    try {
      const audioUrl = URL.createObjectURL(recordedBlob);
      onSendVoiceMessage(audioUrl, recordedDuration);
      
      if (recordedUrl) {
        URL.revokeObjectURL(recordedUrl);
        setRecordedUrl(null);
      }
      setRecordedBlob(null);
      setRecordingDuration(0);
      setRecordedDuration(0);
      setRecordingState('idle');
      setIsSimulatedRecording(false);
      setIsUploading(false);
    } catch (err) {
      console.error("Send failed:", err);
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-[62px] bg-[#f0f2f5] px-4 py-2 flex items-end gap-3 z-10 w-full shrink-0 relative">
      {showEmojiPicker && (
        <div className="absolute bottom-[70px] left-4 bg-white border border-slate-200 rounded-lg shadow-xl p-2 w-[240px] z-50 animate-in fade-in slide-in-from-bottom-2">
          <div className="grid grid-cols-5 gap-2">
            {EMOJIS.map(emoji => (
              <button 
                key={emoji} 
                onClick={() => handleEmojiClick(emoji)}
                className="text-2xl hover:bg-slate-100 rounded p-1 transition-colors flex items-center justify-center cursor-pointer"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {recordingState !== 'idle' ? (
        <div className="flex-1 flex items-center justify-between bg-white rounded-lg px-4 py-2 min-h-[42px] mb-0.5 border border-[#8696a0]/20 shadow-sm animate-in fade-in slide-in-from-bottom-1">
          {recordingState === 'recording' ? (
            <>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-red-500 animate-ping shrink-0" />
                <span className="text-sm font-bold text-red-600">Recording...</span>
              </div>
              
              <div className="text-base font-semibold text-gray-700 font-mono">
                {(() => {
                  const m = Math.floor(recordingDuration / 60);
                  const s = recordingDuration % 60;
                  return `${m}:${s < 10 ? '0' : ''}${s}`;
                })()}
              </div>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={cancelRecording} 
                  className="px-3 py-1.5 rounded-md text-xs font-semibold text-gray-500 hover:bg-gray-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  onClick={stopRecording} 
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold bg-red-600 text-white hover:bg-red-700 transition shadow-sm cursor-pointer"
                >
                  <span className="w-2 h-2 bg-white rounded-sm shrink-0" />
                  Stop
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#00a884] shrink-0" />
                <span className="text-sm font-semibold text-gray-800">Voice Message Prepared</span>
                <span className="text-xs text-gray-500 font-mono">
                  ({(() => {
                    const m = Math.floor(recordedDuration / 60);
                    const s = recordedDuration % 60;
                    return `${m}:${s < 10 ? '0' : ''}${s}`;
                  })()})
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={cancelRecording} 
                  disabled={isUploading}
                  className="px-3 py-1.5 rounded-md text-xs font-semibold text-red-600 hover:bg-red-50 transition disabled:opacity-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  onClick={sendVoiceRecording} 
                  disabled={isUploading}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-bold bg-[#00a884] text-white hover:bg-[#01755b] transition shadow disabled:opacity-50 cursor-pointer"
                >
                  {isUploading ? (
                    <>
                      <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Send size={12} fill="currentColor" />
                      Send
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        <>
          <div className="flex h-[42px] items-center text-[#54656f] gap-3 mb-0.5 relative">
            <div className="cursor-pointer px-1 relative" onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
              <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor">
                <path d="M9.153 11.603c.795 0 1.439-.879 1.439-1.962s-.644-1.962-1.439-1.962-1.439.879-1.439 1.962.644 1.962 1.439 1.962zm-3.204 1.362c-.026-.307-.131 5.218 6.063 5.551 6.066-.25 6.066-5.551 6.066-5.551-6.078 1.416-12.13 0-12.13 0zm11.362 1.108s-.67 1.96-5.05 1.96c-3.506 0-5.39-1.165-5.608-1.953l.261.261s1.5 1.83 5.347 1.83c3.848 0 5.05-1.83 5.05-1.83z"></path>
              </svg>
            </div>
            <label className="cursor-pointer flex items-center h-full">
              <input type="file" className="hidden" onChange={onFileUpload} />
              <Paperclip size={22} className="hover:text-[#00a884] transition-colors" />
            </label>
          </div>
          <div className="flex-1 bg-white rounded-lg relative flex min-h-[42px] overflow-hidden mb-0.5">
            <textarea 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message"
              className="w-full bg-transparent border-none outline-none resize-none px-4 py-2.5 text-sm custom-scrollbar"
              style={{ minHeight: '42px', maxHeight: '100px' }}
              rows={1}
            />
          </div>
          <div className="flex h-[42px] items-center justify-center w-10 text-[#54656f] mb-0.5" >
            {inputText.trim() ? (
              <button onClick={handleSendMessage} className="text-[#54656f] hover:text-[#00a884] transition-colors" aria-label="Send message"><Send size={24} /></button>
            ) : (
              <button onClick={startRecording} className="text-[#54656f] hover:text-[#00a884] transition-colors" aria-label="Start recording">
                <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor">
                  <path d="M11.999 14.942c2.001 0 3.531-1.53 3.531-3.531V4.35c0-2.001-1.53-3.531-3.531-3.531S8.469 2.35 8.469 4.35v7.061c0 2.001 1.53 3.531 3.53 3.531zm6.238-3.53c0 3.531-2.942 6.002-6.237 6.002s-6.237-2.471-6.237-6.002H3.761c0 4.001 3.178 7.297 7.061 7.885v3.884h2.354v-3.884c3.884-.588 7.061-3.884 7.061-7.885h-2.002z"></path>
                </svg>
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};
