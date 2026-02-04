import React, { useState } from 'react';
import { Card, Button, Space, Input, Form, Typography, Alert, Select } from 'antd';
import {
  FunctionOutlined,
  PlayCircleOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { useDataStore } from '@stores/dataStore';
import { useUIStore } from '@stores/uiStore';
import { HyperFormula } from 'hyperformula';
import type { DataColumn, DataRow } from '@types/index';

const { Title, Text } = Typography;
const { Option } = Select;

export const FormulaPanel: React.FC = () => {
  const currentDataset = useDataStore((state) => state.getCurrentDataset());
  const { updateDataset } = useDataStore();
  const { addNotification } = useUIStore();

  const [newColumnName, setNewColumnName] = useState('');
  const [formula, setFormula] = useState('');
  const [loading, setLoading] = useState(false);

  if (!currentDataset) {
    return (
      <Card>
        <Text type="secondary">请先导入数据集</Text>
      </Card>
    );
  }

  const { columns, rows, id: datasetId } = currentDataset;

  const handleApplyFormula = () => {
    if (!newColumnName.trim()) {
      addNotification({
        type: 'error',
        message: '请输入新列名',
      });
      return;
    }

    if (!formula.trim()) {
      addNotification({
        type: 'error',
        message: '请输入公式',
      });
      return;
    }

    setLoading(true);

    try {
      const hf = HyperFormula.buildEmpty({
        licenseKey: 'gpl-v3',
      });

      const columnNames = columns.map((c) => c.name);
      const sheetData = rows.map((row) => columnNames.map((col) => row[col]));

      hf.addSheet('data', sheetData, columnNames);

      const newColumnId = `col_${Date.now()}`;

      const results = hf.getSheet('data').getRange({
        startRow: 1,
        endRow: rows.length,
        startColumn: 1,
        endColumn: columnNames.length + 1,
      })._rawValues;

      const newRows = rows.map((row, index) => {
        const newRow = { ...row };
        newRow[newColumnName] = results[index]?.[0] || null;
        return newRow;
      });

      const newColumn: DataColumn = {
        id: newColumnId,
        name: newColumnName,
        type: 'string',
        index: columns.length,
        visible: true,
      };

      updateDataset(datasetId, {
        columns: [...columns, newColumn],
        columnCount: columns.length + 1,
        rows: newRows,
      });

      addNotification({
        type: 'success',
        message: '公式计算成功',
        description: `已添加列 "${newColumnName}"`,
      });

      setNewColumnName('');
      setFormula('');
    } catch (error) {
      addNotification({
        type: 'error',
        message: '公式计算失败',
        description: error instanceof Error ? error.message : '未知错误',
      });
    } finally {
      setLoading(false);
    }
  };

  const formulaExamples = [
    { label: '字符串拼接', value: '=CONCATENATE(A2, " ", B2)' },
    { label: '求和', value: '=SUM(A2:A10)' },
    { label: '平均值', value: '=AVERAGE(A2:A10)' },
    { label: '条件判断', value: '=IF(A2>100, "高", "低")' },
    { label: '日期差', value: '=DATEDIF(A2, B2, "d")' },
    { label: '字符串长度', value: '=LEN(A2)' },
    { label: '截取字符串', value: '=LEFT(A2, 5)' },
  ];

  return (
    <Card title={<Title level={4}>公式计算</Title>}>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Alert
          message="公式说明"
          description={
            <Space direction="vertical" size={0}>
              <Text>• 使用列名引用数据，如 A2, B2</Text>
              <Text>• 支持 Excel 风格公式</Text>
              <Text>• 新列将添加到数据集末尾</Text>
            </Space>
          }
          type="info"
          showIcon
          icon={<InfoCircleOutlined />}
        />

        <Form layout="vertical">
          <Form.Item label="新列名" required>
            <Input
              value={newColumnName}
              onChange={(e) => setNewColumnName(e.target.value)}
              placeholder="请输入新列名"
              prefix={<FunctionOutlined />}
            />
          </Form.Item>

          <Form.Item label="公式" required>
            <Input.TextArea
              value={formula}
              onChange={(e) => setFormula(e.target.value)}
              placeholder="输入公式，如 =A2+B2"
              rows={3}
              style={{ fontFamily: 'monospace' }}
            />
          </Form.Item>

          <Form.Item label="快速示例">
            <Select
              placeholder="选择公式示例"
              onChange={(value) => setFormula(value)}
              style={{ width: '100%' }}
            >
              {formulaExamples.map((example) => (
                <Option key={example.value} value={example.value}>
                  {example.label}: {example.value}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>

        <Card size="small" title="可用列">
          <Space wrap>
            {columns.map((col, index) => (
              <Text key={col.id} code style={{ margin: '4px' }}>
                {String.fromCharCode(65 + index)}2 = {col.name}
              </Text>
            ))}
          </Space>
        </Card>

        <Button
          type="primary"
          icon={<PlayCircleOutlined />}
          onClick={handleApplyFormula}
          loading={loading}
          block
          size="large"
        >
          应用公式
        </Button>
      </Space>
    </Card>
  );
};
