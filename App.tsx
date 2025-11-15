

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Chat, Content } from '@google/genai';
import { ChatMessage, Message, MessageRole, VisualizationData, MessageMode, Session } from './types';
import { createChatSession, generateSpeech, updateMemory } from './services/geminiService';
import ChatMessageComponent from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import RelationshipVisualizer from './components/RelationshipVisualizer';
import SessionMemoryModal from './components/SessionMemoryModal';
import Sidebar from './components/Sidebar';
import PromptLibrary from './components/PromptLibrary';

const SESSIONS_STORAGE_KEY = 'aura-sessions';
const TTS_ENABLED_KEY = 'aura-tts-enabled';

// Audio decoding helpers
const decode = (base64: string): Uint8Array => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

const decodeAudioData = async (
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
): Promise<AudioBuffer> => {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < frameCount; i++) {
            channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
        }
    }
    return buffer;
}


const FullScreenLoader: React.FC = () => (
    <div className="flex items-center justify-center h-screen bg-black">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-amber-500">Preparing Aura...</h2>
        <p className="text-gray-400 mt-2">Loading your conversation history.</p>
      </div>
    </div>
  );

const getFriendlyErrorMessage = (error: unknown, context: string = 'operation'): string => {
    console.error(`Aura encountered an error during: ${context}`, error); 

    if (typeof error === 'object' && error !== null && 'message' in error) {
        const message = (error as { message: string }).message;
        if (message.includes('SAFETY')) {
            return "I am unable to respond to that request as it may have violated the safety policies. Please try rephrasing your message to be less sensitive, or approach the topic from a different angle.";
        }
        if (message.includes('API key not valid')) {
             return "There's an issue with the application's configuration (invalid API key). Please ensure the application is set up correctly by the developer.";
        }
        if (message.includes('API_KEY')) {
            return "The application is not configured correctly; the API key is missing. Please ensure the application is set up correctly by the developer.";
        }
        if (message.includes('timed out')) {
            return "The request took too long to complete. This could be a temporary network issue or a problem with the service. Please try again in a moment.";
        }
    }
    
    if (error instanceof Error) {
        const message = error.message.toLowerCase();
        if (message.includes('failed to fetch') || message.includes('network request failed')) {
            return "It seems there's a problem with your network connection. Please check that you are connected to the internet and try again.";
        }
        if (error.toString().includes('[GoogleGenerativeAI Error]')) {
            return "I encountered an issue communicating with my core systems. This might be a temporary hiccup. Please try your request again in a moment.";
        }
    }
    
    return "I apologize, but I encountered an unexpected issue. It might be a temporary problem with the service. Please try your request again in a moment. If the problem continues, starting a new session may resolve it.";
};

