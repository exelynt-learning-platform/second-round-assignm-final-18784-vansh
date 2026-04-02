import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import ReactMarkdown from 'react-markdown';
import { useSelector, useDispatch } from 'react-redux';
import {
  sendMessage, addUserMessage, newChat,
  switchSession, deleteSession, clearError,
} from '../features/chat/chatSlice';
import {
  User, Send, Plus, Trash2, AlertCircle,
  X, Mic, MicOff, MessageSquare, Sparkles, Menu, Copy, Check,
} from 'lucide-react';

/* ─── Voice hook ─────────────────────────────────────────────────────────── */
const useSpeechRecognition = (onResult) => {
  const recogRef = useRef(null);
  const [listening, setListening] = useState(false);
  const [supported] = useState(
    () => 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
  );
  const start = useCallback(() => {
    if (!supported) return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const r = new SR();
    r.lang = 'en-US'; r.interimResults = false; r.maxAlternatives = 1;
    r.onresult = (e) => onResult(e.results[0][0].transcript);
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    recogRef.current = r; r.start(); setListening(true);
  }, [supported, onResult]);
  const stop = useCallback(() => { recogRef.current?.stop(); setListening(false); }, []);
  return { listening, supported, start, stop };
};

/* ─── useIsMobile ────────────────────────────────────────────────────────── */
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const h = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, []);
  return isMobile;
};

/* ─── Copy button ────────────────────────────────────────────────────────── */
const CopyButton = ({ text }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [text]);
  return (
    <button
      onClick={handleCopy}
      title={copied ? 'Copied!' : 'Copy response'}
      className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg transition-all duration-200 mt-2 ${
        copied
          ? 'text-emerald-400 bg-emerald-400/10'
          : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
      }`}
    >
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
};

/* ─── Message bubble ─────────────────────────────────────────────────────── */
const MessageBubble = memo(({ msg }) => (
  <div className={`flex items-end gap-2 message-animate ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
    {msg.role === 'assistant' && (
      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-violet-500/30">
        <Sparkles className="w-3.5 h-3.5 text-white" />
      </div>
    )}
    <div className={`max-w-[82%] sm:max-w-[75%] lg:max-w-[65%] px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl text-sm leading-relaxed break-words shadow-lg overflow-hidden ${
      msg.role === 'user'
        ? 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-br-sm shadow-violet-500/20'
        : 'glass-bubble text-slate-100 rounded-bl-sm'
    }`}>
      {msg.role === 'assistant' ? (
        <>
          <ReactMarkdown components={{
            p: ({ children }) => <p className="mb-2 last:mb-0 break-words">{children}</p>,
            strong: ({ children }) => <strong className="font-bold text-violet-300">{children}</strong>,
            ol: ({ children }) => <ol className="list-decimal ml-4 space-y-1 my-2">{children}</ol>,
            ul: ({ children }) => <ul className="list-disc ml-4 space-y-1 my-2">{children}</ul>,
            li: ({ children }) => <li className="leading-snug break-words">{children}</li>,
            h1: ({ children }) => <h1 className="font-bold text-base mb-1 text-violet-300">{children}</h1>,
            h2: ({ children }) => <h2 className="font-bold text-sm mb-1 text-violet-300">{children}</h2>,
            h3: ({ children }) => <h3 className="font-semibold text-sm mb-1 text-violet-300">{children}</h3>,
            code: ({ inline, children }) => inline
              ? <code className="bg-slate-800 text-emerald-400 px-1.5 py-0.5 rounded text-xs font-mono break-all">{children}</code>
              : <pre className="bg-slate-900 text-emerald-400 p-3 rounded-lg text-xs font-mono overflow-x-auto whitespace-pre my-2 max-w-full"><code>{children}</code></pre>,
          }}>{msg.content}</ReactMarkdown>
          <div className="flex items-center justify-between mt-1">
            <span className="text-[10px] text-slate-400">{msg.timestamp}</span>
            <CopyButton text={msg.content} />
          </div>
        </>
      ) : (
        <>
          <span className="break-words">{msg.content}</span>
          <span className="block text-[10px] mt-1.5 text-indigo-200 text-right">{msg.timestamp}</span>
        </>
      )}
    </div>
    {msg.role === 'user' && (
      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-500/30">
        <User className="w-3.5 h-3.5 text-white" />
      </div>
    )}
  </div>
), (prev, next) => prev.msg.id === next.msg.id && prev.msg.content === next.msg.content);

