import React, { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { sendMessage, addUserMessage, clearError } from '../features/chat/chatSlice';
import { useIsMobile } from './hooks';
import Sidebar from './Sidebar';
import MessageList from './MessageList';
import InputArea from './InputArea';
import { AlertCircle, Sparkles, Menu, X } from 'lucide-react';

const ChatBox = () => {
  const [input, setInput]           = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isMobile  = useIsMobile();
  const sessions  = useSelector((s) => s.chat.sessions);
  const currentId = useSelector((s) => s.chat.currentSessionId);
  const status    = useSelector((s) => s.chat.status);
  const error     = useSelector((s) => s.chat.error);
  const messages  = sessions[currentId]?.messages ?? [];
  const dispatch  = useDispatch();

  // Auto-close on mobile, auto-open on desktop
  useEffect(() => { setSidebarOpen(!isMobile); }, [isMobile]);

  // Close on Escape (mobile)
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape' && isMobile) setSidebarOpen(false); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [isMobile]);

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || status === 'loading') return;
    dispatch(clearError());
    dispatch(addUserMessage({ text, sessionId: currentId }));
    dispatch(sendMessage({ userText: text, sessionId: currentId }));
    setInput('');
  }, [input, status, dispatch, currentId]);

  return (
    <div className="h-screen bg-app flex overflow-hidden">

      <Sidebar
        sessions={sessions}
        currentId={currentId}
        isMobile={isMobile}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main panel */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">

        {/* Header */}
        <header className="flex items-center justify-between px-3 sm:px-4 py-3 border-b border-white/5 sidebar-glass flex-shrink-0">
          <div className="flex items-center gap-2 sm:gap-3">
            {isMobile && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <Menu className="w-4 h-4" />
              </button>
            )}
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
          <p className="text-xs text-slate-500 truncate max-w-[110px] sm:max-w-[200px]">
            {sessions[currentId]?.title ?? 'New Chat'}
          </p>
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
    </div>
  );
};

export default ChatBox;
