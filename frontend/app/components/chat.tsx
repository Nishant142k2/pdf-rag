'use client';

import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import * as React from 'react';
import { Bot } from 'lucide-react';
import { useUser } from '@clerk/nextjs';

interface IMessage {
  role: 'assistant' | 'user';
  content?: string;
  documents?: string[];
}

const ChatComponent: React.FC = () => {
  const [message, setMessage] = React.useState<string>('');
  const [messages, setMessages] = React.useState<IMessage[]>([]);

  const { user } = useUser(); // ← Clerk user info
  
  const handleSendChatMessage = async () => {
    if (!message.trim()) return;

    setMessages((prev) => [...prev, { role: 'user', content: message }]);

    try {
      const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000';
      const res = await fetch(`${API_BASE_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: message }),
      });

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data?.answer,
          documents: data?.sources,
        },
      ]);
    } catch (error) {
      console.error("Chat error:", error);
    }

    setMessage("");
  };

  return (
    <div className="p-4 pb-20 max-w-2xl mx-auto">
      <div className="space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex items-start gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                <Bot className="w-5 h-5 text-gray-600" />
              </div>
            )}

            <div className={`rounded-xl px-4 py-2 max-w-sm break-words ${message.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-900'}`}>
              {message.content}
            </div>

            {message.role === 'user' && user?.imageUrl && (
              <img
                src={user.imageUrl}
                alt="User Profile"
                width={32}
                height={32}
                className="rounded-full"
              />
            )}
          </div>
        ))}
      </div>

      <div className="fixed bottom-4 right-0 w-full px-4 flex gap-3 max-w-2xl mx-auto">
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message here"
        />
        <Button onClick={handleSendChatMessage} disabled={!message.trim()}>
          Send
        </Button>
      </div>
    </div>
  );
};

export default ChatComponent;
