import React from 'react';
import { ChatView } from './ChatView';

export const MessagesTab: React.FC = () => {
  return (
    <div className="flex flex-col gap-4">
      <div className="mt-2">
        <ChatView />
      </div>
    </div>
  );
};
