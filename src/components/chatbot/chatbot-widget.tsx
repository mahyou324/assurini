'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, Send, X, Loader2, Bot } from 'lucide-react';
import { sendMessageToChatbotAction } from '@/app/actions/chatbot-actions';
import { APP_NAME } from '@/lib/constants';
import type { ChatbotInput } from '@/ai/flows/chatbot-flow';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
}

export function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollableView = scrollAreaRef.current.querySelector('div > div'); // This targets the actual scrollable viewport
      if (scrollableView) {
        scrollableView.scrollTop = scrollableView.scrollHeight;
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  useEffect(() => {
    // Add initial greeting from bot when chat opens for the first time
    if (isOpen && messages.length === 0) {
      setMessages([
        { id: 'initial-greeting', role: 'model', text: `Bonjour ! Je suis l'assistant virtuel de ${APP_NAME}. Comment puis-je vous aider aujourd'hui ?` }
      ]);
    }
  }, [isOpen, messages.length]); // Added messages.length to dependencies to avoid re-triggering if already greeted


  const handleSubmit = async (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = { id: Date.now().toString(), role: 'user', text: inputValue.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    const chatHistoryForAI = messages.map(msg => ({ role: msg.role, text: msg.text }));
    
    const inputForAI: ChatbotInput = {
      userMessage: userMessage.text,
      chatHistory: chatHistoryForAI,
    };

    const result = await sendMessageToChatbotAction(inputForAI);
    setIsLoading(false);

    if (result && 'botResponse' in result) { // Check if result is not null and has botResponse
      const botMessage: ChatMessage = { id: (Date.now() + 1).toString(), role: 'model', text: result.botResponse };
      setMessages(prev => [...prev, botMessage]);
    } else if (result && 'error' in result) { // Check if result is not null and has error
      const errorMessage: ChatMessage = { id: (Date.now() + 1).toString(), role: 'model', text: `Désolé, une erreur s'est produite : ${result.error}` };
      setMessages(prev => [...prev, errorMessage]);
    } else {
       const errorMessage: ChatMessage = { id: (Date.now() + 1).toString(), role: 'model', text: "Désolé, une erreur inattendue s'est produite." };
       setMessages(prev => [...prev, errorMessage]);
    }
  };

  return (
    <>
      {!isOpen && (
        <Button
          variant="default"
          size="icon"
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 bg-primary hover:bg-primary/90"
          onClick={() => setIsOpen(true)}
          aria-label="Ouvrir le chat"
        >
          <MessageSquare className="h-7 w-7" />
        </Button>
      )}

      {isOpen && (
        <Card className="fixed bottom-6 right-6 w-full max-w-sm h-[calc(100vh-7rem)] max-h-[600px] z-50 shadow-xl flex flex-col rounded-lg border-border">
          <CardHeader className="flex flex-row items-center justify-between p-4 border-b bg-muted/50">
            <div className="flex items-center gap-2">
              <Bot className="h-6 w-6 text-primary" />
              <CardTitle className="text-lg text-primary">{APP_NAME} Assistant</CardTitle>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} aria-label="Fermer le chat">
              <X className="h-5 w-5" />
            </Button>
          </CardHeader>
          <CardContent className="flex-grow p-0 overflow-hidden">
            <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-3 py-2 text-sm shadow-sm ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {message.text.split('\n').map((line, index) => (
                        <span key={index}>
                          {line}
                          {index < message.text.split('\n').length - 1 && <br />}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="max-w-[80%] rounded-lg px-3 py-2 text-sm shadow-sm bg-muted text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
          <CardFooter className="p-4 border-t">
            <form onSubmit={handleSubmit} className="flex w-full items-center space-x-2">
              <Input
                type="text"
                placeholder="Posez votre question..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="flex-1"
                disabled={isLoading}
              />
              <Button type="submit" size="icon" disabled={isLoading || !inputValue.trim()} className="bg-primary hover:bg-primary/90">
                <Send className="h-5 w-5" />
                <span className="sr-only">Envoyer</span>
              </Button>
            </form>
          </CardFooter>
        </Card>
      )}
    </>
  );
}
