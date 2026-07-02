import { useState, useCallback, useRef, useEffect } from 'react';
import { Layout, Spin } from 'antd';
import { ChatHeader } from '../components/ChatHeader';
import { ChatMessage } from '../components/ChatMessage';
import { ChatInput } from '../components/ChatInput';
import { streamChatMessage, fetchModels } from '../utils/api';
import type { Message } from '../types/chat';
import type { ModelGroup } from '../utils/api';

interface HomeProps {
  isDark: boolean;
  onToggleTheme: () => void;
}

const msgIdRef = { current: 1 };
function createWelcome(): Message {
  return {
    id: String(msgIdRef.current++),
    role: 'assistant',
    content: "Hi! I'm Simple Chatter. Ask me anything or just say hello!",
    timestamp: Date.now(),
  };
}

export default function Home({ isDark, onToggleTheme }: HomeProps) {
  const [messages, setMessages] = useState<Message[]>([createWelcome()]);
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState<string>('');
  const [modelGroups, setModelGroups] = useState<ModelGroup[]>([]);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchModels()
      .then((data) => {
        setModelGroups(data.groups);
        setModel(data.default);
      })
      .catch(() => {
        setModelGroups([
          { provider: 'deepseek', providerLabel: 'DeepSeek', models: [{ id: 'deepseek-v4-flash', name: 'Flash', provider: 'deepseek', providerLabel: 'DeepSeek' }] },
        ]);
        setModel('deepseek-v4-flash');
      });
  }, []);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleModelChange = useCallback((newModel: string) => {
    setModel(newModel);
    setMessages([createWelcome()]);
    msgIdRef.current = 1;
  }, []);

  const handleSend = useCallback(async (content: string) => {
    const userMsg: Message = {
      id: String(msgIdRef.current++),
      role: 'user',
      content,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    const aiId = String(msgIdRef.current++);
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
        model || undefined,
      );
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === aiId ? { ...m, content: m.content || 'Sorry, something went wrong. Please try again.' } : m
        )
      );
      setLoading(false);
    }
  }, [messages, model]);

  return (
    <Layout className="chat-container">
      <ChatHeader
        isDark={isDark}
        onToggleTheme={onToggleTheme}
        model={model}
        modelGroups={modelGroups}
        onModelChange={handleModelChange}
      />
      <div ref={listRef} className="message-list">
        {messages.map((msg, idx) => (
          <ChatMessage
            key={msg.id}
            message={msg}
            autoSpeak={
              !loading &&
              msg.role === "assistant" &&
              msg.content.length > 0 &&
              idx === messages.length - 1 &&
              idx > 0
            }
          />
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
