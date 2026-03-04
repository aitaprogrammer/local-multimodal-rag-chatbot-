import React, { useEffect, useState } from 'react';
import { Plus, MessageSquare, Trash2, Edit2, Check, X, Sparkles } from 'lucide-react';
import useChatStore from '../store/chatStore';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion, AnimatePresence } from 'framer-motion';

export default function Sidebar() {
    const {
        chats,
        activeChatId,
        loadChats,
        createNewChat,
        setActiveChat,
        deleteChatSession,
        renameChat,
        isSidebarOpen
    } = useChatStore();

    const [editingChatId, setEditingChatId] = useState(null);
    const [editTitle, setEditTitle] = useState("");

    useEffect(() => {
        loadChats();
    }, [loadChats]);

    const handleStartEdit = (chat, e) => {
        e.stopPropagation();
        setEditingChatId(chat.id);
        setEditTitle(chat.title);
    };

    const handleSaveEdit = async (e) => {
        e.stopPropagation();
        if (editTitle.trim()) {
            await renameChat(editingChatId, editTitle);
        }
        setEditingChatId(null);
    };

    const handleCancelEdit = (e) => {
        e.stopPropagation();
        setEditingChatId(null);
    };

    return (
        <AnimatePresence mode="wait">
            {isSidebarOpen && (
                <motion.div
                    initial={{ x: -300, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -300, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="flex flex-col h-full w-64 bg-gray-900/95 border-r border-white/10 text-gray-100 backdrop-blur-md z-30 shrink-0"
                >
                    {/* Header / New Chat */}
                    <div className="p-4">
                        <button
                            onClick={() => createNewChat()}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-medium shadow-lg hover:shadow-cyan-500/20 transition-all duration-200 transform hover:scale-[1.02] active:scale-95"
                        >
                            <Plus size={20} />
                            <span>New Chat</span>
                        </button>
                    </div>

                    {/* Chat List */}
                    <div className="flex-1 overflow-y-auto px-2 space-y-1 py-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                        <AnimatePresence initial={false}>
                            {chats.map((chat) => (
                                <motion.div
                                    key={chat.id}
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.2 }}
                                    onClick={() => setActiveChat(chat.id)}
                                    className={twMerge(
                                        "group flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer transition-colors duration-200",
                                        activeChatId === chat.id
                                            ? "bg-gray-800 text-white font-semibold shadow-sm ring-1 ring-white/10"
                                            : "text-gray-400 hover:bg-gray-800/60 hover:text-gray-200"
                                    )}
                                >
                                    <MessageSquare size={18} className={activeChatId === chat.id ? "text-blue-400" : "text-gray-500 group-hover:text-gray-400"} />

                                    {editingChatId === chat.id ? (
                                        <div className="flex-1 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                            <input
                                                autoFocus
                                                className="w-full bg-gray-700 text-white text-xs rounded px-1 py-1 outline-none border border-blue-500"
                                                value={editTitle}
                                                onChange={(e) => setEditTitle(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleSaveEdit(e);
                                                    if (e.key === 'Escape') handleCancelEdit(e);
                                                }}
                                            />
                                            <button onClick={handleSaveEdit} className="text-green-400 hover:text-green-300"><Check size={14} /></button>
                                            <button onClick={handleCancelEdit} className="text-red-400 hover:text-red-300"><X size={14} /></button>
                                        </div>
                                    ) : (
                                        <div className="flex-1 overflow-hidden">
                                            <p className="truncate text-sm font-medium text-gray-300">{chat.title || `Chat ${chat.id}`}</p>
                                        </div>
                                    )}

                                    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={(e) => handleStartEdit(chat, e)}
                                            className="p-1.5 hover:bg-blue-500/20 hover:text-blue-400 rounded-md transition-all duration-200 mr-1"
                                            title="Rename Chat"
                                        >
                                            <Edit2 size={14} />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (window.confirm("Are you sure you want to delete this chat?")) {
                                                    deleteChatSession(chat.id);
                                                }
                                            }}
                                            className="p-1.5 hover:bg-red-500/20 hover:text-red-400 rounded-md transition-all duration-200"
                                            title="Delete Chat"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {chats.length === 0 && (
                            <div className="text-center text-gray-600 text-sm mt-8 px-4">
                                No chats yet.<br />Start a new conversation!
                            </div>
                        )}
                    </div>

                    {/* Bottom Section - Logo */}
                    <div className="p-4 border-t border-white/5 bg-gray-900/30 backdrop-blur-sm">
                        <div className="flex items-center gap-3 px-2 py-1">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-400 to-blue-600 flex items-center justify-center shadow-lg shadow-teal-500/20">
                                <Sparkles size={16} className="text-white" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-100 to-gray-400">
                                    RAG Chatbot
                                </span>
                                <span className="text-[10px] text-gray-500 font-medium">
                                    Local Intelligence
                                </span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
