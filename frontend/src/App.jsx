import React from 'react';
import Sidebar from './components/Sidebar';
import { Menu } from 'lucide-react';
import useChatStore from './store/chatStore';

import ChatArea from './components/ChatArea';
import InputArea from './components/InputArea';
import DocumentSidebar from './components/DocumentSidebar';

import { Toaster } from 'sonner';

function App() {
  const { isSidebarOpen, toggleSidebar } = useChatStore();

  return (
    <div className="flex h-screen bg-background text-text overflow-hidden font-sans">
      <Toaster position="top-right" theme="dark" />
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full relative border-r border-white/5">

        {/* Toggle Button (Mobile/Collapsible) */}
        {!isSidebarOpen && (
          <button
            onClick={toggleSidebar}
            className="absolute top-4 left-4 z-50 p-2 bg-surface rounded-md shadow-md text-text-muted hover:text-white transition-colors"
          >
            <Menu size={24} />
          </button>
        )}

        {/* Chat Area */}
        <ChatArea />

        {/* Input Area */}
        <InputArea />
      </div>

      {/* Document Sidebar (Right Side) */}
      <DocumentSidebar />
    </div>
  );
}

export default App;
