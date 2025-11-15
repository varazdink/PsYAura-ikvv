
import React from 'react';
import { SessionMemory } from '../types';

interface SessionMemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  memory: SessionMemory | null;
}

const MemorySection: React.FC<{ title: string; items: string[] }> = ({ title, items }) => (
  <div>
    <h4 className="font-semibold text-lg mb-2 text-amber-400">{title}</h4>
    {items && items.length > 0 ? (
      <ul className="list-disc list-inside space-y-1 text-gray-300">
        {items.map((item, index) => <li key={index}>{item}</li>)}
      </ul>
    ) : (
      <p className="text-sm text-gray-500 italic">No key points identified yet.</p>
    )}
  </div>
);

const SessionMemoryModal: React.FC<SessionMemoryModalProps> = ({ isOpen, onClose, memory }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-70 z-40 flex items-center justify-center p-4"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div 
        className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <header className="p-4 border-b border-gray-700 flex justify-between items-center sticky top-0 bg-gray-900 rounded-t-2xl">
          <h3 className="text-xl font-bold text-amber-500">Aura's Session Memory</h3>
          <button onClick={onClose} className="text-gray-400 hover:bg-gray-700 rounded-full p-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>
        <main className="p-6 overflow-y-auto space-y-6">
          <p className="text-sm text-gray-400 mb-4">This is a summary of the key points Aura has understood from your conversation. This memory can be updated to ensure context is maintained.</p>
          {memory ? (
            <>
              <MemorySection title="About You" items={memory.userProfile} />
              <MemorySection title="About Your Partner" items={memory.partnerProfile} />
              <MemorySection title="Relationship Strengths" items={memory.relationshipStrengths} />
              <MemorySection title="Relationship Challenges" items={memory.relationshipChallenges} />
              <MemorySection title="Key Events & Topics" items={memory.keyEvents} />
            </>
          ) : (
             <div className="text-center py-8">
                <p className="text-gray-300">The session memory is currently empty.</p>
                <p className="text-sm text-gray-500 mt-2">As you chat with Aura, you can update the memory to keep track of important details.</p>
             </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default SessionMemoryModal;