/* ─── Typing indicator ───────────────────────────────────────────────────── */
const TypingIndicator = () => (
  <div className="flex items-end gap-2 justify-start message-animate">
    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-violet-500/30">
      <Sparkles className="w-3.5 h-3.5 text-white animate-pulse" />
    </div>
    <div className="glass-bubble px-4 py-3 rounded-2xl rounded-bl-sm shadow-lg">
      <div className="flex items-center gap-1.5">
        <div className="orbit-spinner"><span /><span /><span /></div>
        <span className="text-xs text-slate-400 ml-2">NexusAI is thinking…</span>
      </div>
    </div>
  </div>
);

/* ─── Sidebar inner content ──────────────────────────────────────────────── */
const SidebarContent = ({ sessions, currentId, dispatch, onNavigate }) => (
  <>
    <div className="flex items-center gap-2 px-4 py-4 border-b border-white/5 flex-shrink-0">
      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
        <Sparkles className="w-3.5 h-3.5 text-white" />
      </div>
      <span className="text-sm font-semibold text-slate-100">NexusAI</span>
    </div>

    <div className="px-3 py-3 flex-shrink-0">
      <button
        onClick={() => { dispatch(newChat()); onNavigate(); }}
        className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-violet-300 text-xs font-medium transition-all duration-200"
      >
        <Plus className="w-3.5 h-3.5" /> New Chat
      </button>
    </div>

    <div className="flex-1 overflow-y-auto min-h-0 px-3 pb-4 space-y-1 chat-scroll">
      <p className="text-[10px] text-slate-600 uppercase tracking-widest px-2 mb-2">History</p>
      {Object.values(sessions)
        .sort((a, b) => b.createdAt - a.createdAt)
        .map((s) => (
          <div
            key={s.id}
            onClick={() => { dispatch(switchSession(s.id)); onNavigate(); }}
            className={`group flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 ${
              s.id === currentId
                ? 'bg-violet-600/30 border border-violet-500/40'
                : 'hover:bg-white/5 border border-transparent'
            }`}
          >
            <MessageSquare className={`w-3.5 h-3.5 flex-shrink-0 ${s.id === currentId ? 'text-violet-400' : 'text-slate-500'}`} />
            <span className={`text-xs truncate flex-1 ${s.id === currentId ? 'text-slate-100' : 'text-slate-400'}`}>
              {s.title}
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); dispatch(deleteSession(s.id)); }}
              className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-all p-0.5 rounded"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
    </div>
  </>
);

