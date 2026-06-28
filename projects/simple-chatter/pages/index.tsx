import { useState, useCallback, useRef, useEffect } from 'react';
import { Layout, Spin } from 'antd';
import { ChatHeader } from '../components/ChatHeader';
import { ChatMessage } from '../components/ChatMessage';
import { ChatInput } from '../components/ChatInput';
import { streamChatMessage } from '../utils/api';
import type { Message } from '../types/chat';

interface HomeProps {
  isDark: boolean;
  onToggleTheme: () => void;
}

let msgId = 1;
const welcome: Message = {
  id: String(msgId++),
  role: 'assistant',
  content: "Hi! I'm Simple Chatter. Ask me anything or just say hello!",
  timestamp: Date.now(),
};

export default function Home({ isDark, onToggleTheme }: HomeProps) {
  const [messages, setMessages] = useState<Message[]>([welcome]);
  const [loading, setLoading] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleSend = useCallback(async (content: string) => {
    const userMsg: Message = {
      id: String(msgId++),
      role: 'user',
      content,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    const aiId = String(msgId++);
    const aiMsg: Message = { id: aiId, role: 'assistant', content: '', timestamp: Date.now() };
    setMessages((prev) => [...prev, aiMsg]);

    const history = messages
      .filter((m) => m.content)
      .map((m) => ({ role: m.role, content: m.content }));

    try {
      await streamChatMessage(
        [...history, { role: 'user', content }],
        (chunk) => {
          setMessages((prev) =>
            prev.map((m) => (m.id === aiId ? { ...m, content: m.content + chunk } : m))
          );
        },
        () => setLoading(false),
      );
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === aiId ? { ...m, content: m.content || 'Sorry, something went wrong. Please try again.' } : m
        )
      );
      setLoading(false);
    }
  }, [messages]);

  return (
    <Layout className="chat-container">
      <ChatHeader isDark={isDark} onToggleTheme={onToggleTheme} />
      <div ref={listRef} className="message-list">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
        {loading && (
          <div style={{ alignSelf: 'flex-start', padding: 8 }}>
            <Spin size="small" />
          </div>
        )}
      </div>
      <ChatInput onSend={handleSend} disabled={loading} />
    </Layout>
  );
}
