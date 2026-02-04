import React from 'react';
import { Card, Table, Typography, Space, Tag, Empty } from 'antd';
import { useDataStore } from '@stores/dataStore';
import type { DataColumn, DataRow } from '@types/index';

const { Title, Text } = Typography;

export const DataPreview: React.FC = () => {
  const currentDataset = useDataStore((state) => state.getCurrentDataset());

  if (!currentDataset) {
    return (
      <Card style={{ marginTop: 24 }}>
        <Empty
          description="暂无数据，请先导入数据"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </Card>
    );
  }

  const { columns, rows, name, rowCount, columnCount } = currentDataset;

  // Generate table columns for Ant Design Table
  const tableColumns = columns
    .filter((col) => col.visible !== false)
    .map((col) => ({
      title: (
        <Space direction="vertical" size={0}>
          <Text strong>{col.name}</Text>
          <Tag size="small" color="blue">
            {col.type}
          </Tag>
        </Space>
      ),
      dataIndex: col.name,
      key: col.id,
      ellipsis: true,
      width: 150,
      render: (value: unknown) => {
        if (value === null || value === undefined) {
          return <Text type="secondary">NULL</Text>;
        }
        if (typeof value === 'boolean') {
          return <Tag color={value ? 'green' : 'red'}>{value ? 'true' : 'false'}</Tag>;
        }
        return String(value);
      },
    }));

  // Add row index column
  const columnsWithIndex = [
    {
      title: '#',
      key: 'index',
      width: 60,
      fixed: 'left' as const,
      render: (_: unknown, __: unknown, index: number) => index + 1,
    },
    ...tableColumns,
  ];

  return (
    <Card style={{ marginTop: 24 }}>
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <Space align="center" style={{ justifyContent: 'space-between', width: '100%' }}>
          <Title level={4} style={{ margin: 0 }}>
            数据预览: {name}
          </Title>
          <Space>
            <Tag color="blue">{rowCount} 行</Tag>
            <Tag color="green">{columnCount} 列</Tag>
          </Space>
        </Space>

        <Table
          dataSource={rows.slice(0, 100)}
          columns={columnsWithIndex}
          rowKey={(_, index) => `row_${index}`}
          scroll={{ x: 'max-content', y: 400 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
          size="small"
          bordered
        />

        {rows.length > 100 && (
          <Text type="secondary">
            仅显示前 100 行，共 {rows.length} 行数据
          </Text>
        )}
      </Space>
    </Card>
  );
};
