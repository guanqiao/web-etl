import { ConfigProvider, theme as antTheme, App as AntApp, Tabs } from 'antd';
import { MainLayout } from '@components/layout/MainLayout';
import { useUIStore } from '@stores/uiStore';
import { FileImportPanel } from '@components/extract/FileImportPanel';
import { DatabasePanel } from '@components/extract/DatabasePanel';
import { DataPreview } from '@components/common/DataPreview';
import { ColumnOperations } from '@components/transform/ColumnOperations';
import { DataCleaning } from '@components/transform/DataCleaning';
import { FilterSortPanel } from '@components/transform/FilterSortPanel';
import { FormulaPanel } from '@components/transform/FormulaPanel';
import { AggregatePanel } from '@components/transform/AggregatePanel';
import { JoinPanel } from '@components/transform/JoinPanel';
import { PipelineFlow } from '@components/pipeline/PipelineFlow';
import { ExportPanel } from '@components/load/ExportPanel';

function App() {
  const { theme, activeTab } = useUIStore();

  return (
    <ConfigProvider
      theme={{
        algorithm: theme === 'dark' ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm,
        token: {
          colorPrimary: '#1890ff',
          borderRadius: 6,
        },
      }}
    >
      <AntApp>
        <MainLayout>
          <Tabs
            activeKey={activeTab}
            items={[
              {
                key: 'file',
                label: '文件导入',
                children: <FileImportPanel />,
              },
              {
                key: 'database',
                label: '数据库',
                children: <DatabasePanel />,
              },
              {
                key: 'column',
                label: '列操作',
                children: <ColumnOperations />,
              },
              {
                key: 'clean',
                label: '数据清洗',
                children: <DataCleaning />,
              },
              {
                key: 'filter',
                label: '筛选排序',
                children: <FilterSortPanel />,
              },
              {
                key: 'formula',
                label: '公式计算',
                children: <FormulaPanel />,
              },
              {
                key: 'aggregate',
                label: '聚合统计',
                children: <AggregatePanel />,
              },
              {
                key: 'join',
                label: '数据合并',
                children: <JoinPanel />,
              },
              {
                key: 'pipeline',
                label: '工作流',
                children: <PipelineFlow />,
              },
              {
                key: 'export',
                label: '文件导出',
                children: <ExportPanel />,
              },
            ]}
          />
          <DataPreview />
        </MainLayout>
      </AntApp>
    </ConfigProvider>
  );
}

export default App;
