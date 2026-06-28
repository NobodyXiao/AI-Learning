import React from 'react';
import { Layout, Button, Typography } from 'antd';
import { SunOutlined, MoonOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface AppHeaderProps {
  isDark: boolean;
  onToggleTheme: () => void;
}

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0 24px',
  height: 56,
  lineHeight: '56px',
};

const AppHeader: React.FC<AppHeaderProps> = ({ isDark, onToggleTheme }) => {
  return (
    <Layout.Header style={headerStyle}>
      <Text strong style={{ fontSize: 18, color: 'inherit' }}>
        DayLister
      </Text>
      <Button
        type="text"
        icon={isDark ? <SunOutlined /> : <MoonOutlined />}
        onClick={onToggleTheme}
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        style={{ fontSize: 18 }}
      />
    </Layout.Header>
  );
};

export default AppHeader;
