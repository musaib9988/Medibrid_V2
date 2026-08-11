import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { MessageSquare, ArrowLeft, Send, AlertCircle } from 'lucide-react';

interface Space {
  name: string;
  displayName?: string;
  type: string;
  singleUserBotDm?: boolean;
}

interface ChatMessage {
  name: string;
  sender: {
    name: string;
    displayName: string;
    type: string;
  };
  createTime: string;
  text: string;
}

export const GoogleChatWidget: React.FC = () => {
  const { googleAccessToken, activeGoogleSpace, setActiveGoogleSpace } = useApp();
  const [spaces, setSpaces] = useState<Space[]>([]);
  const activeSpace = activeGoogleSpace;
  const setActiveSpace = setActiveGoogleSpace;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (googleAccessToken) {
      fetchSpaces();
    }
  }, [googleAccessToken]);

  useEffect(() => {
    if (activeSpace && googleAccessToken) {
      fetchMessages(activeSpace.name);
      
      // Setup simple polling for demo
      const interval = setInterval(() => {
        fetchMessages(activeSpace.name, true);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [activeSpace, googleAccessToken]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchSpaces = async () => {
    if (!googleAccessToken) return;
    setLoading(true);
    try {
      const res = await fetch('https://chat.googleapis.com/v1/spaces', {
        headers: { Authorization: `Bearer ${googleAccessToken}` }
      });
      const data = await res.json();
      if (data.error) {
        throw new Error(data.error.message || 'Failed to fetch spaces');
      }
      setSpaces(data.spaces || []);
      setError('');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to fetch Google Chat spaces');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (spaceName: string, silent = false) => {
    if (!googleAccessToken) return;
    if (!silent) setLoading(true);
    try {
      const res = await fetch(`https://chat.googleapis.com/v1/${spaceName}/messages?pageSize=50`, {
        headers: { Authorization: `Bearer ${googleAccessToken}` }
      });
      const data = await res.json();
      if (data.error) {
        throw new Error(data.error.message || 'Failed to fetch messages');
      }
      setMessages((data.messages || []).reverse());
      setError('');
    } catch (err: any) {
      console.error(err);
      if (!silent) setError(err.message || 'Failed to fetch messages');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeSpace || !googleAccessToken) return;
    
    const text = newMessage;
    setNewMessage('');
    
    // Optimistic UI
    const optimisticMsg: ChatMessage = {
      name: 'temp',
      sender: { name: 'me', displayName: 'Me', type: 'HUMAN' },
      createTime: new Date().toISOString(),
      text
    };
    setMessages([...messages, optimisticMsg]);

    try {
      const res = await fetch(`https://chat.googleapis.com/v1/${activeSpace.name}/messages`, {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${googleAccessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      fetchMessages(activeSpace.name, true);
    } catch (err: any) {
      console.error(err);
      setError('Failed to send message: ' + err.message);
    }
  };

  if (!googleAccessToken) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center h-[calc(100vh-140px)] flex flex-col items-center justify-center">
        <MessageSquare className="w-12 h-12 text-slate-300 mb-4" />
        <h2 className="text-xl font-bold text-slate-800 mb-2">Google Chat Integration</h2>
        <p className="text-slate-500 max-w-md">
          To use Google Chat directly in the application, you must sign in with Google.
        </p>
      </div>
    );
  }

  if (activeSpace) {
    const spaceName = activeSpace.displayName || (activeSpace.type === 'DIRECT_MESSAGE' ? 'Direct Message' : 'Google Chat Space');
    
    return (
      <div className="flex flex-col h-[calc(100vh-140px)] bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-in slide-in-from-right-8">
        <div className="p-4 border-b border-slate-200 flex items-center gap-3 bg-blue-50">
          <button onClick={() => setActiveSpace(null)} className="p-2 hover:bg-blue-200 rounded-full">
            <ArrowLeft className="w-5 h-5 text-blue-700" />
          </button>
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold">
            <MessageSquare className="w-5 h-5" />
          </div>
          <h2 className="font-bold text-slate-800 text-lg">{spaceName}</h2>
        </div>
        
        {error && (
          <div className="p-2 bg-red-50 text-red-600 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 bg-slate-50/50">
          {loading && messages.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-slate-500">Loading messages...</div>
          ) : messages.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-slate-500">
              No messages yet in this space.
            </div>
          ) : (
            messages.map(msg => {
              const isMine = msg.sender.name === 'me' || msg.sender.displayName === 'Me'; // Simple check, real app compares user IDs
              return (
                <div key={msg.name} className={`flex flex-col max-w-[75%] ${isMine ? 'self-end items-end' : 'self-start items-start'}`}>
                  <span className="text-xs text-slate-500 mb-1 ml-1">{msg.sender.displayName}</span>
                  <div className={`px-4 py-2.5 rounded-2xl shadow-sm ${isMine ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-white text-slate-800 border border-slate-200 rounded-tl-sm'}`}>
                    {msg.text}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 px-1">
                    {new Date(msg.createTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-200 bg-white flex items-center gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            placeholder="Type a message in Google Chat..."
            className="flex-1 px-4 py-3 bg-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
          />
          <button 
             type="submit" 
             disabled={!newMessage.trim()}
            className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 min-h-[400px]">
      <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-blue-50">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-blue-600" />
          Google Chat Spaces
        </h2>
        <button onClick={fetchSpaces} className="text-sm text-blue-600 font-medium hover:underline">
          Refresh
        </button>
      </div>
      
      {error && (
        <div className="p-4 bg-red-50 text-red-600 text-sm flex items-center gap-2 border-b border-red-100">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      <div className="divide-y divide-slate-100">
        {loading && spaces.length === 0 ? (
          <div className="p-8 text-center text-slate-500">Loading your spaces...</div>
        ) : spaces.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            No Google Chat spaces found. Create one in Google Chat to get started.
          </div>
        ) : (
          spaces.map(space => {
            const spaceName = space.displayName || (space.type === 'DIRECT_MESSAGE' ? 'Direct Message' : 'Unnamed Space');
            
            return (
              <div 
                 key={space.name} 
                 onClick={() => setActiveSpace(space)}
                className="p-4 flex items-center gap-4 cursor-pointer hover:bg-blue-50 transition-colors"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold flex-shrink-0">
                  {spaceName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-800 truncate">{spaceName}</h3>
                  <p className="text-sm text-slate-500 truncate capitalize">
                    {space.type.replace('_', ' ').toLowerCase()}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
