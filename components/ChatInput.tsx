

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MessageMode } from '../types';

// Fix: Add type definitions for the Web Speech API to fix TypeScript errors.
// This provides types for SpeechRecognition and related events which are not
// included in default DOM typings.
interface SpeechRecognitionAlternative {
    readonly transcript: string;
}

interface SpeechRecognitionResult {
    readonly isFinal: boolean;
    readonly length: number;
    item(index: number): SpeechRecognitionAlternative;
    [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionResultList {
    readonly length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
    readonly resultIndex: number;
    readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
    readonly error: string;
}

interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start(): void;
    stop(): void;
    onstart: (() => void) | null;
    onend: (() => void) | null;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
}

interface SpeechRecognitionStatic {
    new (): SpeechRecognition;
}

interface ChatInputProps {
  onSubmit: (message: string, mode: MessageMode) => void;
  onAnalyzeConflicts: () => void;
  onVisualize: () => void;
  onUpdateMemory: () => void;
  onToggleTts: () => void;
  isLoading: boolean;
  isUpdatingMemory: boolean;
  isAnalysisEnabled: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSubmit, onAnalyzeConflicts, onVisualize, onUpdateMemory, onToggleTts, isLoading, isUpdatingMemory, isAnalysisEnabled }) => {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const initialTextRef = useRef('');
  const [recognizedCommand, setRecognizedCommand] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string>('');

  const showFeedback = (command: string, message?: string) => {
    setRecognizedCommand(command);
    if (message) {
      setFeedbackMessage(message);
    }
    setTimeout(() => {
      setRecognizedCommand(null);
      setFeedbackMessage('');
    }, 1500);
  };

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim() && !isLoading) {
      onSubmit(value.trim(), 'chat');
      setValue('');
    }
  }, [value, isLoading, onSubmit]);


  useEffect(() => {
    // Fix: Use a typed variable for SpeechRecognition constructor and access it from `window` as `any` to avoid TypeScript errors.
    // For Safari and older Chrome
    const SpeechRecognition: SpeechRecognitionStatic | undefined = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
        console.warn("Speech Recognition API is not supported in this browser.");
        return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
        initialTextRef.current = value;
    };
    
    recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
                finalTranscript += transcript;
            } else {
                interimTranscript += transcript;
            }
        }
        
        const commandTranscript = finalTranscript.toLowerCase().trim();
        const triggerPhrase = 'aura';

        if (commandTranscript.startsWith(triggerPhrase)) {
            const command = commandTranscript.substring(triggerPhrase.length).trim();
            let commandHandled = false;

            if (command.includes('analyze')) {
                onAnalyzeConflicts(); showFeedback('analyze'); commandHandled = true;
            } else if (command.includes('visualize')) {
                onVisualize(); showFeedback('visualize'); commandHandled = true;
            } else if (command.includes('update memory')) {
                onUpdateMemory(); showFeedback('update'); commandHandled = true;
            } else if (command.includes('toggle voice') || command.includes('toggle sound')) {
                onToggleTts(); showFeedback('tts', 'Voice Toggled'); commandHandled = true;
            } else if (command.includes('send') || command.includes('submit')) {
                if(value.trim()) {
                    handleSubmit({ preventDefault: () => {} } as React.FormEvent);
                    showFeedback('send');
                }
                commandHandled = true;
            }

            if (commandHandled) {
                if (recognitionRef.current) {
                    recognitionRef.current.stop();
                }
                return;
            }
        }

        const baseText = initialTextRef.current;
        const separator = baseText === '' || baseText.endsWith(' ') ? '' : ' ';
        
        setValue(baseText + separator + finalTranscript.trim() + ' ' + interimTranscript);
    };
    
    recognition.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
    };

    recognition.onend = () => {
        setIsListening(false);
    };

    recognitionRef.current = recognition;
    
    return () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
    };

  }, [value, handleSubmit, onAnalyzeConflicts, onVisualize, onUpdateMemory, onToggleTts]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value]);

  const handleToggleListening = () => {
      if (isLoading || !recognitionRef.current) return;

      if (isListening) {
          recognitionRef.current.stop();
      } else {
          recognitionRef.current.start();
      }
      setIsListening(!isListening);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit(e);
    }
  }

  const handleActionPlanClick = () => {
     if (value.trim() && !isLoading) {
      onSubmit(value.trim(), 'actionPlan');
      setValue('');
    }
  }

  const handleRealityCheckClick = () => {
    if (value.trim() && !isLoading) {
     onSubmit(value.trim(), 'realityCheck');
     setValue('');
   }
 }

 const getButtonClasses = (commandName: string) => {
    const baseClasses = "text-gray-400 rounded-full p-3 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200";
    if (recognizedCommand === commandName) {
      return `${baseClasses} bg-green-900 ring-2 ring-green-500`;
    }
    return baseClasses;
  };

  return (
    <form onSubmit={handleSubmit} className="relative flex items-end space-x-2 md:space-x-3">
       {feedbackMessage && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1 bg-gray-200 text-black text-sm font-semibold rounded-md shadow-lg animate-pulse">
          {feedbackMessage}
        </div>
      )}
      <button
        type="button"
        onClick={onUpdateMemory}
        disabled={isLoading || !isAnalysisEnabled}
        className={getButtonClasses('update')}
        aria-label="Update Session Memory"
        title="Update Session Memory (enabled after a few turns)"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${isUpdatingMemory ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 12a8 8 0 018-8 8 8 0 018 8m-1.2 3.8A8 8 0 0112 20a8 8 0 01-8-8" />
        </svg>
      </button>
       <button
        type="button"
        onClick={onAnalyzeConflicts}
        disabled={isLoading || !isAnalysisEnabled}
        className={getButtonClasses('analyze')}
        aria-label="Analyze Conflict Patterns"
        title="Analyze Conflict Patterns (enabled after a few turns)"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </button>
      <button
        type="button"
        onClick={onVisualize}
        disabled={isLoading || !isAnalysisEnabled}
        className={getButtonClasses('visualize')}
        aria-label="Visualize Dynamics"
        title="Visualize Dynamics (enabled after a few turns)"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
      </button>
       <button
        type="button"
        onClick={handleActionPlanClick}
        disabled={isLoading || !value.trim()}
        className={getButtonClasses('action_plan')}
        aria-label="Get Action Plan"
        title="Get Action Plan"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.375 3.375 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      </button>
      <button
        type="button"
        onClick={handleRealityCheckClick}
        disabled={isLoading || !value.trim()}
        className={`${getButtonClasses('reality_check')} hidden sm:block`}
        aria-label="Get a Reality Check"
        title="Get a Reality Check"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      </button>
      <div className="relative w-full">
        <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type or speak your message here..."
            rows={1}
            className="w-full p-3 pr-12 border border-gray-700 rounded-xl resize-none focus:ring-2 focus:ring-amber-500 focus:outline-none bg-gray-800 text-white transition-all duration-200 max-h-40"
            disabled={isLoading}
        />
        <button
            type="button"
            onClick={handleToggleListening}
            disabled={isLoading}
            className={`absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-2 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 ${isListening ? 'bg-red-500 text-white hover:bg-red-600 ring-4 ring-red-300 dark:ring-red-700 animate-pulse' : 'text-gray-400'}`}
            aria-label={isListening ? 'Stop listening' : 'Start listening'}
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-14 0m7 10v1m-7-3a7 7 0 0014 0M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
            </svg>
        </button>
      </div>
      <button
        type="submit"
        disabled={isLoading || !value.trim()}
        className={`text-white rounded-full p-3 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black disabled:cursor-not-allowed transition-all duration-200 ${recognizedCommand === 'send' ? 'bg-green-600 hover:bg-green-700 ring-2 ring-green-500' : 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500 disabled:bg-amber-800'}`}
        aria-label="Send Message"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 transform rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
      </button>
    </form>
  );
};

export default ChatInput;