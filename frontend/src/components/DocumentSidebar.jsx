import React, { useRef } from 'react';
import { FileText, Trash2, Plus, X, UploadCloud, MessageSquare, Quote } from 'lucide-react';
import useChatStore from '../store/chatStore';

export default function DocumentSidebar() {
    const {
        activeChatId,
        documents,
        uploadFiles,
        removeDocument,
        isUploading,
        includeHistory,
        toggleHistory,
        showCitations,
        toggleCitations
    } = useChatStore();

    const fileInputRef = useRef(null);

    const handleFileSelect = async (e) => {
        const selectedFiles = e.target.files;
        if (!selectedFiles || selectedFiles.length === 0) return;

        await uploadFiles(Array.from(selectedFiles));
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    if (!activeChatId) return null;

    return (
        <div className="w-64 bg-gray-900 border-l border-white/10 flex flex-col h-full text-gray-200 shadow-xl z-20">
            <div className="p-4 border-b border-white/10">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                        Context
                    </h2>
                    <div className="text-xs text-gray-500">{documents.length} files</div>
                </div>

                {/* Chat History Toggle */}
                <div className="flex items-center justify-between bg-gray-800/50 p-2 rounded-lg border border-white/5 mb-2">
                    <div className="flex items-center gap-2 text-xs font-medium text-gray-300">
                        <MessageSquare size={14} className={includeHistory ? "text-blue-400" : "text-gray-500"} />
                        <span>Conversational Memory</span>
                    </div>
                    <button
                        onClick={toggleHistory}
                        title={includeHistory ? "Disable History" : "Enable History"}
                        className={`w-8 h-4 rounded-full relative transition-colors ${includeHistory ? 'bg-blue-600' : 'bg-gray-600'}`}
                    >
                        <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${includeHistory ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                </div>

                {/* Citations Toggle */}
                <div className="flex items-center justify-between bg-gray-800/50 p-2 rounded-lg border border-white/5">
                    <div className="flex items-center gap-2 text-xs font-medium text-gray-300">
                        <Quote size={14} className={showCitations ? "text-teal-400" : "text-gray-500"} />
                        <span>Show Citations</span>
                    </div>
                    <button
                        onClick={toggleCitations}
                        title={showCitations ? "Hide Citations" : "Show Citations"}
                        className={`w-8 h-4 rounded-full relative transition-colors ${showCitations ? 'bg-teal-600' : 'bg-gray-600'}`}
                    >
                        <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${showCitations ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-gray-700">
                {documents.map((doc) => (
                    <div
                        key={doc.id}
                        className="group flex flex-col bg-gray-800/50 p-3 rounded-lg border border-white/5 hover:bg-gray-800 transition-all"
                    >
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2 overflow-hidden">
                                <FileText size={16} className="text-blue-400 mt-0.5 shrink-0" />
                                <span className="text-sm text-gray-300 truncate font-medium" title={doc.filename}>
                                    {doc.filename}
                                </span>
                            </div>
                            <button
                                onClick={() => {
                                    if (window.confirm('Delete this document?')) removeDocument(doc.id);
                                }}
                                className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Remove Document"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                        <div className="text-[10px] text-gray-600 mt-2 pl-6">
                            Last updated {new Date(doc.uploaded_at).toLocaleDateString()}
                        </div>
                    </div>
                ))}

                {documents.length === 0 && (
                    <div className="text-center py-8 px-4 border-2 border-dashed border-gray-700 rounded-xl bg-gray-800/20">
                        <UploadCloud size={32} className="mx-auto text-gray-600 mb-2" />
                        <p className="text-sm text-gray-500">No documents</p>
                        <p className="text-xs text-gray-600">Upload files to add context</p>
                    </div>
                )}
            </div>

            <div className="p-4 border-t border-white/10 bg-gray-900">
                <button
                    disabled={isUploading}
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-gray-800 hover:bg-gray-700 text-sm font-medium transition-colors border border-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isUploading ? (
                        <span className="animate-pulse">Uploading...</span>
                    ) : (
                        <>
                            <Plus size={16} />
                            <span>Add Document</span>
                        </>
                    )}
                </button>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    className="hidden"
                    accept=".pdf,.txt"
                    multiple
                />
            </div>
        </div>
    );
}