/* ─── Main ChatBox ───────────────────────────────────────────────────────── */
const ChatBox = () => {
  const [input, setInput] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isMobile  = useIsMobile();
  const sessions  = useSelector((s) => s.chat.sessions);
  const currentId = useSelector((s) => s.chat.currentSessionId);
  const status    = useSelector((s) => s.chat.status);
  const error     = useSelector((s) => s.chat.error);
  const messages  = sessions[currentId]?.messages ?? [];

  const dispatch    = useDispatch();
  const bottomRef   = useRef(null);
  const textareaRef = useRef(null);

  // Auto-close on mobile, auto-open on desktop
  useEffect(() => {
    setSidebarOpen(!isMobile);
  }, [isMobile]);

  // Close on Escape (mobile overlay)
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape' && isMobile) setSidebarOpen(false); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [isMobile]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, status]);

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || status === 'loading') return;
    dispatch(clearError());
    dispatch(addUserMessage({ text, sessionId: currentId }));
    dispatch(sendMessage({ userText: text, sessionId: currentId }));
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  }, [input, status, dispatch, currentId]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }, [handleSend]);

  const handleInput = useCallback((e) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, []);

  const onVoiceResult = useCallback((transcript) => {
    setInput((prev) => (prev ? prev + ' ' + transcript : transcript));
    textareaRef.current?.focus();
  }, []);

  const { listening, supported, start, stop } = useSpeechRecognition(onVoiceResult);

  // On mobile: close sidebar after picking a session
  const handleNavigate = useCallback(() => {
    if (isMobile) setSidebarOpen(false);
  }, [isMobile]);

  return (
    <div className="h-screen bg-app flex overflow-hidden">

      {/* ── Mobile backdrop ── */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ──
            Mobile  → fixed overlay, slides in/out, z-30
            Desktop → static in flow, always visible              */}
      <aside className={`
        flex flex-col h-full sidebar-glass border-r border-white/5 transition-transform duration-300 ease-in-out
        ${isMobile
          ? `fixed inset-y-0 left-0 z-30 w-72 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`
          : 'relative w-64 flex-shrink-0'
        }
      `}>
        {/* Mobile close button */}
        {isMobile && (
          <button
            onClick={() => setSidebarOpen(false)}
            className="absolute top-3.5 right-3 z-10 w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        <SidebarContent
          sessions={sessions}
          currentId={currentId}
          dispatch={dispatch}
          onNavigate={handleNavigate}
        />
      </aside>

      {/* ── Main panel ── */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">

        {/* Header */}
        <header className="flex items-center justify-between px-3 sm:px-4 py-3 border-b border-white/5 sidebar-glass flex-shrink-0">
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Hamburger — mobile only */}
            {isMobile && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all"
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

        {/* Messages — ONLY this scrolls */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 px-3 sm:px-5 lg:px-8 py-4 sm:py-5 space-y-3 sm:space-y-4 chat-scroll">
          {messages.length === 0 && status !== 'loading' && (
            <div className="flex flex-col items-center justify-center h-full gap-3 select-none">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-indigo-600/20 border border-violet-500/20 flex items-center justify-center">
                <Sparkles className="w-7 h-7 sm:w-8 sm:h-8 text-violet-400 animate-pulse" />
              </div>
              <p className="text-sm font-medium text-slate-300">How can I help you today?</p>
              <p className="text-xs text-slate-600 text-center px-6">Type a message or tap the mic to speak</p>
            </div>
          )}
          {messages.map((msg) => <MessageBubble key={msg.id} msg={msg} />)}
          {status === 'loading' && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t border-white/5 sidebar-glass px-3 sm:px-4 py-3 flex-shrink-0">
          {listening && (
            <div className="flex items-center gap-2 mb-2 px-1">
              <div className="mic-pulse-ring" />
              <span className="text-xs text-violet-400 animate-pulse">Listening… speak now</span>
            </div>
          )}
          <div className="flex items-end gap-2">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder={isMobile ? 'Message NexusAI…' : 'Message NexusAI… (Enter to send)'}
              disabled={status === 'loading'}
              className="flex-1 resize-none input-glass rounded-xl px-3 sm:px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-violet-500/50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            />
            {supported && (
              <button
                onClick={listening ? stop : start}
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                  listening
                    ? 'bg-red-500/20 border border-red-500/50 text-red-400 mic-active'
                    : 'input-glass text-slate-400 hover:text-violet-400 hover:border-violet-500/40'
                }`}
                title={listening ? 'Stop recording' : 'Voice input'}
              >
                {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            )}
            <button
              onClick={handleSend}
              disabled={!input.trim() || status === 'loading'}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200 bg-gradient-to-br from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed text-white shadow-lg shadow-violet-500/20 hover:shadow-violet-500/40 hover:scale-105 active:scale-95"
              title="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ChatBox;
