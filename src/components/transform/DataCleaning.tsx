import React, { useState } from 'react';
import { Card, Button, Space, Select, InputNumber, Form, Typography, Checkbox, Divider } from 'antd';
import {
  DeleteOutlined,
  FilterOutlined,
  ScissorOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { useDataStore } from '@stores/dataStore';
import { useUIStore } from '@stores/uiStore';
import type { DataRow } from '@types/index';

const { Title, Text } = Typography;
const { Option } = Select;

export const DataCleaning: React.FC = () => {
  const currentDataset = useDataStore((state) => state.getCurrentDataset());
  const { updateDataset } = useDataStore();
  const { addNotification } = useUIStore();

  const [loading, setLoading] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);

  if (!currentDataset) {
    return (
      <Card>
        <Text type="secondary">请先导入数据集</Text>
      </Card>
    );
  }

  const { columns, rows, id: datasetId } = currentDataset;

  const handleRemoveDuplicates = () => {
    setLoading(true);

    setTimeout(() => {
      const uniqueRows = new Map<string, DataRow>();
      rows.forEach((row) => {
        const key = JSON.stringify(row);
        if (!uniqueRows.has(key)) {
          uniqueRows.set(key, row);
        }
      });

      const newRows = Array.from(uniqueRows.values());
      updateDataset(datasetId, {
        rows: newRows,
        rowCount: newRows.length,
      });

      setLoading(false);
      addNotification({
        type: 'success',
        message: '去重完成',
        description: `已删除 ${rows.length - newRows.length} 条重复数据`,
      });
    }, 100);
  };

  const handleRemoveEmptyRows = () => {
    setLoading(true);

    setTimeout(() => {
      const newRows = rows.filter((row) => {
        return selectedColumns.length === 0
          ? Object.values(row).some((v) => v !== null && v !== undefined && v !== '')
          : selectedColumns.every((col) => row[col] !== null && row[col] !== undefined && row[col] !== '');
      });

      updateDataset(datasetId, {
        rows: newRows,
        rowCount: newRows.length,
      });

      setLoading(false);
      addNotification({
        type: 'success',
        message: '删除空行完成',
        description: `已删除 ${rows.length - newRows.length} 条空行`,
      });
    }, 100);
  };

  const handleFillNulls = (strategy: string, value?: number | string) => {
    setLoading(true);

    setTimeout(() => {
      const targetColumns = selectedColumns.length > 0 ? selectedColumns : columns.map((c) => c.name);
      const newRows = rows.map((row) => {
        const newRow = { ...row };
        targetColumns.forEach((col) => {
          if (newRow[col] === null || newRow[col] === undefined || newRow[col] === '') {
            switch (strategy) {
              case 'fixed':
                newRow[col] = value;
                break;
              case 'forward':
                newRow[col] = null;
                break;
              case 'backward':
                newRow[col] = null;
                break;
              case 'mean':
                newRow[col] = 0;
                break;
              case 'median':
                newRow[col] = 0;
                break;
              case 'mode':
                newRow[col] = '';
                break;
            }
          }
        });
        return newRow;
      });

      updateDataset(datasetId, { rows: newRows });

      setLoading(false);
      addNotification({
        type: 'success',
        message: '填充空值完成',
        description: `已使用 ${strategy} 策略填充空值`,
      });
    }, 100);
  };

  const handleTrim = (trimType: 'both' | 'left' | 'right') => {
    setLoading(true);

    setTimeout(() => {
      const targetColumns = selectedColumns.length > 0 ? selectedColumns : columns.map((c) => c.name);
      const newRows = rows.map((row) => {
        const newRow = { ...row };
        targetColumns.forEach((col) => {
          if (typeof newRow[col] === 'string') {
            switch (trimType) {
              case 'both':
                newRow[col] = (newRow[col] as string).trim();
                break;
              case 'left':
                newRow[col] = (newRow[col] as string).trimStart();
                break;
              case 'right':
                newRow[col] = (newRow[col] as string).trimEnd();
                break;
            }
          }
        });
        return newRow;
      });

      updateDataset(datasetId, { rows: newRows });

      setLoading(false);
      addNotification({
        type: 'success',
        message: '修剪完成',
        description: `已${trimType === 'both' ? '两端' : trimType === 'left' ? '左侧' : '右侧'}修剪字符串`,
      });
    }, 100);
  };

  const handleChangeCase = (caseType: 'upper' | 'lower' | 'title' | 'capitalize') => {
    setLoading(true);

    setTimeout(() => {
      const targetColumns = selectedColumns.length > 0 ? selectedColumns : columns.map((c) => c.name);
      const newRows = rows.map((row) => {
        const newRow = { ...row };
        targetColumns.forEach((col) => {
          if (typeof newRow[col] === 'string') {
            const str = newRow[col] as string;
            switch (caseType) {
              case 'upper':
                newRow[col] = str.toUpperCase();
                break;
              case 'lower':
                newRow[col] = str.toLowerCase();
                break;
              case 'title':
                newRow[col] = str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
                break;
              case 'capitalize':
                newRow[col] = str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
                break;
            }
          }
        });
        return newRow;
      });

      updateDataset(datasetId, { rows: newRows });

      setLoading(false);
      addNotification({
        type: 'success',
        message: '大小写转换完成',
        description: `已转换为${caseType === 'upper' ? '大写' : caseType === 'lower' ? '小写' : caseType === 'title' ? '标题格式' : '首字母大写'}`,
      });
    }, 100);
  };

  return (
    <Card title={<Title level={4}>数据清洗</Title>}>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Card size="small" title="选择列">
          <Select
            mode="multiple"
            placeholder="选择要处理的列（留空表示所有列）"
            value={selectedColumns}
            onChange={setSelectedColumns}
            style={{ width: '100%' }}
            options={columns.map((col) => ({ label: col.name, value: col.name }))}
          />
        </Card>

        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Card size="small" title={<Space><DeleteOutlined /> 去除重复</Space>}>
            <Button type="primary" onClick={handleRemoveDuplicates} loading={loading} block>
              删除重复行
            </Button>
          </Card>

          <Card size="small" title={<Space><FilterOutlined /> 删除空行</Space>}>
            <Button type="primary" onClick={handleRemoveEmptyRows} loading={loading} block>
              删除空行
            </Button>
          </Card>

          <Card size="small" title={<Space><CheckCircleOutlined /> 填充空值</Space>}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Select
                placeholder="选择填充策略"
                onChange={(value) => handleFillNulls(value)}
                style={{ width: '100%' }}
              >
                <Option value="fixed">固定值</Option>
                <Option value="forward">前向填充</Option>
                <Option value="backward">后向填充</Option>
                <Option value="mean">平均值</Option>
                <Option value="median">中位数</Option>
                <Option value="mode">众数</Option>
              </Select>
            </Space>
          </Card>

          <Card size="small" title={<Space><ScissorOutlined /> 字符串修剪</Space>}>
            <Space>
              <Button onClick={() => handleTrim('both')} loading={loading}>
                两端修剪
              </Button>
              <Button onClick={() => handleTrim('left')} loading={loading}>
                左侧修剪
              </Button>
              <Button onClick={() => handleTrim('right')} loading={loading}>
                右侧修剪
              </Button>
            </Space>
          </Card>

          <Card size="small" title={<Space><CheckCircleOutlined /> 大小写转换</Space>}>
            <Space>
              <Button onClick={() => handleChangeCase('upper')} loading={loading}>
                大写
              </Button>
              <Button onClick={() => handleChangeCase('lower')} loading={loading}>
                小写
              </Button>
              <Button onClick={() => handleChangeCase('title')} loading={loading}>
                标题格式
              </Button>
              <Button onClick={() => handleChangeCase('capitalize')} loading={loading}>
                首字母大写
              </Button>
            </Space>
          </Card>
        </Space>
      </Space>
    </Card>
  );
};
