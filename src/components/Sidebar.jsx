import React, { memo } from 'react';
import { useDispatch } from 'react-redux';
import { newChat, switchSession, deleteSession } from '../features/chat/chatSlice';
import { Plus, Trash2, MessageSquare, Sparkles, X } from 'lucide-react';

const SessionItem = memo(({ session, active, onNavigate }) => {
  const dispatch = useDispatch();
  return (
    <div
      onClick={() => { dispatch(switchSession(session.id)); onNavigate(); }}
      className={`group flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-colors duration-150 ${
        active ? 'bg-violet-600/30 border border-violet-500/40' : 'hover:bg-white/5 border border-transparent'
      }`}
    >
      <MessageSquare className={`w-3.5 h-3.5 flex-shrink-0 ${active ? 'text-violet-400' : 'text-slate-500'}`} />
      <span className={`text-xs truncate flex-1 ${active ? 'text-slate-100' : 'text-slate-400'}`}>
        {session.title}
      </span>
      <button
        onClick={(e) => { e.stopPropagation(); dispatch(deleteSession(session.id)); }}
        className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-colors p-0.5 rounded"
      >
        <Trash2 className="w-3 h-3" />
      </button>
    </div>
  );
});

const Sidebar = ({ sessions, currentId, isMobile, isOpen, onClose }) => {
  const dispatch = useDispatch();

  const handleNavigate = () => { if (isMobile) onClose(); };

  return (
    <>
      {/* Mobile backdrop */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      <aside className={`
        flex flex-col h-full sidebar-glass border-r border-white/5 transition-transform duration-300 ease-in-out
        ${isMobile
          ? `fixed inset-y-0 left-0 z-30 w-72 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`
          : 'relative w-64 flex-shrink-0'
        }
      `}>
        {isMobile && (
          <button
            onClick={onClose}
            className="absolute top-3.5 right-3 z-10 w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Logo */}
        <div className="flex items-center gap-2 px-4 py-4 border-b border-white/5 flex-shrink-0">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-semibold text-slate-100">NexusAI</span>
        </div>

        {/* New chat */}
        <div className="px-3 py-3 flex-shrink-0">
          <button
            onClick={() => { dispatch(newChat()); handleNavigate(); }}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-violet-300 text-xs font-medium transition-colors duration-150"
          >
            <Plus className="w-3.5 h-3.5" /> New Chat
          </button>
        </div>

        {/* History list */}
        <div className="flex-1 overflow-y-auto min-h-0 px-3 pb-4 space-y-1 chat-scroll">
          <p className="text-[10px] text-slate-600 uppercase tracking-widest px-2 mb-2">History</p>
          {Object.values(sessions)
            .sort((a, b) => b.createdAt - a.createdAt)
            .map((s) => (
              <SessionItem
                key={s.id}
                session={s}
                active={s.id === currentId}
                onNavigate={handleNavigate}
              />
            ))}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
