
import React from 'react';
import { Session } from '../types';

interface SidebarProps {
  sessions: Session[];
  activeSessionId: string | null;
  onNewSession: () => void;
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ sessions, activeSessionId, onNewSession, onSelectSession, onDeleteSession }) => {
  const sortedSessions = sessions.sort((a, b) => b.lastModified - a.lastModified);

  return (
    <aside className="flex flex-col h-screen bg-gray-900 w-64 p-3 border-r border-gray-800">
      <button
        onClick={onNewSession}
        className="w-full bg-amber-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-amber-700 transition-colors mb-4 flex items-center justify-center space-x-2"
        aria-label="Start New Session"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        <span>New Session</span>
      </button>
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {sortedSessions.map(session => (
          <div
            key={session.id}
            onClick={() => onSelectSession(session.id)}
            className={`group relative p-3 rounded-lg cursor-pointer transition-colors duration-200 ${
              session.id === activeSessionId
                ? 'bg-amber-700 text-white shadow-md'
                : 'text-gray-300 hover:bg-gray-800'
            }`}
          >
            <p className="truncate text-sm font-medium">{session.title}</p>
            <p className="text-xs opacity-60">
              {new Date(session.lastModified).toLocaleString()}
            </p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteSession(session.id);
              }}
              className="absolute top-1/2 right-2 -translate-y-1/2 p-1 rounded-full text-gray-400 opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all duration-200"
              aria-label={`Delete session: ${session.title}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </aside>
  );
};

export default Sidebar;