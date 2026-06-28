import type { AppProps } from 'next/app';
import { useState } from 'react';
import { ConfigProvider, theme } from 'antd';
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  const [isDark, setIsDark] = useState(false);

  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: { colorPrimary: '#1677ff' },
      }}
    >
      <Component {...pageProps} isDark={isDark} onToggleTheme={() => setIsDark((prev) => !prev)} />
    </ConfigProvider>
  );
}
