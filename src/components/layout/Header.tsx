import React from 'react';
import { Layout, Button, Space, Typography, Badge, theme as antTheme } from 'antd';
import {
  MoonOutlined,
  SunOutlined,
  GithubOutlined,
  BellOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useUIStore } from '@stores/uiStore';

const { Header: AntHeader } = Layout;
const { Title } = Typography;

export const Header: React.FC = () => {
  const { theme, toggleTheme, notifications } = useUIStore();
  const { token } = antTheme.useToken();

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <AntHeader
      style={{
        background: token.colorBgContainer,
        borderBottom: `1px solid ${token.colorBorderSecondary}`,
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      }}
    >
      <Space align="center">
        <img
          src="/vite.svg"
          alt="Web ETL"
          style={{ width: 32, height: 32 }}
        />
        <Title level={4} style={{ margin: 0, color: token.colorText }}>
          Web ETL
        </Title>
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          纯前端数据转换工具
        </Typography.Text>
      </Space>

      <Space>
        <Button
          type="text"
          icon={theme === 'dark' ? <SunOutlined /> : <MoonOutlined />}
          onClick={toggleTheme}
          title={theme === 'dark' ? '切换到亮色模式' : '切换到暗色模式'}
        />
        <Badge count={unreadCount} size="small">
          <Button type="text" icon={<BellOutlined />} />
        </Badge>
        <Button type="text" icon={<SettingOutlined />} />
        <Button
          type="text"
          icon={<GithubOutlined />}
          href="https://github.com"
          target="_blank"
        />
      </Space>
    </AntHeader>
  );
};
