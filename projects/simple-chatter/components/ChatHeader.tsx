import { Layout, Typography, Button, Select } from 'antd';
import { RobotOutlined, SunOutlined, MoonOutlined } from '@ant-design/icons';
import type { ModelGroup } from '../utils/api';

const { Text } = Typography;

interface ChatHeaderProps {
  isDark: boolean;
  onToggleTheme: () => void;
  model?: string;
  modelGroups?: ModelGroup[];
  onModelChange?: (model: string) => void;
}

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0 24px',
  height: 64,
  borderBottom: '1px solid rgba(0,0,0,0.06)',
};

export const ChatHeader: React.FC<ChatHeaderProps> = ({ isDark, onToggleTheme, model, modelGroups, onModelChange }) => (
  <Layout.Header style={headerStyle}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <RobotOutlined style={{ fontSize: 24, color: '#1677ff' }} />
      <div>
        <Text strong style={{ fontSize: 18 }}>Simple Chatter</Text>
        <br />
        <Text type="secondary" style={{ fontSize: 12 }}>Online</Text>
      </div>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      {modelGroups && onModelChange && (
        <Select
          value={model}
          onChange={onModelChange}
          style={{ width: 200 }}
          size="small"
          popupMatchSelectWidth={false}
        >
          {modelGroups.map((group) => (
            <Select.OptGroup key={group.provider} label={group.providerLabel}>
              {group.models.map((m) => (
                <Select.Option key={m.id} value={m.id}>
                  {m.name}
                </Select.Option>
              ))}
            </Select.OptGroup>
          ))}
        </Select>
      )}
      <Button
        type="text"
        icon={isDark ? <SunOutlined /> : <MoonOutlined />}
        onClick={onToggleTheme}
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        style={{ fontSize: 18 }}
      />
    </div>
  </Layout.Header>
);
