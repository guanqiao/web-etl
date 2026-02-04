import React, { useState } from 'react';
import { Card, Button, Space, Select, Form, Typography, Radio, Divider } from 'antd';
import {
  MergeOutlined,
  PlayCircleOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { useDataStore } from '@stores/dataStore';
import { useUIStore } from '@stores/uiStore';
import type { DataColumn, DataRow } from '@types/index';

const { Title, Text } = Typography;
const { Option } = Select;

export const JoinPanel: React.FC = () => {
  const currentDataset = useDataStore((state) => state.getCurrentDataset());
  const { datasets, updateDataset } = useDataStore();
  const { addNotification } = useUIStore();

  const [joinType, setJoinType] = useState<'join' | 'union'>('join');
  const [joinMethod, setJoinMethod] = useState<'inner' | 'left' | 'right' | 'full'>('inner');
  const [leftKey, setLeftKey] = useState('');
  const [rightDatasetId, setRightDatasetId] = useState('');
  const [rightKey, setRightKey] = useState('');
  const [loading, setLoading] = useState(false);

  if (!currentDataset) {
    return (
      <Card>
        <Text type="secondary">请先导入数据集</Text>
      </Card>
    );
  }

  const { columns, rows, id: datasetId, name: leftDatasetName } = currentDataset;

  const rightDataset = datasets.find((d) => d.id === rightDatasetId);

  const handleJoin = () => {
    if (!rightDataset) {
      addNotification({
        type: 'error',
        message: '请选择右侧数据集',
      });
      return;
    }

    if (!leftKey || !rightKey) {
      addNotification({
        type: 'error',
        message: '请选择连接键',
      });
      return;
    }

    setLoading(true);

    setTimeout(() => {
      try {
        let newRows: DataRow[] = [];

        if (joinType === 'union') {
          newRows = [...rows, ...rightDataset.rows];
        } else {
          const rightMap = new Map<string, DataRow[]>();
          rightDataset.rows.forEach((row) => {
            const key = String(row[rightKey] || '');
            if (!rightMap.has(key)) {
              rightMap.set(key, []);
            }
            rightMap.get(key)!.push(row);
          });

          rows.forEach((leftRow) => {
            const leftKeyValue = String(leftRow[leftKey] || '');
            const rightRows = rightMap.get(leftKeyValue) || [];

            switch (joinMethod) {
              case 'inner':
                if (rightRows.length > 0) {
                  rightRows.forEach((rightRow) => {
                    newRows.push({ ...leftRow, ...rightRow });
                  });
                }
                break;
              case 'left':
                if (rightRows.length > 0) {
                  rightRows.forEach((rightRow) => {
                    newRows.push({ ...leftRow, ...rightRow });
                  });
                } else {
                  newRows.push({ ...leftRow });
                }
                break;
              case 'right':
                rightRows.forEach((rightRow) => {
                  newRows.push({ ...leftRow, ...rightRow });
                });
                break;
              case 'full':
                if (rightRows.length > 0) {
                  rightRows.forEach((rightRow) => {
                    newRows.push({ ...leftRow, ...rightRow });
                  });
                } else {
                  newRows.push({ ...leftRow });
                }
                break;
            }
          });
        }

        const newColumns: DataColumn[] = [...columns];
        const usedRightColumns = new Set<string>();

        newRows.forEach((row) => {
          Object.keys(row).forEach((key) => {
            if (!newColumns.find((c) => c.name === key)) {
              newColumns.push({
                id: `col_${newColumns.length}`,
                name: key,
                type: 'string',
                index: newColumns.length,
                visible: true,
              });
              usedRightColumns.add(key);
            }
          });
        });

        updateDataset(datasetId, {
          columns: newColumns,
          columnCount: newColumns.length,
          rows: newRows,
          rowCount: newRows.length,
        });

        addNotification({
          type: 'success',
          message: '数据合并完成',
          description: `已生成 ${newRows.length} 条数据`,
        });
      } catch (error) {
        addNotification({
          type: 'error',
          message: '数据合并失败',
          description: error instanceof Error ? error.message : '未知错误',
        });
      } finally {
        setLoading(false);
      }
    }, 100);
  };

  return (
    <Card title={<Title level={4}>数据合并</Title>}>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Card size="small" title="左侧数据集（当前）">
          <Space direction="vertical" size="small">
            <Text strong>数据集: {leftDatasetName}</Text>
            <Text>行数: {rows.length}</Text>
            <Text>列数: {columns.length}</Text>
          </Space>
        </Card>

        <Radio.Group value={joinType} onChange={(e) => setJoinType(e.target.value)}>
          <Radio.Button value="join">Join (连接)</Radio.Button>
          <Radio.Button value="union">Union (追加)</Radio.Button>
        </Radio.Group>

        {joinType === 'join' && (
          <>
            <Card size="small" title="Join 类型">
              <Radio.Group value={joinMethod} onChange={(e) => setJoinMethod(e.target.value)}>
                <Radio.Button value="inner">Inner Join (内连接)</Radio.Button>
                <Radio.Button value="left">Left Join (左连接)</Radio.Button>
                <Radio.Button value="right">Right Join (右连接)</Radio.Button>
                <Radio.Button value="full">Full Join (全连接)</Radio.Button>
              </Radio.Group>
            </Card>

            <Form layout="vertical">
              <Form.Item label="左侧连接键" required>
                <Select
                  value={leftKey}
                  onChange={setLeftKey}
                  placeholder="选择连接键"
                  style={{ width: '100%' }}
                >
                  {columns.map((col) => (
                    <Option key={col.name} value={col.name}>
                      {col.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item label="右侧数据集" required>
                <Select
                  value={rightDatasetId}
                  onChange={setRightDatasetId}
                  placeholder="选择数据集"
                  style={{ width: '100%' }}
                >
                  {datasets
                    .filter((d) => d.id !== datasetId)
                    .map((d) => (
                      <Option key={d.id} value={d.id}>
                        {d.name} ({d.rowCount} 行)
                      </Option>
                    ))}
                </Select>
              </Form.Item>

              {rightDataset && (
                <Form.Item label="右侧连接键" required>
                  <Select
                    value={rightKey}
                    onChange={setRightKey}
                    placeholder="选择连接键"
                    style={{ width: '100%' }}
                  >
                    {rightDataset.columns.map((col) => (
                      <Option key={col.name} value={col.name}>
                        {col.name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              )}
            </Form>
          </>
        )}

        {joinType === 'union' && (
          <Card size="small" title="Union (追加数据）">
            <Select
              value={rightDatasetId}
              onChange={setRightDatasetId}
              placeholder="选择要追加的数据集"
              style={{ width: '100%' }}
            >
              {datasets
                .filter((d) => d.id !== datasetId)
                .map((d) => (
                  <Option key={d.id} value={d.id}>
                    {d.name} ({d.rowCount} 行)
                  </Option>
                ))}
            </Select>
          </Card>
        )}

        <Divider />

        <Card size="small" title={<Space><MergeOutlined /> 合并说明</Space>}>
          <Space direction="vertical" size="small">
            <Text>• Join: 根据键值连接两个数据集</Text>
            <Text>• Union: 将一个数据集追加到另一个</Text>
            <Text>• Inner Join: 只保留匹配的行</Text>
            <Text>• Left Join: 保留左表所有行</Text>
            <Text>• Right Join: 保留右表所有行</Text>
            <Text>• Full Join: 保留所有行</Text>
          </Space>
        </Card>

        <Button
          type="primary"
          icon={<PlayCircleOutlined />}
          onClick={handleJoin}
          loading={loading}
          block
          size="large"
        >
          执行合并
        </Button>
      </Space>
    </Card>
  );
};
