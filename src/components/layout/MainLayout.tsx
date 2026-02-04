import React from 'react';
import { Layout } from 'antd';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { useUIStore } from '@stores/uiStore';

const { Content } = Layout;

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { sidebarCollapsed, theme } = useUIStore();

  return (
    <Layout style={{ minHeight: '100vh' }} className={theme}>
      <Header />
      <Layout>
        <Sidebar />
        <Layout
          style={{
            marginLeft: sidebarCollapsed ? 80 : 200,
            transition: 'all 0.2s',
          }}
        >
          <Content
            style={{
              margin: '24px 16px',
              padding: 24,
              minHeight: 280,
              background: theme === 'dark' ? '#141414' : '#fff',
              borderRadius: 8,
            }}
          >
            {children}
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
};
