import React, { useState } from 'react';
import { ChatView } from './ChatView';
import { GoogleChatWidget } from './GoogleChatWidget';
import { MessageSquare, Cloud } from 'lucide-react';

export const MessagesTab: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'app' | 'google'>('google');

  return (
    <div className="flex flex-col gap-4">
      <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('app')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
            activeTab === 'app' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          App Chat
        </button>
        <button
          onClick={() => setActiveTab('google')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
            activeTab === 'google' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Cloud className="w-4 h-4" />
          Google Chat
        </button>
      </div>

      <div className="mt-2">
        {activeTab === 'app' ? <ChatView /> : <GoogleChatWidget />}
      </div>
    </div>
  );
};
