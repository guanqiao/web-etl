import React, { useState } from 'react';
import { Card, Button, Space, Select, Input, Radio, Typography, Divider } from 'antd';
import {
  FilterOutlined,
  SortAscendingOutlined,
  PlusOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { useDataStore } from '@stores/dataStore';
import { useUIStore } from '@stores/uiStore';
import type { DataRow } from '@types/index';

const { Title, Text } = Typography;
const { Option } = Select;

interface FilterCondition {
  id: string;
  column: string;
  operator: string;
  value: string;
}

interface SortConfig {
  column: string;
  direction: 'asc' | 'desc';
}

export const FilterSortPanel: React.FC = () => {
  const currentDataset = useDataStore((state) => state.getCurrentDataset());
  const { updateDataset } = useDataStore();
  const { addNotification } = useUIStore();

  const [filters, setFilters] = useState<FilterCondition[]>([]);
  const [filterLogic, setFilterLogic] = useState<'AND' | 'OR'>('AND');
  const [sorts, setSorts] = useState<SortConfig[]>([]);
  const [loading, setLoading] = useState(false);

  if (!currentDataset) {
    return (
      <Card>
        <Text type="secondary">请先导入数据集</Text>
      </Card>
    );
  }

  const { columns, rows, id: datasetId } = currentDataset;

  const operatorOptions = [
    { label: '等于', value: 'eq' },
    { label: '不等于', value: 'ne' },
    { label: '大于', value: 'gt' },
    { label: '大于等于', value: 'gte' },
    { label: '小于', value: 'lt' },
    { label: '小于等于', value: 'lte' },
    { label: '包含', value: 'contains' },
    { label: '不包含', value: 'notContains' },
    { label: '开始于', value: 'startsWith' },
    { label: '结束于', value: 'endsWith' },
    { label: '为空', value: 'isNull' },
    { label: '不为空', value: 'isNotNull' },
  ];

  const addFilter = () => {
    setFilters([
      ...filters,
      {
        id: `filter_${Date.now()}`,
        column: columns[0]?.name || '',
        operator: 'eq',
        value: '',
      },
    ]);
  };

  const removeFilter = (id: string) => {
    setFilters(filters.filter((f) => f.id !== id));
  };

  const updateFilter = (id: string, updates: Partial<FilterCondition>) => {
    setFilters(filters.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  };

  const addSort = () => {
    setSorts([
      ...sorts,
      {
        column: columns[0]?.name || '',
        direction: 'asc',
      },
    ]);
  };

  const removeSort = (index: number) => {
    setSorts(sorts.filter((_, i) => i !== index));
  };

  const updateSort = (index: number, updates: Partial<SortConfig>) => {
    setSorts(sorts.map((s, i) => (i === index ? { ...s, ...updates } : s)));
  };

  const applyFilters = () => {
    setLoading(true);

    setTimeout(() => {
      let filteredRows = [...rows];

      filters.forEach((filter) => {
        if (filter.operator === 'isNull') {
          filteredRows = filteredRows.filter((row) => {
            const val = row[filter.column];
            return val === null || val === undefined || val === '';
          });
        } else if (filter.operator === 'isNotNull') {
          filteredRows = filteredRows.filter((row) => {
            const val = row[filter.column];
            return val !== null && val !== undefined && val !== '';
          });
        } else if (filter.value === '') {
          return;
        }

        const compareValue = filter.value.toLowerCase();
        filteredRows = filteredRows.filter((row) => {
          const val = String(row[filter.column] || '').toLowerCase();

          switch (filter.operator) {
            case 'eq':
              return val === compareValue;
            case 'ne':
              return val !== compareValue;
            case 'gt':
              return Number(val) > Number(compareValue);
            case 'gte':
              return Number(val) >= Number(compareValue);
            case 'lt':
              return Number(val) < Number(compareValue);
            case 'lte':
              return Number(val) <= Number(compareValue);
            case 'contains':
              return val.includes(compareValue);
            case 'notContains':
              return !val.includes(compareValue);
            case 'startsWith':
              return val.startsWith(compareValue);
            case 'endsWith':
              return val.endsWith(compareValue);
            default:
              return true;
          }
        });
      });

      updateDataset(datasetId, {
        rows: filteredRows,
        rowCount: filteredRows.length,
      });

      setLoading(false);
      addNotification({
        type: 'success',
        message: '筛选完成',
        description: `已筛选出 ${filteredRows.length} 条数据`,
      });
    }, 100);
  };

  const applySorts = () => {
    setLoading(true);

    setTimeout(() => {
      let sortedRows = [...rows];

      sorts.forEach((sort, index) => {
        sortedRows.sort((a, b) => {
          const valA = a[sort.column];
          const valB = b[sort.column];

          if (valA === valB) return 0;

          let comparison = 0;
          if (typeof valA === 'number' && typeof valB === 'number') {
            comparison = valA - valB;
          } else {
            comparison = String(valA || '').localeCompare(String(valB || ''));
          }

          return sort.direction === 'asc' ? comparison : -comparison;
        });
      });

      updateDataset(datasetId, {
        rows: sortedRows,
      });

      setLoading(false);
      addNotification({
        type: 'success',
        message: '排序完成',
        description: `已按 ${sorts.map((s) => s.column).join(', ')} 排序`,
      });
    }, 100);
  };

  const resetFilters = () => {
    addNotification({
      type: 'info',
      message: '提示',
      description: '请重新导入数据以重置筛选',
    });
  };

  return (
    <Card title={<Title level={4}>筛选和排序</Title>}>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Card size="small" title={<Space><FilterOutlined /> 筛选</Space>}>
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <Radio.Group
              value={filterLogic}
              onChange={(e) => setFilterLogic(e.target.value)}
              optionType="button"
              buttonStyle={{ width: '100%' }}
              style={{ width: '100%' }}
            >
              <Radio.Button value="AND">AND (满足所有条件)</Radio.Button>
              <Radio.Button value="OR">OR (满足任一条件)</Radio.Button>
            </Radio.Group>

            <Space direction="vertical" style={{ width: '100%' }} size="small">
              {filters.map((filter) => (
                <Space key={filter.id} style={{ width: '100%' }}>
                  <Select
                    value={filter.column}
                    onChange={(value) => updateFilter(filter.id, { column: value })}
                    style={{ width: 150 }}
                    placeholder="列"
                  >
                    {columns.map((col) => (
                      <Option key={col.name} value={col.name}>
                        {col.name}
                      </Option>
                    ))}
                  </Select>

                  <Select
                    value={filter.operator}
                    onChange={(value) => updateFilter(filter.id, { operator: value })}
                    style={{ width: 120 }}
                  >
                    {operatorOptions.map((opt) => (
                      <Option key={opt.value} value={opt.value}>
                        {opt.label}
                      </Option>
                    ))}
                  </Select>

                  <Input
                    value={filter.value}
                    onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
                    placeholder="值"
                    style={{ width: 150 }}
                    disabled={['isNull', 'isNotNull'].includes(filter.operator)}
                  />

                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => removeFilter(filter.id)}
                  />
                </Space>
              ))}
            </Space>

            <Button icon={<PlusOutlined />} onClick={addFilter} block>
              添加筛选条件
            </Button>

            <Button type="primary" onClick={applyFilters} loading={loading} block>
              应用筛选
            </Button>

            <Button onClick={resetFilters} block>
              重置筛选
            </Button>
          </Space>
        </Card>

        <Divider />

        <Card size="small" title={<Space><SortAscendingOutlined /> 排序</Space>}>
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <Space direction="vertical" style={{ width: '100%' }} size="small">
              {sorts.map((sort, index) => (
                <Space key={index} style={{ width: '100%' }}>
                  <Select
                    value={sort.column}
                    onChange={(value) => updateSort(index, { column: value })}
                    style={{ width: 200 }}
                    placeholder="列"
                  >
                    {columns.map((col) => (
                      <Option key={col.name} value={col.name}>
                        {col.name}
                      </Option>
                    ))}
                  </Select>

                  <Radio.Group
                    value={sort.direction}
                    onChange={(e) => updateSort(index, { direction: e.target.value })}
                    optionType="button"
                  >
                    <Radio.Button value="asc">升序</Radio.Button>
                    <Radio.Button value="desc">降序</Radio.Button>
                  </Radio.Group>

                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => removeSort(index)}
                  />
                </Space>
              ))}
            </Space>

            <Button icon={<PlusOutlined />} onClick={addSort} block>
              添加排序
            </Button>

            <Button type="primary" onClick={applySorts} loading={loading} block>
              应用排序
            </Button>
          </Space>
        </Card>
      </Space>
    </Card>
  );
};
