import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Send, MessageSquare } from 'lucide-react';

const Chat = () => {
  // Mock chat data
  const messages = [
    { id: 1, sender: 'John Doe', content: 'Hello there!', timestamp: '10:30 AM' },
    { id: 2, sender: 'You', content: 'Hi John! How are you?', timestamp: '10:31 AM' },
    {
      id: 3,
      sender: 'John Doe',
      content: "I'm doing well, thanks for asking!",
      timestamp: '10:32 AM',
    },
    { id: 4, sender: 'You', content: "That's great to hear!", timestamp: '10:33 AM' },
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Chat</h2>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <MessageSquare className="mr-2 h-4 w-4" />
              New Chat
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Team Chat</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-[calc(100vh-250px)] flex-col">
              <ScrollArea className="flex-1 pr-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === 'You' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs rounded-lg px-4 py-2 ${
                          message.sender === 'You'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium">{message.sender}</span>
                          <span className="text-xs opacity-70">{message.timestamp}</span>
                        </div>
                        <p className="text-sm">{message.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <Separator className="my-4" />

              <div className="flex items-center space-x-2">
                <Input placeholder="Type your message..." />
                <Button size="icon">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Chat;
