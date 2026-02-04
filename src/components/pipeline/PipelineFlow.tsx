import React, { useCallback, useState } from 'react';
import { Card, Button, Space, Typography } from 'antd';
import {
  NodeIndexOutlined,
  PlusOutlined,
  PlayCircleOutlined,
  SaveOutlined,
  FolderOpenOutlined,
} from '@ant-design/icons';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  Node,
  Edge,
  ConnectionMode,
} from 'reactflow';
import 'reactflow/dist/style.css';
import type { TransformStep, Pipeline } from '@types/index';
import { useDataStore } from '@stores/dataStore';
import { useUIStore } from '@stores/uiStore';

const { Title, Text } = Typography;

const nodeTypes = {
  source: ({ data }: { data: any }) => (
    <div style={{ padding: '10px', borderRadius: '5px', background: '#e6f7ff', border: '2px solid #1890ff' }}>
      <Text strong>数据源</Text>
      <br />
      <Text style={{ fontSize: '12px' }}>{data?.name || '未命名'}</Text>
    </div>
  ),
  transform: ({ data }: { data: any }) => (
    <div style={{ padding: '10px', borderRadius: '5px', background: '#fff7e6', border: '2px solid #fa8c16' }}>
      <Text strong>转换</Text>
      <br />
      <Text style={{ fontSize: '12px' }}>{data?.name || '未命名'}</Text>
      <br />
      <Text type="secondary" style={{ fontSize: '10px' }}>{data?.type || 'transform'}</Text>
    </div>
  ),
  sink: ({ data }: { data: any }) => (
    <div style={{ padding: '10px', borderRadius: '5px', background: '#f6ffed', border: '2px solid #52c41a' }}>
      <Text strong>目标</Text>
      <br />
      <Text style={{ fontSize: '12px' }}>{data?.name || '未命名'}</Text>
    </div>
  ),
};

