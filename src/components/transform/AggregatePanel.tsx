import React, { useState } from 'react';
import { Card, Button, Space, Select, Form, Typography, Checkbox, Divider } from 'antd';
import {
  BarChartOutlined,
  PlayCircleOutlined,
  PlusOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { useDataStore } from '@stores/dataStore';
import { useUIStore } from '@stores/uiStore';
import type { DataColumn, DataRow } from '@types/index';

const { Title, Text } = Typography;
const { Option } = Select;

interface AggregationConfig {
  column: string;
  function: 'sum' | 'avg' | 'count' | 'min' | 'max' | 'first' | 'last';
  alias: string;
}

export const AggregatePanel: React.FC = () => {
  const currentDataset = useDataStore((state) => state.getCurrentDataset());
  const { updateDataset } = useDataStore();
  const { addNotification } = useUIStore();

  const [groupBy, setGroupBy] = useState<string[]>([]);
  const [aggregations, setAggregations] = useState<AggregationConfig[]>([]);
  const [loading, setLoading] = useState(false);

  if (!currentDataset) {
    return (
      <Card>
        <Text type="secondary">请先导入数据集</Text>
      </Card>
    );
  }

  const { columns, rows, id: datasetId } = currentDataset;

  const functionOptions = [
    { label: '求和 (SUM)', value: 'sum' },
    { label: '平均值 (AVG)', value: 'avg' },
    { label: '计数 (COUNT)', value: 'count' },
    { label: '最小值 (MIN)', value: 'min' },
    { label: '最大值 (MAX)', value: 'max' },
    { label: '第一个值 (FIRST)', value: 'first' },
    { label: '最后一个值 (LAST)', value: 'last' },
  ];

  const addAggregation = () => {
    setAggregations([
      ...aggregations,
      {
        column: columns[0]?.name || '',
        function: 'sum',
        alias: `agg_${aggregations.length + 1}`,
      },
    ]);
  };

  const removeAggregation = (index: number) => {
    setAggregations(aggregations.filter((_, i) => i !== index));
  };

  const updateAggregation = (index: number, updates: Partial<AggregationConfig>) => {
    setAggregations(
      aggregations.map((agg, i) => (i === index ? { ...agg, ...updates } : agg)),
    );
  };

  const handleAggregate = () => {
    if (groupBy.length === 0 && aggregations.length === 0) {
      addNotification({
        type: 'error',
        message: '请选择分组列或聚合函数',
      });
      return;
    }

    setLoading(true);

    setTimeout(() => {
      try {
        const groups = new Map<string, DataRow[]>();

        rows.forEach((row) => {
          const key = groupBy.map((col) => String(row[col] || '')).join('|');
          if (!groups.has(key)) {
            groups.set(key, []);
          }
          groups.get(key)!.push(row);
        });

        const newRows = Array.from(groups.entries()).map(([key, groupRows]) => {
          const newRow: DataRow = {};

          groupBy.forEach((col) => {
            newRow[col] = groupRows[0][col];
          });

          aggregations.forEach((agg) => {
            const values = groupRows.map((r) => r[agg.column]);
            let result: unknown = null;

            switch (agg.function) {
              case 'sum':
                result = values.reduce((sum, v) => sum + (Number(v) || 0), 0);
                break;
              case 'avg':
                result = values.reduce((sum, v) => sum + (Number(v) || 0), 0) / values.length;
                break;
              case 'count':
                result = values.length;
                break;
              case 'min':
                result = Math.min(...values.map((v) => Number(v) || 0));
                break;
              case 'max':
                result = Math.max(...values.map((v) => Number(v) || 0));
                break;
              case 'first':
                result = values[0];
                break;
              case 'last':
                result = values[values.length - 1];
                break;
            }

            newRow[agg.alias] = result;
          });

          return newRow;
        });

        const newColumns: DataColumn[] = [
          ...groupBy.map((col, index) => ({
            id: `col_${index}`,
            name: col,
            type: 'string',
            index,
            visible: true,
          })),
          ...aggregations.map((agg, index) => ({
            id: `col_${groupBy.length + index}`,
            name: agg.alias,
            type: 'number',
            index: groupBy.length + index,
            visible: true,
          })),
        ];

        updateDataset(datasetId, {
          columns: newColumns,
          columnCount: newColumns.length,
          rows: newRows,
          rowCount: newRows.length,
        });

        addNotification({
          type: 'success',
          message: '聚合完成',
          description: `已生成 ${newRows.length} 条聚合数据`,
        });
      } catch (error) {
        addNotification({
          type: 'error',
          message: '聚合失败',
          description: error instanceof Error ? error.message : '未知错误',
        });
      } finally {
        setLoading(false);
      }
    }, 100);
  };

  return (
    <Card title={<Title level={4}>聚合统计</Title>}>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Card size="small" title="分组列">
          <Select
            mode="multiple"
            placeholder="选择分组列（可选）"
            value={groupBy}
            onChange={setGroupBy}
            style={{ width: '100%' }}
            options={columns.map((col) => ({ label: col.name, value: col.name }))}
          />
        </Card>

        <Card size="small" title="聚合函数">
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            {aggregations.map((agg, index) => (
              <Space key={index} style={{ width: '100%' }}>
                <Select
                  value={agg.column}
                  onChange={(value) => updateAggregation(index, { column: value })}
                  style={{ width: 200 }}
                  placeholder="列"
                >
                  {columns.map((col) => (
                    <Option key={col.name} value={col.name}>
                      {col.name}
                    </Option>
                  ))}
                </Select>

                <Select
                  value={agg.function}
                  onChange={(value) => updateAggregation(index, { function: value as any })}
                  style={{ width: 150 }}
                >
                  {functionOptions.map((opt) => (
                    <Option key={opt.value} value={opt.value}>
                      {opt.label}
                    </Option>
                  ))}
                </Select>

                <Input
                  value={agg.alias}
                  onChange={(e) => updateAggregation(index, { alias: e.target.value })}
                  placeholder="别名"
                  style={{ width: 150 }}
                />

                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => removeAggregation(index)}
                />
              </Space>
            ))}

            <Button icon={<PlusOutlined />} onClick={addAggregation} block>
              添加聚合
            </Button>
          </Space>
        </Card>

        <Divider />

        <Card size="small" title={<Space><BarChartOutlined /> 聚合说明</Space>}>
          <Space direction="vertical" size="small">
            <Text>• 分组列：按指定列对数据进行分组</Text>
            <Text>• 聚合函数：对每组数据执行计算</Text>
            <Text>• 别名：聚合结果的新列名</Text>
            <Text>• 不选择分组列时，对全部数据聚合</Text>
          </Space>
        </Card>

        <Button
          type="primary"
          icon={<PlayCircleOutlined />}
          onClick={handleAggregate}
          loading={loading}
          block
          size="large"
        >
          执行聚合
        </Button>
      </Space>
    </Card>
  );
};
