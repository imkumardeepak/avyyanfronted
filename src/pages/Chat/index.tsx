import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Send,
  Plus,
  Search,
  MoreVertical,
  Users,
  MessageCircle,
  Phone,
  Video,
  Paperclip,
  Smile,
} from 'lucide-react';
import { useChat } from '@/hooks/useChat';
import { useAuth } from '@/contexts/AuthContext';
// ChatRoomDto and ChatMessageDto are defined in the useChat hook
import { formatDate, formatTime } from '@/lib/utils';

const Chat = () => {
  const { user } = useAuth();
  const { chatRooms, messages, selectedRoom, loading, sendMessage, selectRoom, createRoom } =
    useChat();

  const [messageText, setMessageText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedRoom) return;

    await sendMessage({
      chatRoomId: selectedRoom.id,
      content: messageText,
      messageType: 'Text',
    });

    setMessageText('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const filteredRooms = chatRooms.filter((room) =>
    room.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-8rem)] flex">
      {/* Sidebar - Chat Rooms */}
      <div className="w-80 border-r bg-background">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Chats</h2>
            <Button size="sm" onClick={() => createRoom()}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search chats..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <ScrollArea className="h-[calc(100%-120px)]">
          <div className="p-2">
            {filteredRooms.map((room) => (
              <div
                key={room.id}
                className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer hover:bg-accent transition-colors ${
                  selectedRoom?.id === room.id ? 'bg-accent' : ''
                }`}
                onClick={() => selectRoom(room)}
              >
                <div className="relative">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={room.imageUrl} />
                    <AvatarFallback>
                      {room.type === 'Group' ? (
                        <Users className="h-5 w-5" />
                      ) : (
                        room.name[0]?.toUpperCase()
                      )}
                    </AvatarFallback>
                  </Avatar>
                  {room.type === 'Group' && (
                    <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {room.memberCount}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium truncate">{room.name}</h3>
                    {room.lastMessage && (
                      <span className="text-xs text-muted-foreground">
                        {formatTime(room.lastMessage.createdAt)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground truncate">
                      {room.lastMessage?.content || 'No messages yet'}
                    </p>
                    {room.unreadMessageCount > 0 && (
                      <Badge variant="default" className="text-xs">
                        {room.unreadMessageCount}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedRoom ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b bg-background">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={selectedRoom.imageUrl} />
                    <AvatarFallback>
                      {selectedRoom.type === 'Group' ? (
                        <Users className="h-5 w-5" />
                      ) : (
                        selectedRoom.name[0]?.toUpperCase()
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{selectedRoom.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedRoom.type === 'Group'
                        ? `${selectedRoom.memberCount} members`
                        : 'Direct message'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Video className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.senderId === user?.id ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[70%] ${
                        message.senderId === user?.id
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      } rounded-lg p-3`}
                    >
                      {message.senderId !== user?.id && (
                        <div className="text-xs font-medium mb-1">{message.senderName}</div>
                      )}

                      <div className="text-sm">{message.content}</div>

                      <div className="text-xs opacity-70 mt-1">
                        {formatTime(message.createdAt)}
                        {message.isEdited && <span className="ml-1">(edited)</span>}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t bg-background">
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm">
                  <Paperclip className="h-4 w-4" />
                </Button>

                <div className="flex-1 relative">
                  <Input
                    placeholder="Type a message..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="pr-10"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2"
                  >
                    <Smile className="h-4 w-4" />
                  </Button>
                </div>

                <Button onClick={handleSendMessage} disabled={!messageText.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          /* No Chat Selected */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Select a chat</h3>
              <p className="text-muted-foreground">
                Choose a conversation from the sidebar to start messaging
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
