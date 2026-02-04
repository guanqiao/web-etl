import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { DataSet, DataColumn, DataRow, DataSource, DataTarget, TransformStep, Pipeline } from '@types/index';

interface DataState {
  // Datasets
  datasets: DataSet[];
  currentDatasetId: string | null;

  // Pipelines
  pipelines: Pipeline[];
  currentPipelineId: string | null;

  // Actions
  addDataset: (dataset: DataSet) => void;
  updateDataset: (id: string, updates: Partial<DataSet>) => void;
  removeDataset: (id: string) => void;
  setCurrentDataset: (id: string | null) => void;

  // Column operations
  addColumn: (datasetId: string, column: DataColumn) => void;
  deleteColumn: (datasetId: string, columnId: string) => void;
  renameColumn: (datasetId: string, columnId: string, newName: string) => void;
  reorderColumns: (datasetId: string, columnIds: string[]) => void;

  // Row operations
  addRow: (datasetId: string, row: DataRow) => void;
  updateRow: (datasetId: string, rowIndex: number, row: DataRow) => void;
  deleteRow: (datasetId: string, rowIndex: number) => void;

  // Pipeline operations
  addPipeline: (pipeline: Pipeline) => void;
  updatePipeline: (id: string, updates: Partial<Pipeline>) => void;
  removePipeline: (id: string) => void;
  setCurrentPipeline: (id: string | null) => void;
  addTransformStep: (pipelineId: string, step: TransformStep) => void;
  updateTransformStep: (pipelineId: string, stepId: string, updates: Partial<TransformStep>) => void;
  removeTransformStep: (pipelineId: string, stepId: string) => void;
  reorderTransformSteps: (pipelineId: string, stepIds: string[]) => void;

  // Getters
  getCurrentDataset: () => DataSet | null;
  getCurrentPipeline: () => Pipeline | null;
  getDatasetById: (id: string) => DataSet | null;
}

