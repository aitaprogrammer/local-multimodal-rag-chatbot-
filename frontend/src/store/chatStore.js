import { create } from 'zustand';
import {
    getChats,
    createChat,
    deleteChat,
    getChatHistory,
    sendMessage,
    uploadDocuments,
    getDocuments,
    deleteDocument,
    updateChatTitle
} from '../lib/api';
import { toast } from 'sonner';

const useChatStore = create((set, get) => ({
    chats: [],
    activeChatId: null,
    messages: [],
    isSidebarOpen: true,
    isLoading: false,   // For fetching history
    isSending: false,   // For sending a message
    isSending: false,   // For sending a message
    isUploading: false, // For uploading a document
    includeHistory: true, // Toggle for sending chat history
    isAudioPlaying: false, // For tracking TTS playback status
    isVoiceMode: false, // Toggle for hands-free voice mode
    showCitations: true, // Toggle for displaying source citations
    selectedModel: 'gemma3:1b', // Default model

    // Actions
    toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
    toggleHistory: () => set((state) => ({ includeHistory: !state.includeHistory })),
    toggleCitations: () => set((state) => ({ showCitations: !state.showCitations })),
    setModel: (model) => set({ selectedModel: model }),
    setAudioPlaying: (isPlaying) => set({ isAudioPlaying: isPlaying }),
    setVoiceMode: (isVoice) => set({ isVoiceMode: isVoice }),

    loadChats: async () => {
        try {
            const chats = await getChats();
            set({ chats });
        } catch (error) {
            console.error('Failed to load chats:', error);
        }
    },

    createNewChat: async () => {
        try {
            const newChat = await createChat();
            set((state) => ({
                chats: [newChat, ...state.chats],
                activeChatId: newChat.id,
                messages: [],
                documents: []
            }));
            return newChat.id;
        } catch (error) {
            console.error('Failed to create chat:', error);
        }
    },

    setActiveChat: async (chatId) => {
        set({ activeChatId: chatId, isLoading: true, messages: [], documents: [] });
        try {
            const history = await getChatHistory(chatId);
            const docs = await getDocuments(chatId);
            set({ messages: history, documents: docs, isLoading: false });
        } catch (error) {
            console.error('Failed to load chat data:', error);
            set({ isLoading: false });
        }
    },

    deleteChatSession: async (chatId) => {
        try {
            await deleteChat(chatId);
            set((state) => {
                const updatedChats = state.chats.filter((c) => c.id !== chatId);
                const isActive = state.activeChatId === chatId;
                return {
                    chats: updatedChats,
                    activeChatId: isActive ? (updatedChats.length > 0 ? updatedChats[0].id : null) : state.activeChatId,
                    messages: isActive ? [] : state.messages
                };
            });
            // If we switched active chat, we might need to load its history, 
            // but simplest is to let the component trigger that or just leave it empty until selected.
            // Better: if we switched, trigger load.
            const { activeChatId, setActiveChat } = get();
            if (activeChatId) {
                // This might cause a loop if not careful, but calling the action is safer in a component. 
                // For now, let's just update state. The UI should react.
                // Actually, if we just set activeChatId, we need to fetch messages.
                // Let's manually fetch if there is a new active chat.
                const state = get();
                if (state.activeChatId) {
                    get().setActiveChat(state.activeChatId);
                }
            }

        } catch (error) {
            console.error('Failed to delete chat:', error);
        }
    },

    sendUserMessage: async (text) => {
        const { activeChatId, messages } = get();
        if (!activeChatId) return;

        // Optimistic update
        const tempId = Date.now();
        const userMsg = {
            id: tempId,
            role: 'user',
            content: text,
            timestamp: new Date().toISOString()
        };

        set({ messages: [...messages, userMsg], isSending: true });

        try {
            const { includeHistory, selectedModel } = get();
            const assistantMsg = await sendMessage(activeChatId, text, includeHistory, selectedModel);
            // Backend returns the assistant response.
            // We keep our optimistic user message (maybe update ID if we could, but we don't get it back)
            // and append the assistant message.
            set((state) => ({
                messages: [...state.messages, assistantMsg],
                isSending: false
            }));
        } catch (error) {
            console.error('Failed to send message:', error);
            set({ isSending: false });
            // TODO: Remove optimistic message or show error
            set((state) => ({
                messages: state.messages.filter(m => m.id !== tempId)
            }));
            toast.error('Failed to send message. Please try again.');
        }
    },

    uploadFiles: async (files) => {
        const { activeChatId } = get();
        if (!activeChatId || !files || files.length === 0) return;

        // Ensure files is an array (even if one file is passed)
        const fileList = Array.isArray(files) ? files : [files];
        set({ isUploading: true });
        const toastId = toast.loading(`Uploading ${fileList.length} document(s)...`);
        try {
            await uploadDocuments(activeChatId, fileList);
            set({ isUploading: false });
            // Refresh documents list
            await get().loadDocuments(activeChatId);
            toast.success('Documents uploaded successfully!', { id: toastId });
        } catch (error) {
            console.error('Failed to upload files:', error);
            set({ isUploading: false });
            toast.error('Failed to upload documents. Please try again.', { id: toastId });
        }
    },

    documents: [],

    loadDocuments: async (chatId) => {
        try {
            const docs = await getDocuments(chatId);
            set({ documents: docs });
        } catch (error) {
            console.error('Failed to load documents:', error);
            set({ documents: [] });
        }
    },

    removeDocument: async (docId) => {
        const { activeChatId } = get();
        if (!activeChatId) return;

        try {
            await deleteDocument(activeChatId, docId);
            set((state) => ({
                documents: state.documents.filter(d => d.id !== docId)
            }));
        } catch (error) {
            console.error('Failed to delete document:', error);
        }
    },

    renameChat: async (chatId, newTitle) => {
        try {
            await updateChatTitle(chatId, newTitle);
            set((state) => ({
                chats: state.chats.map(c => c.id === chatId ? { ...c, title: newTitle } : c)
            }));
        } catch (error) {
            console.error('Failed to rename chat:', error);
        }
    }
}));

export default useChatStore;
