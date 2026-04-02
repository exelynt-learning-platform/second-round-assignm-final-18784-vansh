import React, { useRef, useCallback } from 'react';
import { Send, Mic, MicOff } from 'lucide-react';
import { useSpeechRecognition } from './hooks';

const InputArea = ({ input, setInput, onSend, status, isMobile }) => {
  const textareaRef = useRef(null);

  const onVoiceResult = useCallback((transcript) => {
    setInput((prev) => (prev ? prev + ' ' + transcript : transcript));
    textareaRef.current?.focus();
  }, [setInput]);

  const { listening, supported, start, stop } = useSpeechRecognition(onVoiceResult);

  const handleInput = useCallback((e) => {
    setInput(e.target.value);
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
    }
  }, [setInput]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    }
  }, [onSend]);

  return (
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
          className="flex-1 resize-none input-glass rounded-xl px-3 sm:px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-violet-500/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        />
        {supported && (
          <button
            onClick={listening ? stop : start}
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors duration-150 ${
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
          onClick={onSend}
          disabled={!input.trim() || status === 'loading'}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed text-white shadow-lg shadow-violet-500/20 hover:shadow-violet-500/40 hover:scale-105 active:scale-95 transition-all duration-150"
          title="Send message"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default InputArea;
