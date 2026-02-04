import React, { useState } from 'react';
import { Card, Button, Space, Input, Modal, Form, Select, message, Popconfirm, Typography } from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  SwapOutlined,
} from '@ant-design/icons';
import { useDataStore } from '@stores/dataStore';
import { useUIStore } from '@stores/uiStore';
import type { DataColumn } from '@types/index';

const { Title, Text } = Typography;
const { Option } = Select;

export const ColumnOperations: React.FC = () => {
  const currentDataset = useDataStore((state) => state.getCurrentDataset());
  const { addColumn, deleteColumn, renameColumn, reorderColumns } = useDataStore();
  const { addNotification } = useUIStore();

  const [addModalVisible, setAddModalVisible] = useState(false);
  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [selectedColumnId, setSelectedColumnId] = useState<string>('');
  const [newColumnName, setNewColumnName] = useState('');
  const [addColumnType, setAddColumnType] = useState<'empty' | 'constant' | 'sequence'>('empty');
  const [constantValue, setConstantValue] = useState('');
  const [sequenceStart, setSequenceStart] = useState(1);

  if (!currentDataset) {
    return (
      <Card>
        <Text type="secondary">请先导入数据集</Text>
      </Card>
    );
  }

  const { columns, id: datasetId } = currentDataset;

  const handleAddColumn = () => {
    const newColumn: DataColumn = {
      id: `col_${Date.now()}`,
      name: newColumnName || `新列_${columns.length + 1}`,
      type: 'string',
      index: columns.length,
      visible: true,
    };

    addColumn(datasetId, newColumn);

    if (addColumnType === 'constant') {
      addNotification({
        type: 'info',
        message: '提示',
        description: '请使用数据清洗功能填充常量值',
      });
    }

    setAddModalVisible(false);
    setNewColumnName('');
    setConstantValue('');
    setSequenceStart(1);
    addNotification({
      type: 'success',
      message: '列添加成功',
      description: `已添加列 "${newColumn.name}"`,
    });
  };

  const handleDeleteColumn = (columnId: string) => {
    deleteColumn(datasetId, columnId);
    addNotification({
      type: 'success',
      message: '列删除成功',
    });
  };

  const handleRenameColumn = () => {
    if (!newColumnName.trim()) {
      message.error('请输入列名');
      return;
    }

    renameColumn(datasetId, selectedColumnId, newColumnName.trim());
    setRenameModalVisible(false);
    setNewColumnName('');
    addNotification({
      type: 'success',
      message: '列重命名成功',
    });
  };

  const openRenameModal = (column: DataColumn) => {
    setSelectedColumnId(column.id);
    setNewColumnName(column.name);
    setRenameModalVisible(true);
  };

  return (
    <Card
      title={<Title level={4}>列操作</Title>}
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddModalVisible(true)}>
          添加列
        </Button>
      }
    >
      <Space direction="vertical" style={{ width: '100%' }} size="small">
        {columns.map((column) => (
          <Space
            key={column.id}
            style={{
              width: '100%',
              justifyContent: 'space-between',
              padding: '8px 12px',
              background: 'var(--ant-color-bg-layout)',
              borderRadius: 4,
            }}
          >
            <Space>
              <Text strong>{column.name}</Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                ({column.type})
              </Text>
            </Space>

            <Space>
              <Button
                type="text"
                size="small"
                icon={<EditOutlined />}
                onClick={() => openRenameModal(column)}
              />
              <Popconfirm
                title="确定要删除此列吗？"
                description="删除后无法恢复"
                onConfirm={() => handleDeleteColumn(column.id)}
                okText="确定"
                cancelText="取消"
              >
                <Button type="text" size="small" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            </Space>
          </Space>
        ))}
      </Space>

      <Modal
        title="添加列"
        open={addModalVisible}
        onOk={handleAddColumn}
        onCancel={() => setAddModalVisible(false)}
        okText="添加"
        cancelText="取消"
      >
        <Form layout="vertical">
          <Form.Item label="列名" required>
            <Input
              value={newColumnName}
              onChange={(e) => setNewColumnName(e.target.value)}
              placeholder="请输入列名"
            />
          </Form.Item>

          <Form.Item label="列类型">
            <Select
              value={addColumnType}
              onChange={setAddColumnType}
              style={{ width: '100%' }}
            >
              <Option value="empty">空列</Option>
              <Option value="constant">常量列</Option>
              <Option value="sequence">序列列</Option>
            </Select>
          </Form.Item>

          {addColumnType === 'constant' && (
            <Form.Item label="常量值">
              <Input
                value={constantValue}
                onChange={(e) => setConstantValue(e.target.value)}
                placeholder="请输入常量值"
              />
            </Form.Item>
          )}

          {addColumnType === 'sequence' && (
            <Form.Item label="起始值">
              <Input
                type="number"
                value={sequenceStart}
                onChange={(e) => setSequenceStart(Number(e.target.value))}
              />
            </Form.Item>
          )}
        </Form>
      </Modal>

      <Modal
        title="重命名列"
        open={renameModalVisible}
        onOk={handleRenameColumn}
        onCancel={() => setRenameModalVisible(false)}
        okText="确定"
        cancelText="取消"
      >
        <Form layout="vertical">
          <Form.Item label="新列名" required>
            <Input
              value={newColumnName}
              onChange={(e) => setNewColumnName(e.target.value)}
              placeholder="请输入新列名"
            />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};
