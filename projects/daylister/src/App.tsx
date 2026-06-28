import React, { useState } from 'react';
import { ConfigProvider, theme, Layout } from 'antd';
import TodoList from './components/TodoList';
import AppHeader from './components/AppHeader';

const App: React.FC = () => {
  const [isDark, setIsDark] = useState(false);

  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: '#1677ff',
        },
      }}
    >
      <Layout style={{ minHeight: '100vh' }}>
        <AppHeader isDark={isDark} onToggleTheme={() => setIsDark((prev) => !prev)} />
        <Layout.Content>
          <TodoList />
        </Layout.Content>
      </Layout>
    </ConfigProvider>
  );
};

export default App;