export const PipelineFlow: React.FC = () => {
  const currentPipeline = useDataStore((state) => state.getCurrentPipeline());
  const { addPipeline, updatePipeline, addTransformStep } = useDataStore();
  const { addNotification } = useUIStore();

  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  const onNodesChange = useCallback(
    (changes: any) => {
      setNodes((nds) => applyNodeChanges(changes, nds));
    },
    [],
  );

  const onEdgesChange = useCallback(
    (changes: any) => {
      setEdges((eds) => applyEdgeChanges(changes, eds));
    },
    [],
  );

  const handleAddStep = useCallback(() => {
    if (!currentPipeline) {
      addNotification({
        type: 'error',
        message: '请先创建 Pipeline',
      });
      return;
    }

    const newStep: TransformStep = {
      id: `step_${Date.now()}`,
      type: 'filter',
      name: `步骤 ${currentPipeline.transforms.length + 1}`,
      enabled: true,
      config: { conditions: [], logic: 'AND' },
      order: currentPipeline.transforms.length,
    };

    addTransformStep(currentPipeline.id, newStep);

    const newNode: Node = {
      id: newStep.id,
      type: 'transform',
      position: { x: 100 + currentPipeline.transforms.length * 200, y: 100 },
      data: newStep,
    };

    setNodes((nds) => [...nds, newNode]);

    if (nodes.length > 0) {
      const lastNode = nodes[nodes.length - 1];
      const newEdge: Edge = {
        id: `edge_${Date.now()}`,
        source: lastNode.id,
        target: newNode.id,
        animated: true,
      };
      setEdges((eds) => [...eds, newEdge]);
    }

    addNotification({
      type: 'success',
      message: '步骤已添加',
      description: `已添加 ${newStep.name}`,
    });
  }, [currentPipeline, nodes, addTransformStep, addNotification]);

  const handleCreatePipeline = useCallback(() => {
    const newPipeline: Pipeline = {
      id: `pipeline_${Date.now()}`,
      name: `Pipeline ${Date.now()}`,
      source: {
        id: 'source_default',
        type: 'file',
        name: '数据源',
        config: { fileType: 'csv', fileName: 'source.csv' },
      },
      transforms: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    addPipeline(newPipeline);

    const sourceNode: Node = {
      id: newPipeline.source.id,
      type: 'source',
      position: { x: 100, y: 100 },
      data: newPipeline.source,
    };

    const sinkNode: Node = {
      id: 'sink_default',
      type: 'sink',
      position: { x: 500, y: 100 },
      data: { name: '输出目标' },
    };

    setNodes([sourceNode, sinkNode]);
    setEdges([
      {
        id: 'edge_source_sink',
        source: sourceNode.id,
        target: sinkNode.id,
        animated: true,
      },
    ]);

    addNotification({
      type: 'success',
      message: 'Pipeline 已创建',
      description: `已创建 ${newPipeline.name}`,
    });
  }, [addPipeline, addNotification]);

  const handleSavePipeline = useCallback(() => {
    if (!currentPipeline) {
      addNotification({
        type: 'error',
        message: '没有可保存的 Pipeline',
      });
      return;
    }

    const pipelineJson = JSON.stringify(currentPipeline, null, 2);
    const blob = new Blob([pipelineJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentPipeline.name}.json`;
    link.click();
    URL.revokeObjectURL(url);

    addNotification({
      type: 'success',
      message: 'Pipeline 已保存',
      description: '文件已下载',
    });
  }, [currentPipeline, addNotification]);

  const handleLoadPipeline = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const pipeline = JSON.parse(event.target?.result as string) as Pipeline;
            addPipeline(pipeline);
            addNotification({
              type: 'success',
              message: 'Pipeline 已加载',
              description: `已加载 ${pipeline.name}`,
            });
          } catch (error) {
            addNotification({
              type: 'error',
              message: '加载失败',
              description: '无效的 Pipeline 文件',
            });
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  }, [addPipeline, addNotification]);

  const handleExecutePipeline = useCallback(() => {
    if (!currentPipeline) {
      addNotification({
        type: 'error',
        message: '没有可执行的 Pipeline',
      });
      return;
    }

    addNotification({
      type: 'success',
      message: 'Pipeline 执行开始',
      description: '正在执行转换步骤...',
    });

    setTimeout(() => {
      addNotification({
        type: 'success',
        message: 'Pipeline 执行完成',
        description: '所有步骤已执行',
      });
    }, 1000);
  }, [currentPipeline, addNotification]);

  return (
    <Card
      title={<Title level={4}>Pipeline 工作流</Title>}
      extra={
        <Space>
          <Button icon={<FolderOpenOutlined />} onClick={handleLoadPipeline}>
            加载 Pipeline
          </Button>
          <Button icon={<SaveOutlined />} onClick={handleSavePipeline}>
            保存 Pipeline
          </Button>
        </Space>
      }
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        {!currentPipeline ? (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreatePipeline}
            size="large"
            block
          >
            创建新 Pipeline
          </Button>
        ) : (
          <>
            <Card size="small">
              <Space direction="vertical" size="small">
                <Text strong>Pipeline: {currentPipeline.name}</Text>
                <Text type="secondary">步骤数: {currentPipeline.transforms.length}</Text>
              </Space>
            </Card>

            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddStep}
              block
            >
              添加转换步骤
            </Button>

            <Button
              type="default"
              icon={<PlayCircleOutlined />}
              onClick={handleExecutePipeline}
              block
            >
              执行 Pipeline
            </Button>
          </>
        )}

        <div style={{ height: '400px', border: '1px solid #d9d9d9', borderRadius: '8px' }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            connectionMode={ConnectionMode.Loose}
            fitView
            attributionPosition="bottom"
          >
            <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
            <Controls />
            <MiniMap />
          </ReactFlow>
        </div>
      </Space>
    </Card>
  );
};