const App: React.FC = () => {
  const [allSessions, setAllSessions] = useState<Record<string, Session>>({});
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [chatSession, setChatSession] = useState<Chat | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [initializationError, setInitializationError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [isTtsEnabled, setIsTtsEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem(TTS_ENABLED_KEY);
    return saved ? JSON.parse(saved) : true;
  });
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const [isMemoryModalOpen, setIsMemoryModalOpen] = useState(false);
  const [isUpdatingMemory, setIsUpdatingMemory] = useState(false);

  const activeSession = activeSessionId ? allSessions[activeSessionId] : null;

  useEffect(() => {
    localStorage.setItem(TTS_ENABLED_KEY, JSON.stringify(isTtsEnabled));
  }, [isTtsEnabled]);

  // FIX: Moved speakText and its dependency playAudio before handleNewSession to fix "used before declaration" error.
  const playAudio = useCallback(async (base64Audio: string) => {
    if (!audioContextRef.current) {
        try {
             audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        } catch(e) {
            console.error("Web Audio API is not supported in this browser.", e);
            setIsTtsEnabled(false);
            return;
        }
    }
    const ctx = audioContextRef.current;
    setIsSpeaking(true);
    try {
        const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        source.start();
        source.onended = () => {
            setIsSpeaking(false);
        };
    } catch (error) {
        console.error("Failed to decode or play audio:", error);
        setIsSpeaking(false);
    }
  }, []);
  
  const speakText = useCallback(async (text: string) => {
    if (!isTtsEnabled || isSpeaking || !text.trim()) return;
    const cleanText = text.replace(/[*#`]/g, '').replace(/\[.*?\]/g, ''); 
    
    try {
        const audioData = await generateSpeech(cleanText);
        if (audioData) {
            await playAudio(audioData);
        }
    } catch (error) {
        console.error("Error in speakText flow:", error);
    }
  }, [isTtsEnabled, isSpeaking, playAudio]);

  const handleNewSession = useCallback(async () => {
        setIsLoading(true);
        const newSessionId = `session_${Date.now()}`;
        const newChatInstance = createChatSession();

        const newSession: Session = {
            id: newSessionId,
            title: 'New Session',
            history: [],
            sessionMemory: null,
            lastModified: Date.now(),
        };

        setAllSessions(prev => ({ ...prev, [newSessionId]: newSession }));
        setActiveSessionId(newSessionId);
        setChatSession(newChatInstance);
        
        const modelPlaceholder: ChatMessage = { type: 'chat', role: MessageRole.MODEL, content: "" };
        
        setAllSessions(prev => {
            const sessions = { ...prev };
            sessions[newSessionId].history = [modelPlaceholder];
            return sessions;
        });

        try {
            const stream = await newChatInstance.sendMessageStream({ message: "Introduce yourself briefly as Aura, a relationship counselor, and ask how you can help today." });
            
            let accumulatedText = "";
            for await (const chunk of stream) {
                const text = chunk.text;
                if (text) {
                    accumulatedText += text;
                    setAllSessions(prev => {
                        const updatedSession = { ...prev[newSessionId] };
                        const newHistory = [...updatedSession.history];
                        const messageToUpdate = newHistory[0];
                        if (messageToUpdate?.type === 'chat') {
                            messageToUpdate.content = accumulatedText;
                            updatedSession.history = newHistory;
                            updatedSession.lastModified = Date.now();
                            return { ...prev, [newSessionId]: updatedSession };
                        }
                        return prev;
                    });
                }
            }
            await speakText(accumulatedText);
        } catch (error) {
            const friendlyError = getFriendlyErrorMessage(error, 'session creation');
            setAllSessions(prev => {
                const updatedSession = { ...prev[newSessionId] };
                updatedSession.history = [{ type: 'chat', role: MessageRole.MODEL, content: friendlyError }];
                return { ...prev, [newSessionId]: updatedSession };
            });
        } finally {
            setIsLoading(false);
        }
  }, [speakText]);

  useEffect(() => {
    const loadSessions = () => {
        const savedSessionsRaw = localStorage.getItem(SESSIONS_STORAGE_KEY);
        if (savedSessionsRaw) {
          try {
            const savedSessions: Record<string, Session> = JSON.parse(savedSessionsRaw);
            if (Object.keys(savedSessions).length > 0) {
              setAllSessions(savedSessions);
              const mostRecentSessionId = Object.values(savedSessions)
                  .sort((a, b) => b.lastModified - a.lastModified)[0]?.id;
              if (mostRecentSessionId) {
                  setActiveSessionId(mostRecentSessionId);
              } else {
                 handleNewSession();
              }
            } else {
                handleNewSession();
            }
          } catch (error) {
            const friendlyError = getFriendlyErrorMessage(error, 'session restoration');
            setInitializationError(`Could not restore your previous sessions. ${friendlyError}`);
            localStorage.removeItem(SESSIONS_STORAGE_KEY);
          }
        } else {
            handleNewSession();
        }
        setIsInitializing(false);
    }
    loadSessions();
  }, [handleNewSession]);

  useEffect(() => {
    if (!isInitializing && Object.keys(allSessions).length > 0) {
      localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(allSessions));
    } else if (!isInitializing && Object.keys(allSessions).length === 0) {
        localStorage.removeItem(SESSIONS_STORAGE_KEY);
    }
  }, [allSessions, isInitializing]);

  useEffect(() => {
    if (activeSession) {
      const chatHistoryForGemini = activeSession.history
        .filter((msg): msg is ChatMessage => msg.type === 'chat')
        .map(msg => ({
          role: msg.role,
          parts: [{ text: msg.content }],
        }));
      
      const session = createChatSession(chatHistoryForGemini);
      setChatSession(session);
    } else {
      setChatSession(null);
    }
  }, [activeSessionId, allSessions]);


  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeSession?.history]);

  const processStream = useCallback(async (stream: AsyncGenerator<any>, placeholderIndex: number): Promise<string> => {
    let accumulatedText = "";
    for await (const chunk of stream) {
        const text = chunk.text;
        if(text && activeSessionId) {
            accumulatedText += text;
            setAllSessions(prev => {
                const updatedSession = { ...prev[activeSessionId] };
                const newHistory = [...updatedSession.history];
                const messageToUpdate = newHistory[placeholderIndex];
                if (messageToUpdate?.type === 'chat') {
                    messageToUpdate.content = accumulatedText;
                    updatedSession.history = newHistory;
                    updatedSession.lastModified = Date.now();
                    return { ...prev, [activeSessionId]: updatedSession };
                }
                return prev;
            });
        }
    }
    return accumulatedText;
  }, [activeSessionId]);
  
  const updateActiveSession = useCallback((updater: (session: Session) => Session) => {
    if (!activeSessionId) return;
    setAllSessions(prev => ({
      ...prev,
      [activeSessionId]: updater(prev[activeSessionId]),
    }));
  }, [activeSessionId]);
  
  const handleSelectSession = (id: string) => {
    if (id !== activeSessionId) {
        setActiveSessionId(id);
    }
  };

  const handleDeleteSession = (id: string) => {
    const sessionsCopy = { ...allSessions };
    delete sessionsCopy[id];
    setAllSessions(sessionsCopy);
    
    if (activeSessionId === id) {
        const remainingSessions = (Object.values(sessionsCopy) as Session[]).filter(s => s.id !== id);
        if (remainingSessions.length > 0) {
             const mostRecent = remainingSessions.sort((a, b) => b.lastModified - a.lastModified)[0];
             setActiveSessionId(mostRecent.id);
        } else {
            setActiveSessionId(null);
            handleNewSession();
        }
    }
  };

  const handleSendMessage = async (message: string, mode: MessageMode = 'chat') => {
    if (!chatSession || !activeSessionId || !activeSession) return;

    let sessionTitle = activeSession.title;
    if (sessionTitle === 'New Session' && activeSession.history.length <= 1) { // <=1 to account for intro message
        sessionTitle = message.substring(0, 40).trim() + (message.length > 40 ? '...' : '');
    }

    const userMessage: ChatMessage = { type: 'chat', role: MessageRole.USER, content: message };
    const modelPlaceholder: ChatMessage = { type: 'chat', role: MessageRole.MODEL, content: "" };
    
    const placeholderIndex = activeSession.history.length + 1;
    
    updateActiveSession(session => ({
        ...session,
        title: sessionTitle,
        history: [...session.history, userMessage, modelPlaceholder],
        lastModified: Date.now()
    }));
    
    setIsLoading(true);

    let prompt = message;
    if (mode === 'actionPlan') {
      prompt = `[ACTIONABLE ADVICE REQUEST]\nBased on my request, provide a clear, structured, step-by-step action plan. Use lists, bolding, and clear headings to make the guidance easy to follow. Here is my request:\n\n"${message}"`;
    } else if (mode === 'realityCheck') {
      prompt = `[REALITY CHECK REQUEST]...`; // (content omitted for brevity)
    }
        
    try {
      const stream = await chatSession.sendMessageStream({ message: prompt });
      const accumulatedText = await processStream(stream, placeholderIndex);
      await speakText(accumulatedText);
    } catch (error)      {
      const friendlyError = getFriendlyErrorMessage(error, 'send message');
      updateActiveSession(session => {
          const newHistory = [...session.history];
          newHistory[newHistory.length - 1] = { type: 'chat', role: MessageRole.MODEL, content: friendlyError };
          return { ...session, history: newHistory };
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAnalyzeConflicts = async () => {
    if (!chatSession || !activeSessionId) return;

    const metaMessage: Message = { type: 'meta', content: 'Analyzing recurring conflict patterns...' };
    const modelPlaceholder: ChatMessage = { type: 'chat', role: MessageRole.MODEL, content: "" };
    
    const placeholderIndex = (activeSession?.history.length ?? 0) + 1;
    updateActiveSession(s => ({...s, history: [...s.history, metaMessage, modelPlaceholder]}));
    setIsLoading(true);

    try {
        const prompt = `[CONFLICT ANALYSIS REQUEST]...`; // (content omitted for brevity)
        const stream = await chatSession.sendMessageStream({ message: prompt });
        const accumulatedText = await processStream(stream, placeholderIndex);
        await speakText(accumulatedText);
    } catch (error) {
        const friendlyError = getFriendlyErrorMessage(error, 'conflict analysis');
        updateActiveSession(s => {
            const newHistory = [...s.history];
            newHistory[newHistory.length-1] = {type: 'chat', role: MessageRole.MODEL, content: friendlyError};
            return {...s, history: newHistory};
        });
    } finally {
        setIsLoading(false);
    }
  };

  const handleVisualizeDynamics = async () => {
    if (!chatSession || !activeSessionId) return;

    const metaMessage: Message = { type: 'meta', content: 'Generating relationship dynamics visualization...' };
    const modelPlaceholder: ChatMessage = { type: 'chat', role: MessageRole.MODEL, content: "" };
    
    const placeholderIndex = (activeSession?.history.length ?? 0) + 1;
    updateActiveSession(s => ({...s, history: [...s.history, metaMessage, modelPlaceholder]}));
    setIsLoading(true);

    try {
        const visualizationSchema = { /* ... */ }; // (schema omitted for brevity)
        const prompt = `[VISUALIZATION REQUEST]...`; // (prompt omitted for brevity)

        const stream = await chatSession.sendMessageStream({ 
            message: prompt,
            generationConfig: {
                responseMimeType: 'application/json',
                responseSchema: visualizationSchema,
            }
        });
        const modelResponse = await processStream(stream, placeholderIndex);
        
        let jsonData: VisualizationData | null = null;
        try {
            jsonData = JSON.parse(modelResponse);
        } catch (error) {
            console.error("Aura Error: Failed to parse JSON response from model.", error);
        }

        updateActiveSession(s => {
            const newHistory = [...s.history];
            if (jsonData) {
                newHistory[placeholderIndex] = { type: 'visualization', data: jsonData };
            } else {
                 const fallbackText = "I'm sorry, I wasn't able to generate the visualization. There might not be enough conversation history, or there was an issue with the analysis. Let's talk more and we can try again.";
                newHistory[placeholderIndex] = { type: 'chat', role: MessageRole.MODEL, content: fallbackText };
                speakText(fallbackText);
            }
            return {...s, history: newHistory};
        });

    } catch (error) {
        const friendlyError = getFriendlyErrorMessage(error, 'dynamics visualization');
        updateActiveSession(s => {
            const newHistory = [...s.history];
            newHistory[newHistory.length - 1] = { type: 'chat', role: MessageRole.MODEL, content: friendlyError };
            return {...s, history: newHistory};
        });
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleUpdateMemory = async () => {
    if (!chatSession || isUpdatingMemory || !activeSessionId || !activeSession) return;

    const metaMessage: Message = { type: 'meta', content: 'Updating session memory...' };
    updateActiveSession(s => ({...s, history: [...s.history, metaMessage]}));
    setIsUpdatingMemory(true);

    try {
        const chatHistoryForGemini = activeSession.history
            .filter((msg): msg is ChatMessage => msg.type === 'chat')
            .map(msg => ({
                role: msg.role,
                parts: [{ text: msg.content }],
            }));
        
        const newMemory = await updateMemory(chatHistoryForGemini, activeSession.sessionMemory);
        
        if (newMemory) {
            updateActiveSession(s => {
                const newHistory = [...s.history];
                const lastMessage = newHistory[newHistory.length-1];
                if (lastMessage.type === 'meta') {
                    lastMessage.content = '✅ Session memory updated.';
                }
                return {...s, sessionMemory: newMemory, history: newHistory};
            });
        } else {
             updateActiveSession(s => {
                const newHistory = [...s.history];
                const lastMessage = newHistory[newHistory.length-1];
                if (lastMessage.type === 'meta') {
                    lastMessage.content = '⚠️ Could not update session memory.';
                }
                return {...s, history: newHistory};
            });
        }
    } catch (error) {
        console.error("Aura Error: Failed to update session memory.", error);
        const friendlyError = getFriendlyErrorMessage(error, 'session memory update');
        const errorMessage: ChatMessage = { type: 'chat', role: MessageRole.MODEL, content: `Error updating memory: ${friendlyError}` };
        updateActiveSession(s => ({...s, history: [...s.history.slice(0,-1), errorMessage]}));
    } finally {
        setIsUpdatingMemory(false);
    }
  };

  const handleToggleTts = useCallback(() => {
    setIsTtsEnabled(prev => !prev);
  }, []);
  
  const renderChatHistory = () => (
    <>
        {activeSession?.history.map((msg, index) => {
            if (msg.type === 'meta') {
                return (
                    <div key={index} className="flex justify-center my-4">
                        <span className="text-xs text-gray-500 px-3 py-1 bg-gray-900 rounded-full">{msg.content}</span>
                    </div>
                )
            }
            if (msg.type === 'visualization') {
                return <RelationshipVisualizer key={index} data={msg.data} />
            }
            const showLoadingSpinner = isLoading && index === (activeSession?.history.length ?? 0) - 1 && msg.role === MessageRole.MODEL && msg.content === "";
            return <ChatMessageComponent key={index} message={msg} isLoading={showLoadingSpinner} />;
        })}
        <div ref={chatEndRef} />
    </>
  );

  if (isInitializing) {
    return <FullScreenLoader />;
  }

  if (initializationError) {
    return (
        <div className="flex items-center justify-center h-screen bg-black">
          <div className="text-center p-8 bg-gray-900 rounded-lg shadow-lg max-w-md mx-4 border border-red-500">
            <h2 className="text-xl font-bold text-red-500">Session Error</h2>
            <p className="text-gray-300 mt-2 mb-4">{initializationError}</p>
            <button
                onClick={() => {
                    setInitializationError(null);
                    handleNewSession();
                }}
                className="bg-amber-600 text-white font-bold py-2 px-6 rounded-full hover:bg-amber-700 transition-colors"
            >
                Start a New Session
            </button>
          </div>
        </div>
    );
  }

  return (
    <div className="flex h-screen bg-black text-gray-300 font-sans">
      <Sidebar
        sessions={Object.values(allSessions)}
        activeSessionId={activeSessionId}
        onNewSession={handleNewSession}
        onSelectSession={handleSelectSession}
        onDeleteSession={handleDeleteSession}
      />
      <div className="flex flex-1 min-w-0">
         {/* Left Panel: Chat */}
         <div className="flex flex-col flex-1 h-screen lg:w-3/5 xl:w-2/3">
            <header className="relative bg-black shadow-md p-4 text-center z-10 flex justify-center items-center border-b border-gray-800">
                <div>
                    <h1 className="text-2xl font-bold text-amber-500">Aura</h1>
                    <p className="text-sm text-gray-500">Your AI Relationship Counselor</p>
                </div>
                {activeSession && (
                    <div className="absolute top-1/2 right-4 -translate-y-1/2 flex items-center space-x-2">
                        <button
                            onClick={() => setIsMemoryModalOpen(true)}
                            className="text-gray-400 p-2 rounded-full hover:bg-gray-800 transition-colors"
                            aria-label="View session memory"
                            title="View session memory"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                            </svg>
                        </button>
                        <button
                            onClick={() => setIsTtsEnabled(prev => !prev)}
                            className={`text-gray-400 p-2 rounded-full hover:bg-gray-800 transition-colors ${isTtsEnabled ? 'text-amber-500' : ''} ${isSpeaking ? 'animate-pulse' : ''}`}
                            aria-label="Toggle voice responses"
                            title="Toggle voice responses"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                {isTtsEnabled ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.083A9.041 9.041 0 0119.5 12c0 2.22-.785 4.246-2.101 5.862m-2.778-2.778a4.996 4.996 0 00-7.072-7.072M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                )}
                            </svg>
                        </button>
                    </div>
                )}
            </header>
            
            <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
                {activeSession ? renderChatHistory() : (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-gray-500">Select a session or start a new one.</p>
                    </div>
                )}
            </main>

            {activeSession && (
                <footer className="bg-black p-4 border-t border-gray-800">
                <ChatInput
                    onSubmit={handleSendMessage}
                    onAnalyzeConflicts={handleAnalyzeConflicts}
                    onVisualize={handleVisualizeDynamics}
                    onUpdateMemory={handleUpdateMemory}
                    onToggleTts={handleToggleTts}
                    isLoading={isLoading || isUpdatingMemory}
                    isUpdatingMemory={isUpdatingMemory}
                    isAnalysisEnabled={(activeSession?.history.filter(msg => msg.type === 'chat').length ?? 0) >= 4}
                />
                </footer>
            )}
        </div>
         {/* Right Panel: Prompt Library */}
        <div className="hidden lg:block lg:w-2/5 xl:w-1/3 h-screen overflow-y-auto border-l border-gray-800">
            <PromptLibrary />
        </div>
      </div>
      <SessionMemoryModal 
        isOpen={isMemoryModalOpen}
        onClose={() => setIsMemoryModalOpen(false)}
        memory={activeSession?.sessionMemory ?? null}
      />
    </div>
  );
};

export default App;