import React from 'react';
import { Layout, Menu, theme as antTheme } from 'antd';
import {
  ImportOutlined,
  SwapOutlined,
  ExportOutlined,
  NodeIndexOutlined,
  DatabaseOutlined,
  TableOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { useUIStore } from '@stores/uiStore';

const { Sider } = Layout;

const menuItems = [
  {
    key: 'extract',
    icon: <ImportOutlined />,
    label: '数据提取',
    children: [
      { key: 'file', icon: <FileTextOutlined />, label: '文件导入' },
      { key: 'url', icon: <ImportOutlined />, label: 'URL 获取' },
      { key: 'database', icon: <DatabaseOutlined />, label: '数据库' },
      { key: 'manual', icon: <TableOutlined />, label: '手动输入' },
    ],
  },
  {
    key: 'transform',
    icon: <SwapOutlined />,
    label: '数据转换',
    children: [
      { key: 'column', label: '列操作' },
      { key: 'clean', label: '数据清洗' },
      { key: 'filter', label: '筛选排序' },
      { key: 'formula', label: '公式计算' },
      { key: 'aggregate', label: '聚合统计' },
      { key: 'join', label: '数据合并' },
    ],
  },
  {
    key: 'load',
    icon: <ExportOutlined />,
    label: '数据加载',
    children: [
      { key: 'export', label: '文件导出' },
      { key: 'db-export', label: '数据库导出' },
    ],
  },
  {
    key: 'pipeline',
    icon: <NodeIndexOutlined />,
    label: '工作流',
  },
];

export const Sidebar: React.FC = () => {
  const { sidebarCollapsed, toggleSidebar, activeTab, setActiveTab, theme } = useUIStore();
  const { token } = antTheme.useToken();

  const handleMenuClick = ({ key }: { key: string }) => {
    setActiveTab(key);
  };

  return (
    <Sider
      collapsible
      collapsed={sidebarCollapsed}
      onCollapse={toggleSidebar}
      theme={theme === 'dark' ? 'dark' : 'light'}
      style={{
        overflow: 'auto',
        height: 'calc(100vh - 64px)',
        position: 'fixed',
        left: 0,
        top: 64,
        bottom: 0,
        borderRight: `1px solid ${token.colorBorderSecondary}`,
      }}
    >
      <Menu
        theme={theme === 'dark' ? 'dark' : 'light'}
        mode="inline"
        selectedKeys={[activeTab]}
        items={menuItems}
        onClick={handleMenuClick}
        style={{ borderRight: 0 }}
      />
    </Sider>
  );
};
