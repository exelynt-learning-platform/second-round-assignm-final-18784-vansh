import React, { useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { sendMessage, addUserMessage, clearChat, clearError } from '../features/chat/chatSlice';
import { useIsMobile } from './hooks';
import MessageList from './MessageList';
import InputArea from './InputArea';
import { AlertCircle, Sparkles, Trash2, X } from 'lucide-react';

const ChatBox = () => {
  const [input, setInput] = useState('');

  const isMobile = useIsMobile();
  const messages = useSelector((s) => s.chat.messages);
  const status   = useSelector((s) => s.chat.status);
  const error    = useSelector((s) => s.chat.error);
  const dispatch = useDispatch();

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || status === 'loading') return;
    dispatch(clearError());
    dispatch(addUserMessage(text));
    dispatch(sendMessage(text));
    setInput('');
  }, [input, status, dispatch]);

  return (
    <div className="h-screen bg-app flex flex-col overflow-hidden">

      {/* Header */}
      <header className="flex items-center justify-between px-3 sm:px-5 py-3 border-b border-white/5 sidebar-glass flex-shrink-0">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
          </div>
          <div>
            <p className="font-semibold text-sm text-slate-100">NexusAI</p>
            <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full inline-block transition-colors duration-300 ${
                status === 'loading' ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400 status-glow'
              }`} />
              {status === 'loading' ? 'Generating…' : 'Online'}
            </p>
          </div>
        </div>
        <button
          onClick={() => dispatch(clearChat())}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-400 px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
          title="Clear chat"
        >
          <Trash2 className="w-3.5 h-3.5" />
          {!isMobile && <span>Clear</span>}
        </button>
      </header>

      {/* Error banner */}
      {error && (
        <div className="flex items-start gap-3 bg-red-500/10 border-b border-red-500/20 px-4 py-3 flex-shrink-0">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-300 flex-1 leading-snug">{error}</p>
          <button onClick={() => dispatch(clearError())} className="text-red-500 hover:text-red-300 transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <MessageList messages={messages} status={status} />

      <InputArea
        input={input}
        setInput={setInput}
        onSend={handleSend}
        status={status}
        isMobile={isMobile}
      />

    </div>
  );
};

export default ChatBox;