export const useDataStore = create<DataState>()(
  immer((set, get) => ({
    // Initial state
    datasets: [],
    currentDatasetId: null,
    pipelines: [],
    currentPipelineId: null,

    // Dataset actions
    addDataset: (dataset) =>
      set((state) => {
        state.datasets.push(dataset);
        state.currentDatasetId = dataset.id;
      }),

    updateDataset: (id, updates) =>
      set((state) => {
        const dataset = state.datasets.find((d) => d.id === id);
        if (dataset) {
          Object.assign(dataset, updates, { updatedAt: Date.now() });
        }
      }),

    removeDataset: (id) =>
      set((state) => {
        state.datasets = state.datasets.filter((d) => d.id !== id);
        if (state.currentDatasetId === id) {
          state.currentDatasetId = null;
        }
      }),

    setCurrentDataset: (id) =>
      set((state) => {
        state.currentDatasetId = id;
      }),

    // Column operations
    addColumn: (datasetId, column) =>
      set((state) => {
        const dataset = state.datasets.find((d) => d.id === datasetId);
        if (dataset) {
          dataset.columns.push(column);
          dataset.columnCount = dataset.columns.length;
          dataset.updatedAt = Date.now();
        }
      }),

    deleteColumn: (datasetId, columnId) =>
      set((state) => {
        const dataset = state.datasets.find((d) => d.id === datasetId);
        if (dataset) {
          dataset.columns = dataset.columns.filter((c) => c.id !== columnId);
          // Also remove the column data from rows
          dataset.rows = dataset.rows.map((row) => {
            const newRow = { ...row };
            delete newRow[columnId];
            return newRow;
          });
          dataset.columnCount = dataset.columns.length;
          dataset.updatedAt = Date.now();
        }
      }),

    renameColumn: (datasetId, columnId, newName) =>
      set((state) => {
        const dataset = state.datasets.find((d) => d.id === datasetId);
        if (dataset) {
          const column = dataset.columns.find((c) => c.id === columnId);
          if (column) {
            const oldName = column.name;
            column.name = newName;
            // Update row keys
            dataset.rows = dataset.rows.map((row) => {
              const newRow = { ...row };
              if (oldName in row) {
                newRow[newName] = row[oldName];
                delete newRow[oldName];
              }
              return newRow;
            });
          }
          dataset.updatedAt = Date.now();
        }
      }),

    reorderColumns: (datasetId, columnIds) =>
      set((state) => {
        const dataset = state.datasets.find((d) => d.id === datasetId);
        if (dataset) {
          const columnMap = new Map(dataset.columns.map((c) => [c.id, c]));
          dataset.columns = columnIds
            .map((id) => columnMap.get(id))
            .filter((c): c is DataColumn => c !== undefined);
          dataset.updatedAt = Date.now();
        }
      }),

    // Row operations
    addRow: (datasetId, row) =>
      set((state) => {
        const dataset = state.datasets.find((d) => d.id === datasetId);
        if (dataset) {
          dataset.rows.push(row);
          dataset.rowCount = dataset.rows.length;
          dataset.updatedAt = Date.now();
        }
      }),

    updateRow: (datasetId, rowIndex, row) =>
      set((state) => {
        const dataset = state.datasets.find((d) => d.id === datasetId);
        if (dataset && rowIndex >= 0 && rowIndex < dataset.rows.length) {
          dataset.rows[rowIndex] = row;
          dataset.updatedAt = Date.now();
        }
      }),

    deleteRow: (datasetId, rowIndex) =>
      set((state) => {
        const dataset = state.datasets.find((d) => d.id === datasetId);
        if (dataset && rowIndex >= 0 && rowIndex < dataset.rows.length) {
          dataset.rows.splice(rowIndex, 1);
          dataset.rowCount = dataset.rows.length;
          dataset.updatedAt = Date.now();
        }
      }),

    // Pipeline actions
    addPipeline: (pipeline) =>
      set((state) => {
        state.pipelines.push(pipeline);
        state.currentPipelineId = pipeline.id;
      }),

    updatePipeline: (id, updates) =>
      set((state) => {
        const pipeline = state.pipelines.find((p) => p.id === id);
        if (pipeline) {
          Object.assign(pipeline, updates, { updatedAt: Date.now() });
        }
      }),

    removePipeline: (id) =>
      set((state) => {
        state.pipelines = state.pipelines.filter((p) => p.id !== id);
        if (state.currentPipelineId === id) {
          state.currentPipelineId = null;
        }
      }),

    setCurrentPipeline: (id) =>
      set((state) => {
        state.currentPipelineId = id;
      }),

    addTransformStep: (pipelineId, step) =>
      set((state) => {
        const pipeline = state.pipelines.find((p) => p.id === pipelineId);
        if (pipeline) {
          pipeline.transforms.push(step);
          pipeline.updatedAt = Date.now();
        }
      }),

    updateTransformStep: (pipelineId, stepId, updates) =>
      set((state) => {
        const pipeline = state.pipelines.find((p) => p.id === pipelineId);
        if (pipeline) {
          const step = pipeline.transforms.find((s) => s.id === stepId);
          if (step) {
            Object.assign(step, updates);
          }
          pipeline.updatedAt = Date.now();
        }
      }),

    removeTransformStep: (pipelineId, stepId) =>
      set((state) => {
        const pipeline = state.pipelines.find((p) => p.id === pipelineId);
        if (pipeline) {
          pipeline.transforms = pipeline.transforms.filter((s) => s.id !== stepId);
          pipeline.updatedAt = Date.now();
        }
      }),

    reorderTransformSteps: (pipelineId, stepIds) =>
      set((state) => {
        const pipeline = state.pipelines.find((p) => p.id === pipelineId);
        if (pipeline) {
          const stepMap = new Map(pipeline.transforms.map((s) => [s.id, s]));
          pipeline.transforms = stepIds
            .map((id) => stepMap.get(id))
            .filter((s): s is TransformStep => s !== undefined)
            .map((s, index) => ({ ...s, order: index }));
          pipeline.updatedAt = Date.now();
        }
      }),

    // Getters
    getCurrentDataset: () => {
      const { datasets, currentDatasetId } = get();
      return datasets.find((d) => d.id === currentDatasetId) || null;
    },

    getCurrentPipeline: () => {
      const { pipelines, currentPipelineId } = get();
      return pipelines.find((p) => p.id === currentPipelineId) || null;
    },

    getDatasetById: (id) => {
      return get().datasets.find((d) => d.id === id) || null;
    },
  }))
);
