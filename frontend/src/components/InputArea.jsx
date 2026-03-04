import React, { useState, useRef, useEffect } from 'react';
import { ArrowUp, Paperclip, X, FileText, Loader2, Headphones } from 'lucide-react';
import useChatStore from '../store/chatStore';
import AudioRecorder from './AudioRecorder';

export default function InputArea() {
    const {
        activeChatId,
        sendUserMessage,
        uploadFiles,
        isSending,
        isUploading,
        isAudioPlaying,
        isVoiceMode,
        setVoiceMode
    } = useChatStore();

    const [input, setInput] = useState('');
    const [files, setFiles] = useState([]);
    const textareaRef = useRef(null);
    const fileInputRef = useRef(null);

    const adjustHeight = () => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
        }
    };

    useEffect(() => {
        adjustHeight();
    }, [input]);

    const handleSend = async (contentOverride = null) => {
        const messageContent = contentOverride !== null ? contentOverride : input;

        if ((!messageContent.trim() && files.length === 0) || isSending || isUploading) return;

        // 1. Upload files if present
        if (files.length > 0) {
            try {
                await uploadFiles(files);
            } catch (e) {
                console.error("Upload failed", e);
                return;
            }
        }

        // 2. Send message if text present
        if (messageContent.trim()) {
            await sendUserMessage(messageContent);
        }

        // Clear state
        setInput('');
        setFiles([]);
        if (textareaRef.current) textareaRef.current.style.height = 'auto';
    };

    const handleTranscription = (text, shouldStopAutoMode = false) => {
        if (!text) return;

        if (shouldStopAutoMode) {
            setVoiceMode(false);
            return;
        }

        if (isVoiceMode) {
            // ... (rest of function)
            // Append to existing input just in case, but send immediately
            const newContent = input ? input + ' ' + text : text;
            setInput(newContent);
            // Trigger send immediately with the new content
            handleSend(newContent);
        } else {
            // Standard behavior: just append
            setInput((prev) => prev ? prev + ' ' + text : text);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleFileSelect = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            setFiles(prev => [...prev, ...Array.from(e.target.files)]);
        }
        e.target.value = null;
    };

    const removeFile = (index) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    if (!activeChatId) return null;

    return (
        <div className="w-full bg-gray-950 pb-6 pt-2 px-4">
            <div className="max-w-3xl mx-auto relative">
                {/* File Chips */}
                {files.length > 0 && (
                    <div className="absolute -top-14 left-0 flex flex-wrap gap-2 max-h-12 overflow-y-auto w-full p-1">
                        {files.map((f, idx) => (
                            <div key={idx} className="flex items-center gap-2 bg-gray-800 text-gray-200 px-3 py-1.5 rounded-lg text-xs shadow-md animate-slide-up border border-white/10 shrink-0">
                                <FileText size={14} className="text-blue-400" />
                                <span className="truncate max-w-[120px]">{f.name}</span>
                                <button onClick={() => removeFile(idx)} className="text-gray-400 hover:text-white transition-colors">
                                    <X size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Input Bar */}
                <div className="flex items-end gap-3 bg-gray-900/50 border border-gray-700/50 rounded-3xl p-3 shadow-xl backdrop-blur-sm focus-within:ring-1 focus-within:ring-gray-600 transition-all">
                    {/* Attachment Button */}
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-gray-800 transition-colors shrink-0 mb-0.5"
                        title="Attach files"
                    >
                        <Paperclip size={20} />
                    </button>
                    <input
                        type="file"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        accept=".pdf,.txt"
                        multiple
                    />

                    {/* Voice Mode Toggle */}
                    <button
                        onClick={() => setVoiceMode(!isVoiceMode)}
                        className={`p-2 rounded-full transition-all duration-300 flex items-center justify-center shrink-0 mb-0.5 ${isVoiceMode ? 'bg-teal-500/20 text-teal-400 ring-1 ring-teal-500' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
                        title={isVoiceMode ? "Disable Voice Mode" : "Enable Voice Mode (Hands-free)"}
                    >
                        <Headphones size={20} />
                    </button>

                    {/* Voice Input */}
                    <AudioRecorder
                        onTranscriptionComplete={handleTranscription}
                        mode={isVoiceMode ? 'auto' : 'manual'}
                        isAiSpeaking={isSending || isUploading || isAudioPlaying}
                    />

                    {/* Textarea */}
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={isVoiceMode ? "Listening mode enabled..." : "Message Local RAG..."}
                        rows={1}
                        className="flex-1 bg-transparent text-gray-100 placeholder-gray-500 text-base py-2 px-2 resize-none focus:outline-none max-h-[200px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600"
                    />

                    {/* Send Button */}
                    <button
                        onClick={() => handleSend()}
                        disabled={(!input.trim() && files.length === 0) || isSending || isUploading}
                        className={`p-2 rounded-lg shrink-0 mb-0.5 transition-all duration-200 ${(input.trim() || files.length > 0) && !isSending && !isUploading
                            ? 'bg-white text-black hover:bg-gray-200'
                            : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                            }`}
                    >
                        {isSending || isUploading ? <Loader2 size={20} className="animate-spin" /> : <ArrowUp size={20} strokeWidth={2.5} />}
                    </button>
                </div>
                <div className="text-center mt-2 flex flex-col items-center gap-1">
                    {isVoiceMode && <span className="text-[10px] text-teal-500 font-medium tracking-wide uppercase">Voice Communication Mode Active</span>}
                    <p className="text-[11px] text-gray-500">
                        Local RAG Chatbot can make mistakes. Check important info.
                    </p>
                </div>
            </div>
        </div>
    );
}
