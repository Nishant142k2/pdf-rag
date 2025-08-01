'use client';

import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import * as React from 'react';
import { Bot, Loader2 } from 'lucide-react';
import { useUser } from '@clerk/nextjs';

interface IMessage {
  role: 'assistant' | 'user';
  content?: string;
  documents?: string[]; // Keep as string array for simplicity
  timestamp?: string;
}

const ChatComponent: React.FC = () => {
  const [message, setMessage] = React.useState<string>('');
  const [messages, setMessages] = React.useState<IMessage[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const { user } = useUser();

  // Auto-scroll to bottom when new messages arrive
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendChatMessage = async () => {
    if (!message.trim() || isLoading) return;

    const userMessage = message.trim();
    const timestamp = new Date().toLocaleTimeString();
    
    // Add user message immediately
    setMessages((prev) => [...prev, { 
      role: 'user', 
      content: userMessage,
      timestamp 
    }]);
    
    setMessage("");
    setIsLoading(true);

    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
      
      // Create FormData to match your backend expectation
      const formData = new FormData();
      formData.append('question', userMessage);
      
      const res = await fetch(`${API_BASE_URL}/chat/`, {
        method: "POST",
        body: formData, // Using FormData instead of JSON
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      
      // DEBUG: Log the response data
      console.log('Backend response:', data);
      console.log('Data type:', typeof data);
      console.log('Data keys:', Object.keys(data || {}));

      // Process documents - convert objects to strings to avoid rendering issues
      const processedDocuments = (data?.sources || data?.documents || data?.refs) ? 
        (data?.sources || data?.documents || data?.refs).map((doc: any) => {
          // Handle both string and object formats - always return string
          if (typeof doc === 'string') {
            return doc;
          }
          // Convert object to string format
          const title = doc.title || doc.source || 'Unknown source';
          const page = doc.page ? ` (Page ${doc.page})` : '';
          return `${title}${page}`;
        }) : undefined;

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data?.answer || data?.response || data?.content || 'Sorry, I couldn\'t generate a response.',
          documents: processedDocuments,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } catch (error) {
      console.error("Chat error:", error);
      
      // Add error message to chat
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error while processing your message. Please try again.',
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendChatMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto">
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            <Bot className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>Start a conversation by typing a message below.</p>
          </div>
        )}
        
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex items-start gap-3 ${
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5 text-gray-600" />
              </div>
            )}

            <div className="flex flex-col max-w-sm">
              <div
                className={`rounded-xl px-4 py-2 break-words ${
                  msg.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                {msg.content}
              </div>
              
              {msg.timestamp && (
                <div className={`text-xs text-gray-500 mt-1 ${
                  msg.role === 'user' ? 'text-right' : 'text-left'
                }`}>
                  {msg.timestamp}
                </div>
              )}
              
              {msg.documents && msg.documents.length > 0 && (
                <div className="mt-2 text-xs text-gray-600">
                  <div className="font-medium">Sources:</div>
                  <ul className="list-disc list-inside space-y-1">
                    {msg.documents.map((doc, idx) => (
                      <li key={idx} className="truncate">
                        {doc}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {msg.role === 'user' && user?.imageUrl && (
              <img
                src={user.imageUrl}
                alt="User Profile"
                width={32}
                height={32}
                className="rounded-full flex-shrink-0"
              />
            )}
          </div>
        ))}
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
              <Bot className="w-5 h-5 text-gray-600" />
            </div>
            <div className="bg-gray-100 rounded-xl px-4 py-2">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t bg-black p-4">
        <div className="flex gap-3">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message here"
            disabled={isLoading}
            className="flex-1"
          />
          <Button 
            onClick={handleSendChatMessage} 
            disabled={!message.trim() || isLoading}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Send'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatComponent;