import React, { useEffect, useRef, useState } from 'react';
import useChatStore from '../store/chatStore';
import ReactMarkdown from 'react-markdown';
import { User, Bot, Sparkles, Volume2, StopCircle, FileText, ChevronDown } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion, AnimatePresence } from 'framer-motion';

export default function ChatArea() {
    const {
        activeChatId,
        messages,
        isLoading,
        isSending,
        setActiveChat,
        setAudioPlaying,
        isVoiceMode,
        showCitations,
        selectedModel,
        setModel
    } = useChatStore();

    const messagesEndRef = useRef(null);
    const audioRef = useRef(null);
    const [playingMessageId, setPlayingMessageId] = useState(null);
    const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
    const lastPlayedMessageIdRef = useRef(null);

    // ... (scrollToBottom, useEffects) ...

    const availableModels = [
        { id: 'gemma3:1b', name: 'Gemma 3 (1B)', description: 'Fast & Efficient' },
        { id: 'qwen3:4b', name: 'Qwen 3 (4B)', description: 'Balanced Performance' }
    ];

    return (
        <div className="flex-1 flex flex-col bg-gray-950 h-full overflow-hidden relative">

            {/* Model Selector - Floating Header */}
            <div className="absolute top-4 right-4 z-40">
                <div className="relative">
                    <button
                        onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                        className="flex items-center gap-2 bg-gray-900/80 backdrop-blur-md border border-white/10 hover:border-blue-500/50 text-gray-200 px-4 py-2 rounded-xl text-xs font-medium transition-all shadow-lg hover:shadow-blue-500/10"
                    >
                        <div className={`w-2 h-2 rounded-full ${selectedModel.includes('gemma') ? 'bg-orange-400' : 'bg-green-400'}`} />
                        <span>{availableModels.find(m => m.id === selectedModel)?.name || selectedModel}</span>
                        <ChevronDown size={14} className={`text-gray-500 transition-transform ${isModelDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                        {isModelDropdownOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                                className="absolute right-0 top-full mt-2 w-56 bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden"
                            >
                                <div className="p-1">
                                    {availableModels.map((model) => (
                                        <button
                                            key={model.id}
                                            onClick={() => {
                                                setModel(model.id);
                                                setIsModelDropdownOpen(false);
                                            }}
                                            className={twMerge(
                                                "w-full text-left px-3 py-2.5 rounded-lg text-xs transition-colors flex flex-col gap-0.5",
                                                selectedModel === model.id
                                                    ? "bg-blue-600/10 text-blue-400"
                                                    : "text-gray-300 hover:bg-gray-800"
                                            )}
                                        >
                                            <span className="font-semibold">{model.name}</span>
                                            <span className="text-[10px] text-gray-500">{model.description}</span>
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
                {messages.map((msg, index) => (
                    <motion.div
                        key={msg.id || index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className={twMerge(
                            "flex w-full gap-4 max-w-4xl mx-auto",
                            msg.role === 'user' ? "justify-end" : "justify-start"
                        )}
                    >
                        {/* Assistant Avatar */}
                        {msg.role === 'assistant' && (
                            <div className="w-8 h-8 rounded-full bg-teal-600/20 flex items-center justify-center text-teal-400 mt-1 shrink-0 border border-teal-500/30">
                                <Bot size={18} />
                            </div>
                        )}

                        <div className={twMerge(
                            "relative flex flex-col max-w-[85%] shadow-md text-sm leading-relaxed",
                            msg.role === 'user' ? "items-end" : "items-start"
                        )}>
                            <div
                                className={twMerge(
                                    "px-5 py-3.5",
                                    msg.role === 'user'
                                        ? "bg-blue-600 text-white rounded-2xl rounded-tr-sm"
                                        : "bg-gray-900/50 text-gray-200 rounded-2xl rounded-tl-sm border border-white/5"
                                )}
                            >
                                {msg.role === 'assistant' ? (
                                    <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-gray-800 prose-pre:border prose-pre:border-white/10">
                                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                                        {/* Sources */}
                                        {msg.sources && msg.sources.length > 0 && showCitations && (
                                            <div className="mt-4 pt-3 border-t border-white/10">
                                                <div className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-2">Sources</div>
                                                <div className="flex flex-wrap gap-2">
                                                    {msg.sources.map((source, idx) => (
                                                        <button
                                                            key={idx}
                                                            onClick={() => alert(`Source: ${source}`)}
                                                            className="flex items-center gap-1.5 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-2.5 py-1 rounded-md border border-gray-700 transition-colors"
                                                            title="Click to view source info"
                                                        >
                                                            <FileText size={12} className="text-blue-400" />
                                                            <span className="truncate max-w-[150px]">{source}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <p className="whitespace-pre-wrap">{msg.content}</p>
                                )}
                            </div>

                            {/* Audio Player Control */}
                            {msg.role === 'assistant' && msg.audio_url && (
                                <button
                                    onClick={() => handleAudioToggle(msg)}
                                    className="mt-2 flex items-center gap-2 text-xs text-gray-400 hover:text-teal-400 transition-colors bg-gray-900/40 px-3 py-1.5 rounded-full border border-white/10 hover:border-teal-500/30"
                                >
                                    {playingMessageId === msg.id ? (
                                        <>
                                            <StopCircle size={14} className="animate-pulse text-teal-400" />
                                            <span className="text-teal-400 font-medium">Playing...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Volume2 size={14} />
                                            <span>Play Response</span>
                                        </>
                                    )}
                                </button>
                            )}
                        </div>

                        {/* User Avatar */}
                        {msg.role === 'user' && (
                            <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-400 mt-1 shrink-0 border border-blue-500/30">
                                <User size={18} />
                            </div>
                        )}
                    </motion.div>
                ))}


                {messages.length === 0 && !isLoading && !isSending && (
                    <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-50 animate-fade-in mt-20">
                        <div className="p-4 bg-gray-900 rounded-full mb-4">
                            <Bot size={48} className="text-gray-600" />
                        </div>
                        <p className="text-lg font-medium">No messages yet</p>
                        <p className="text-sm">Type a message below to start the conversation.</p>
                    </div>
                )}

                {/* Loading Indicator */}
                {(isSending || isLoading) && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex w-full gap-4 max-w-4xl mx-auto justify-start"
                    >
                        <div className="w-8 h-8 rounded-full bg-teal-600/20 flex items-center justify-center text-teal-400 mt-1 shrink-0 border border-teal-500/30">
                            <Bot size={18} />
                        </div>
                        <div className="bg-gray-900/50 px-5 py-4 rounded-2xl rounded-tl-sm border border-white/5 flex items-center gap-1.5">
                            <motion.div
                                animate={{ y: [0, -5, 0] }}
                                transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut", delay: 0 }}
                                className="w-2 h-2 bg-gray-400 rounded-full"
                            />
                            <motion.div
                                animate={{ y: [0, -5, 0] }}
                                transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                                className="w-2 h-2 bg-gray-400 rounded-full"
                            />
                            <motion.div
                                animate={{ y: [0, -5, 0] }}
                                transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
                                className="w-2 h-2 bg-gray-400 rounded-full"
                            />
                        </div>
                    </motion.div>
                )}

                <div ref={messagesEndRef} />
            </div>
        </div>
    );
}
