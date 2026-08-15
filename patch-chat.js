import fs from 'fs';
let content = fs.readFileSync('src/components/ChatView.tsx', 'utf8');

const replacement = `  const { userProfile, chats, activeChatId, setActiveChatId, users, sendAppNotification } = useApp();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activeChat = chats.find(c => c.id === activeChatId);`;

content = content.replace(/const \{ userProfile, chats, activeChatId, setActiveChatId \} = useApp\(\);[\s\S]*?const activeChat = chats\.find\(c => c\.id === activeChatId\);/, replacement);

const handleSendReplacement = `  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChatId || !userProfile || !activeChat) return;

    const text = newMessage;
    setNewMessage('');

    try {
      await addDoc(collection(db, \`chats/\${activeChatId}/messages\`), {
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

      // Send push notification to the other participant
      const otherUserId = activeChat.participants.find(p => p !== userProfile.uid);
      if (otherUserId) {
         const otherUser = users?.find(u => u.uid === otherUserId);
         const senderName = userProfile.role === 'clinic_owner' ? activeChat.clinicName : activeChat.patientName;
         sendAppNotification(
            \`New message from \${senderName || 'User'}\`,
            text,
            otherUserId,
            otherUser?.fcmToken
         );
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };`;

content = content.replace(/const handleSendMessage = async \(e: React\.FormEvent\) => \{[\s\S]*?\} catch \(error\) \{[\s\S]*?console\.error\("Error sending message:", error\);\n    \}\n  \};/, handleSendReplacement);

fs.writeFileSync('src/components/ChatView.tsx', content);
