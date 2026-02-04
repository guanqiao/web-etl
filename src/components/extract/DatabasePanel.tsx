import React, { useState, useEffect } from 'react';
import { Card, Button, Space, Input, Table, Typography, Upload, message, Alert } from 'antd';
import {
  DatabaseOutlined,
  PlayCircleOutlined,
  DownloadOutlined,
  UploadOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useSQLite } from '@hooks/useSQLite';
import { useDataStore } from '@stores/dataStore';
import { useUIStore } from '@stores/uiStore';
import type { DataRow, DataColumn } from '@types/index';

const { Title, Text } = Typography;

export const DatabasePanel: React.FC = () => {
  const currentDataset = useDataStore((state) => state.getCurrentDataset());
  const { addDataset } = useDataStore();
  const { addNotification } = useUIStore();

  const {
    db,
    loading,
    error,
    initSQLite,
    executeQuery,
    createTableFromData,
    getTables,
    getTableSchema,
    exportToFile,
    importFromFile,
    closeDatabase,
  } = useSQLite();

  const [query, setQuery] = useState('SELECT * FROM sqlite_master WHERE type="table"');
  const [queryResults, setQueryResults] = useState<Record<string, unknown>[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [tableData, setTableData] = useState<Record<string, unknown>[]>([]);

  useEffect(() => {
    initSQLite();
  }, [initSQLite]);

  const handleImportDataset = async () => {
    if (!currentDataset) {
      message.warning('请先导入数据集');
      return;
    }

    try {
      const columnsWithType = currentDataset.columns.map((col) => ({
        name: col.name,
        type: col.type === 'number' ? 'REAL' : col.type === 'boolean' ? 'INTEGER' : 'TEXT',
      }));

      await createTableFromData(
        'dataset_' + Date.now(),
        columnsWithType,
        currentDataset.rows,
      );

      addNotification({
        type: 'success',
        message: '数据集导入数据库成功',
      });
    } catch (err) {
      message.error('导入失败: ' + (err instanceof Error ? err.message : '未知错误'));
    }
  };

  const handleExecuteQuery = () => {
    if (!query.trim()) {
      message.warning('请输入 SQL 查询');
      return;
    }

    try {
      const results = executeQuery(query);
      setQueryResults(results);
      addNotification({
        type: 'success',
        message: '查询执行成功',
        description: `返回 ${results.length} 条记录`,
      });
    } catch (err) {
      message.error('查询失败: ' + (err instanceof Error ? err.message : '未知错误'));
    }
  };

  const handleRefreshTables = () => {
    try {
      const tables = getTables();
      setSelectedTable(tables[0] || '');
    } catch (err) {
      message.error('获取表列表失败');
    }
  };

  const handleSelectTable = async (tableName: string) => {
    setSelectedTable(tableName);

    try {
      const schema = getTableSchema(tableName);
      const results = executeQuery(`SELECT * FROM ${tableName}`);
      setTableData(results);
    } catch (err) {
      message.error('查询表数据失败');
    }
  };

  const handleExportDatabase = () => {
    try {
      exportToFile();
      addNotification({
        type: 'success',
        message: '数据库导出成功',
      });
    } catch (err) {
      message.error('导出失败: ' + (err instanceof Error ? err.message : '未知错误'));
    }
  };

  const handleImportDatabase = async (file: File) => {
    try {
      await importFromFile(file);
      handleRefreshTables();
      addNotification({
        type: 'success',
        message: '数据库导入成功',
      });
    } catch (err) {
      message.error('导入失败: ' + (err instanceof Error ? err.message : '未知错误'));
    }
  };

  const tables = getTables();

  const queryColumns = queryResults.length > 0
    ? Object.keys(queryResults[0]).map((key) => ({
        title: key,
        dataIndex: key,
        key,
        ellipsis: true,
      }))
    : [];

  const tableColumns = tableData.length > 0
    ? Object.keys(tableData[0]).map((key) => ({
        title: key,
        dataIndex: key,
        key,
        ellipsis: true,
      }))
    : [];

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      {error && (
        <Alert
          message="数据库错误"
          description={error}
          type="error"
          closable
          onClose={() => {
            closeDatabase();
            initSQLite();
          }}
        />
      )}

      <Card
        title={<Title level={4}>SQLite 数据库</Title>}
        extra={
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={handleRefreshTables}
              loading={loading}
            >
              刷新
            </Button>
            <Button
              icon={<DownloadOutlined />}
              onClick={handleExportDatabase}
              disabled={!db}
            >
              导出数据库
            </Button>
          </Space>
        }
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Alert
            message="数据库状态"
            description={
              <Space direction="vertical" size={0}>
                <Text>状态: {db ? '已连接' : '未连接'}</Text>
                <Text>表数量: {tables.length}</Text>
                {selectedTable && <Text>当前表: {selectedTable}</Text>}
              </Space>
            }
            type={db ? 'success' : 'info'}
          />

          {currentDataset && (
            <Button
              type="primary"
              icon={<DatabaseOutlined />}
              onClick={handleImportDataset}
              loading={loading}
              block
            >
              将当前数据集导入数据库
            </Button>
          )}

          <Upload
            accept=".db,.sqlite,.sqlite3"
            showUploadList={false}
            beforeUpload={(file) => {
              handleImportDatabase(file as File);
              return false;
            }}
          >
            <Button icon={<UploadOutlined />} loading={loading} block>
              导入数据库文件
            </Button>
          </Upload>

          <Card size="small" title="表列表">
            <Space direction="vertical" style={{ width: '100%' }} size="small">
              {tables.length === 0 ? (
                <Text type="secondary">暂无表，请导入数据或数据库</Text>
              ) : (
                tables.map((table) => (
                  <Button
                    key={table}
                    type={selectedTable === table ? 'primary' : 'default'}
                    onClick={() => handleSelectTable(table)}
                    block
                  >
                    {table}
                  </Button>
                ))
              )}
            </Space>
          </Card>

          <Card size="small" title="SQL 查询">
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <Input.TextArea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="输入 SQL 查询语句..."
                rows={3}
                style={{ fontFamily: 'monospace' }}
              />
              <Button
                type="primary"
                icon={<PlayCircleOutlined />}
                onClick={handleExecuteQuery}
                loading={loading}
                block
              >
                执行查询
              </Button>
            </Space>
          </Card>

          {queryResults.length > 0 && (
            <Card size="small" title="查询结果">
              <Table
                dataSource={queryResults}
                columns={queryColumns}
                rowKey={(record, index) => index}
                pagination={{ pageSize: 10 }}
                scroll={{ x: 'max-content', y: 300 }}
                size="small"
                bordered
              />
            </Card>
          )}

          {tableData.length > 0 && (
            <Card size="small" title={`表数据: ${selectedTable}`}>
              <Table
                dataSource={tableData}
                columns={tableColumns}
                rowKey={(record, index) => index}
                pagination={{ pageSize: 10 }}
                scroll={{ x: 'max-content', y: 300 }}
                size="small"
                bordered
              />
            </Card>
          )}
        </Space>
      </Card>
    </Space>
  );
};
