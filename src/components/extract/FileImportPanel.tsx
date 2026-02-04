import React, { useState, useCallback } from 'react';
import { Card, Upload, Button, Select, Space, Typography, Alert, Tabs } from 'antd';
import { InboxOutlined, FileExcelOutlined, FileTextOutlined } from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd/es/upload';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { useDataStore } from '@stores/dataStore';
import { useUIStore } from '@stores/uiStore';
import type { DataSet, DataColumn, DataRow } from '@types/index';

const { Dragger } = Upload;
const { Title, Text } = Typography;
const { Option } = Select;

interface ParsedData {
  columns: DataColumn[];
  rows: DataRow[];
}

export const FileImportPanel: React.FC = () => {
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [parsing, setParsing] = useState(false);
  const [sheets, setSheets] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [previewData, setPreviewData] = useState<ParsedData | null>(null);

  const addDataset = useDataStore((state) => state.addDataset);
  const { setLoading, addNotification } = useUIStore();

  const detectType = (value: unknown): string => {
    if (value === null || value === undefined || value === '') return 'null';
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'number') return 'number';
    if (!isNaN(Date.parse(String(value)))) return 'date';
    return 'string';
  };

  const parseCSV = (file: File): Promise<ParsedData> => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => {
          const columns: DataColumn[] = results.meta.fields?.map((field, index) => ({
            id: `col_${index}`,
            name: field,
            type: 'string',
            index,
            visible: true,
          })) || [];

          // Detect column types
          const rows = results.data as DataRow[];
          columns.forEach((col) => {
            const types = rows.slice(0, 100).map((row) => detectType(row[col.name]));
            const typeCounts = types.reduce((acc, type) => {
              acc[type] = (acc[type] || 0) + 1;
              return acc;
            }, {} as Record<string, number>);
            col.type = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] as DataColumn['type'] || 'string';
          });

          resolve({ columns, rows });
        },
        error: (error) => reject(error),
      });
    });
  };

  const parseExcel = (file: File, sheetName?: string): Promise<ParsedData> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const wb = XLSX.read(data, { type: 'binary' });
          setWorkbook(wb);
          setSheets(wb.SheetNames);

          const targetSheet = sheetName || wb.SheetNames[0];
          setSelectedSheet(targetSheet);

          const worksheet = wb.Sheets[targetSheet];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][];

          if (jsonData.length < 2) {
            reject(new Error('Excel 文件数据不足'));
            return;
          }

          const headers = jsonData[0] as string[];
          const rows = jsonData.slice(1).map((row) => {
            const obj: DataRow = {};
            headers.forEach((header, index) => {
              obj[header] = row[index];
            });
            return obj;
          });

          const columns: DataColumn[] = headers.map((header, index) => ({
            id: `col_${index}`,
            name: header,
            type: 'string',
            index,
            visible: true,
          }));

          // Detect column types
          columns.forEach((col) => {
            const types = rows.slice(0, 100).map((row) => detectType(row[col.name]));
            const typeCounts = types.reduce((acc, type) => {
              acc[type] = (acc[type] || 0) + 1;
              return acc;
            }, {} as Record<string, number>);
            col.type = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] as DataColumn['type'] || 'string';
          });

          resolve({ columns, rows });
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsBinaryString(file);
    });
  };

  const handleFileChange: UploadProps['onChange'] = async (info) => {
    const { file } = info;
    setFileList(info.fileList.slice(-1));

    if (file.status === 'done' || file.originFileObj) {
      setParsing(true);
      setLoading(true, '正在解析文件...');

      try {
        const fileObj = file.originFileObj as File;
        const extension = fileObj.name.split('.').pop()?.toLowerCase();

        let parsedData: ParsedData;

        if (extension === 'csv') {
          parsedData = await parseCSV(fileObj);
        } else if (['xlsx', 'xls'].includes(extension || '')) {
          parsedData = await parseExcel(fileObj);
        } else {
          throw new Error('不支持的文件格式');
        }

        setPreviewData(parsedData);
        addNotification({
          type: 'success',
          message: '文件解析成功',
          description: `共 ${parsedData.rows.length} 行, ${parsedData.columns.length} 列`,
        });
      } catch (error) {
        addNotification({
          type: 'error',
          message: '文件解析失败',
          description: error instanceof Error ? error.message : '未知错误',
        });
      } finally {
        setParsing(false);
        setLoading(false);
      }
    }
  };

  const handleSheetChange = async (sheetName: string) => {
    if (!workbook) return;

    setSelectedSheet(sheetName);
    setLoading(true, '正在切换工作表...');

    try {
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][];

      const headers = jsonData[0] as string[];
      const rows = jsonData.slice(1).map((row) => {
        const obj: DataRow = {};
        headers.forEach((header, index) => {
          obj[header] = row[index];
        });
        return obj;
      });

      const columns: DataColumn[] = headers.map((header, index) => ({
        id: `col_${index}`,
        name: header,
        type: 'string',
        index,
        visible: true,
      }));

      setPreviewData({ columns, rows });
    } catch (error) {
      addNotification({
        type: 'error',
        message: '切换工作表失败',
        description: error instanceof Error ? error.message : '未知错误',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImport = () => {
    if (!previewData) return;

    const dataset: DataSet = {
      id: `ds_${Date.now()}`,
      name: fileList[0]?.name || '未命名数据集',
      columns: previewData.columns,
      rows: previewData.rows,
      rowCount: previewData.rows.length,
      columnCount: previewData.columns.length,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    addDataset(dataset);
    addNotification({
      type: 'success',
      message: '数据导入成功',
      description: `数据集 "${dataset.name}" 已创建`,
    });

    // Reset
    setFileList([]);
    setPreviewData(null);
    setSheets([]);
    setWorkbook(null);
  };

  const uploadProps: UploadProps = {
    accept: '.csv,.xlsx,.xls',
    multiple: false,
    fileList,
    beforeUpload: () => false,
    onChange: handleFileChange,
  };

  return (
    <Card title={<Title level={4}>文件导入</Title>}>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Dragger {...uploadProps} disabled={parsing}>
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">点击或拖拽文件到此处上传</p>
          <p className="ant-upload-hint">
            支持 CSV、Excel (.xlsx, .xls) 格式文件
          </p>
        </Dragger>

        {sheets.length > 0 && (
          <Space>
            <Text>选择工作表:</Text>
            <Select
              value={selectedSheet}
              onChange={handleSheetChange}
              style={{ width: 200 }}
            >
              {sheets.map((sheet) => (
                <Option key={sheet} value={sheet}>
                  {sheet}
                </Option>
              ))}
            </Select>
          </Space>
        )}

        {previewData && (
          <>
            <Alert
              message="文件预览"
              description={
                <Space direction="vertical">
                  <Text>文件名: {fileList[0]?.name}</Text>
                  <Text>行数: {previewData.rows.length}</Text>
                  <Text>列数: {previewData.columns.length}</Text>
                  <Text>
                    列: {previewData.columns.map((c) => c.name).join(', ')}
                  </Text>
                </Space>
              }
              type="info"
              showIcon
            />
            <Button type="primary" onClick={handleImport} block>
              导入数据
            </Button>
          </>
        )}
      </Space>
    </Card>
  );
};
