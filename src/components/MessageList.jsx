import React, { useRef, useEffect, memo } from 'react';
import ReactMarkdown from 'react-markdown';
import { Sparkles, User } from 'lucide-react';

const mdComponents = {
  p:      ({ children }) => <p className="mb-2 last:mb-0 break-words">{children}</p>,
  strong: ({ children }) => <strong className="font-bold text-violet-300">{children}</strong>,
  ol:     ({ children }) => <ol className="list-decimal ml-4 space-y-1 my-2">{children}</ol>,
  ul:     ({ children }) => <ul className="list-disc ml-4 space-y-1 my-2">{children}</ul>,
  li:     ({ children }) => <li className="leading-snug break-words">{children}</li>,
  h1:     ({ children }) => <h1 className="font-bold text-base mb-1 text-violet-300">{children}</h1>,
  h2:     ({ children }) => <h2 className="font-bold text-sm mb-1 text-violet-300">{children}</h2>,
  h3:     ({ children }) => <h3 className="font-semibold text-sm mb-1 text-violet-300">{children}</h3>,
  code:   ({ children }) => (
    <code className="bg-slate-800 text-emerald-400 px-1.5 py-0.5 rounded text-xs font-mono break-all">
      {children}
    </code>
  ),
  pre:    ({ children }) => (
    <pre className="bg-slate-900 text-emerald-400 p-3 rounded-lg text-xs font-mono overflow-x-auto whitespace-pre my-2 max-w-full">
      {children}
    </pre>
  ),
};

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
          <ReactMarkdown components={mdComponents}>{msg.content}</ReactMarkdown>
          <span className="block text-[10px] mt-1.5 text-slate-400">{msg.timestamp}</span>
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
MessageBubble.displayName = 'MessageBubble';

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

const MessageList = ({ messages, status }) => {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, status]);

  return (
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
  );
};

export default MessageList;
