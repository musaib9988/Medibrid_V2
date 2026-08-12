import React, { useState, useEffect, useRef } from 'react';
import { useApp, attachSafeSnapshot } from '../context/AppContext';
import { collection, query, where, orderBy, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Message, Chat } from '../types';
import { ArrowLeft, Send, User } from 'lucide-react';

export const ChatView: React.FC = () => {
  const { userProfile, chats, activeChatId, setActiveChatId } = useApp();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeChat = chats.find(c => c.id === activeChatId);

  useEffect(() => {
    if (!activeChatId) return;

    const q = query(
      collection(db, `chats/${activeChatId}/messages`),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = attachSafeSnapshot(q, (snapshot: any) => {
      setMessages(snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Message)));
      
      // Mark as read
      if (userProfile && activeChat && !activeChat.readBy.includes(userProfile.uid)) {
        updateDoc(doc(db, 'chats', activeChatId), {
          readBy: [...activeChat.readBy, userProfile.uid]
        }).catch((err) => console.warn("Chat read update notice:", err));
      }
    }, "Messages");

    return unsubscribe;
  }, [activeChatId, userProfile?.uid]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChatId || !userProfile) return;

    const text = newMessage;
    setNewMessage('');

    try {
      await addDoc(collection(db, `chats/${activeChatId}/messages`), {
        chatId: activeChatId,
        senderId: userProfile.uid,
        text,
        timestamp: new Date().toISOString()
      });

      await updateDoc(doc(db, 'chats', activeChatId), {
        lastMessage: text,
        lastMessageTime: new Date().toISOString(),
        readBy: [userProfile.uid]
      });
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  if (activeChatId && activeChat) {
    const otherName = (userProfile?.role === 'clinic_owner' ? activeChat.patientName : activeChat.clinicName) || 'Chat User';
    return (
      <div className="flex flex-col h-[calc(100vh-140px)] bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-in slide-in-from-right-8">
        <div className="p-4 border-b border-slate-200 flex items-center gap-3 bg-slate-50">
          <button onClick={() => setActiveChatId(null)} className="p-2 hover:bg-slate-200 rounded-full">
            <ArrowLeft className="w-5 h-5 text-slate-700" />
          </button>
          <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center text-teal-700 font-bold">
            {(otherName || 'C').charAt(0)}
          </div>
          <h2 className="font-bold text-slate-800 text-lg">{otherName}</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 bg-slate-50/50">
          {messages.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-slate-500">
              No messages yet. Send a message to start the conversation!
            </div>
          ) : (
            messages.map(msg => {
              const isMine = msg.senderId === userProfile?.uid;
              return (
                <div key={msg.id} className={`flex flex-col max-w-[75%] ${isMine ? 'self-end items-end' : 'self-start items-start'}`}>
                  <div className={`px-4 py-2.5 rounded-2xl shadow-sm ${isMine ? 'bg-teal-600 text-white rounded-tr-sm' : 'bg-white text-slate-800 border border-slate-200 rounded-tl-sm'}`}>
                    {msg.text}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 px-1">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
            placeholder="Type a message..."
            className="flex-1 px-4 py-3 bg-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 transition-shadow"
          />
          <button 
            type="submit" 
            disabled={!newMessage.trim()}
            className="p-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 min-h-[400px]">
      <div className="p-4 border-b border-slate-200">
        <h2 className="text-xl font-bold text-slate-800">Messages</h2>
      </div>
      <div className="divide-y divide-slate-100">
        {chats.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            No active conversations.
          </div>
        ) : (
          chats.sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()).map(chat => {
            const otherName = (userProfile?.role === 'clinic_owner' ? chat.patientName : chat.clinicName) || 'Chat User';
            const isUnread = !(chat.readBy || []).includes(userProfile?.uid || '');
            
            return (
              <div 
                key={chat.id} 
                onClick={() => setActiveChatId(chat.id)}
                className="p-4 flex items-center gap-4 cursor-pointer hover:bg-slate-50 transition-colors"
              >
                <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center text-teal-700 font-bold flex-shrink-0">
                  {(otherName || 'C').charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className={`font-bold truncate ${isUnread ? 'text-slate-900' : 'text-slate-700'}`}>{otherName}</h3>
                    <span className="text-xs text-slate-400 whitespace-nowrap ml-2">
                      {new Date(chat.lastMessageTime).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <p className={`text-sm truncate ${isUnread ? 'text-slate-800 font-bold' : 'text-slate-500'}`}>
                    {chat.lastMessage}
                  </p>
                </div>
                {isUnread && <div className="w-3 h-3 bg-teal-500 rounded-full flex-shrink-0"></div>}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
