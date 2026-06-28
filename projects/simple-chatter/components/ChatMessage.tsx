import { useEffect, useState } from 'react';
import { Typography } from 'antd';
import { RobotOutlined, UserOutlined } from '@ant-design/icons';
import type { Message } from 'types/chat';

const { Text } = Typography;

interface ChatMessageProps {
  message: Message;
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const isUser = message.role === 'user';

  return (
    <div className={`message-row ${message.role}`}>
      <div style={{ display: 'flex', gap: 8, flexDirection: isUser ? 'row-reverse' : 'row', alignItems: 'flex-end' }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: isUser ? '#1677ff' : '#f0f0f0',
          flexShrink: 0,
        }}>
          {isUser
            ? <UserOutlined style={{ color: '#fff', fontSize: 14 }} />
            : <RobotOutlined style={{ color: '#1677ff', fontSize: 14 }} />
          }
        </div>
        <div>
          <div className={`message-bubble ${message.role}`}>
            <Text style={{ color: isUser ? '#fff' : undefined }}>
              {message.content}
            </Text>
          </div>
          <div className="message-time">
            <Text type="secondary" style={{ fontSize: 11 }}>
              {mounted ? formatTime(message.timestamp) : ''}
            </Text>
          </div>
        </div>
      </div>
    </div>
  );
};
