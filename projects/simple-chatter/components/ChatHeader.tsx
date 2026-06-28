import { Layout, Typography, Button } from 'antd';
import { RobotOutlined, SunOutlined, MoonOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface ChatHeaderProps {
  isDark: boolean;
  onToggleTheme: () => void;
}

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0 24px',
  height: 64,
  borderBottom: '1px solid rgba(0,0,0,0.06)',
};

export const ChatHeader: React.FC<ChatHeaderProps> = ({ isDark, onToggleTheme }) => (
  <Layout.Header style={headerStyle}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <RobotOutlined style={{ fontSize: 24, color: '#1677ff' }} />
      <div>
        <Text strong style={{ fontSize: 18 }}>Simple Chatter</Text>
        <br />
        <Text type="secondary" style={{ fontSize: 12 }}>Online</Text>
      </div>
    </div>
    <Button
      type="text"
      icon={isDark ? <SunOutlined /> : <MoonOutlined />}
      onClick={onToggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      style={{ fontSize: 18 }}
    />
  </Layout.Header>
);
