import React, { useState } from 'react';
import { Card, Button, Space, Select, Input, Form, Typography, message } from 'antd';
import {
  DownloadOutlined,
  FileTextOutlined,
  FileExcelOutlined,
  FileOutlined,
} from '@ant-design/icons';
import { useDataStore } from '@stores/dataStore';
import { useUIStore } from '@stores/uiStore';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

const { Title, Text } = Typography;
const { Option } = Select;

export const ExportPanel: React.FC = () => {
  const currentDataset = useDataStore((state) => state.getCurrentDataset());
  const { addNotification } = useUIStore();

  const [exportFormat, setExportFormat] = useState<'csv' | 'json' | 'excel'>('csv');
  const [fileName, setFileName] = useState('export');
  const [encoding, setEncoding] = useState('UTF-8');
  const [delimiter, setDelimiter] = useState(',');
  const [loading, setLoading] = useState(false);

  if (!currentDataset) {
    return (
      <Card>
        <Text type="secondary">请先导入数据集</Text>
      </Card>
    );
  }

  const { columns, rows, name: datasetName } = currentDataset;

  const handleExport = async () => {
    setLoading(true);

    try {
      const finalFileName = fileName || datasetName || 'export';

      switch (exportFormat) {
        case 'csv':
          await exportCSV(finalFileName);
          break;
        case 'json':
          await exportJSON(finalFileName);
          break;
        case 'excel':
          await exportExcel(finalFileName);
          break;
      }

      addNotification({
        type: 'success',
        message: '导出成功',
        description: `文件 "${finalFileName}.${exportFormat === 'excel' ? 'xlsx' : exportFormat}" 已下载`,
      });
    } catch (error) {
      message.error('导出失败: ' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = (fileName: string) => {
    return new Promise<void>((resolve, reject) => {
      const csv = Papa.unparse(rows, {
        delimiter,
        quotes: true,
        header: true,
      });

      const blob = new Blob(['\uFEFF' + csv], { type: `text/csv;charset=${encoding}` });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${fileName}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      resolve();
    });
  };

  const exportJSON = (fileName: string) => {
    return new Promise<void>((resolve, reject) => {
      const json = JSON.stringify(rows, null, 2);
      const blob = new Blob([json], { type: 'application/json;charset=UTF-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${fileName}.json`;
      link.click();
      URL.revokeObjectURL(url);
      resolve();
    });
  };

  const exportExcel = (fileName: string) => {
    return new Promise<void>((resolve, reject) => {
      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, datasetName || 'Sheet1');
      XLSX.writeFile(workbook, `${fileName}.xlsx`);
      resolve();
    });
  };

  return (
    <Card title={<Title level={4}>文件导出</Title>}>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Card size="small">
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <div>
              <Text strong>数据集: </Text>
              <Text>{datasetName}</Text>
            </div>
            <div>
              <Text strong>行数: </Text>
              <Text>{rows.length}</Text>
            </div>
            <div>
              <Text strong>列数: </Text>
              <Text>{columns.length}</Text>
            </div>
          </Space>
        </Card>

        <Form layout="vertical">
          <Form.Item label="导出格式">
            <Select
              value={exportFormat}
              onChange={setExportFormat}
              style={{ width: '100%' }}
            >
              <Option value="csv">
                <Space>
                  <FileTextOutlined />
                  CSV
                </Space>
              </Option>
              <Option value="json">
                <Space>
                  <FileOutlined />
                  JSON
                </Space>
              </Option>
              <Option value="excel">
                <Space>
                  <FileExcelOutlined />
                  Excel (.xlsx)
                </Space>
              </Option>
            </Select>
          </Form.Item>

          <Form.Item label="文件名">
            <Input
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="请输入文件名"
              prefix={exportFormat === 'excel' ? 'xlsx' : exportFormat}
            />
          </Form.Item>

          {exportFormat === 'csv' && (
            <>
              <Form.Item label="编码">
                <Select
                  value={encoding}
                  onChange={setEncoding}
                  style={{ width: '100%' }}
                >
                  <Option value="UTF-8">UTF-8</Option>
                  <Option value="GBK">GBK</Option>
                  <Option value="GB2312">GB2312</Option>
                </Select>
              </Form.Item>

              <Form.Item label="分隔符">
                <Select
                  value={delimiter}
                  onChange={setDelimiter}
                  style={{ width: '100%' }}
                >
                  <Option value=",">逗号 (,)</Option>
                  <Option value=";">分号 (;)</Option>
                  <Option value="\t">制表符 (Tab)</Option>
                  <Option value="|">竖线 (|)</Option>
                </Select>
              </Form.Item>
            </>
          )}
        </Form>

        <Button
          type="primary"
          icon={<DownloadOutlined />}
          onClick={handleExport}
          loading={loading}
          block
          size="large"
        >
          导出文件
        </Button>
      </Space>
    </Card>
  );
};
