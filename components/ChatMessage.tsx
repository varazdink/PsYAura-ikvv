import React from 'react';
import { marked } from 'marked';
import { ChatMessage, MessageRole } from '../types';

interface LoadingSpinnerProps {
    className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ className = '' }) => (
    <div className={`flex space-x-1 ${className}`}>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
    </div>
);

interface ChatMessageProps {
  message: ChatMessage;
  isLoading?: boolean;
}

const ChatMessageComponent: React.FC<ChatMessageProps> = ({ message, isLoading = false }) => {
  const isUser = message.role === MessageRole.USER;

  const userStyles = 'bg-amber-600 text-white self-end rounded-br-none';
  const modelStyles = 'bg-gray-800 text-gray-300 self-start rounded-bl-none';

  const sanitizedHtml = marked(message.content || '');

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} w-full`}>
      <div className={`max-w-xl md:max-w-2xl px-4 py-3 rounded-2xl shadow-md ${isUser ? userStyles : modelStyles}`}>
        {isLoading ? (
            <LoadingSpinner />
        ) : (
            <div className="prose prose-sm prose-p:text-inherit prose-strong:text-inherit prose-headings:text-inherit prose-ul:text-inherit prose-ol:text-inherit max-w-none" dangerouslySetInnerHTML={{ __html: sanitizedHtml as string }} />
        )}
      </div>
    </div>
  );
};

export default ChatMessageComponent;