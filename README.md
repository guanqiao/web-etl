# Web ETL - 纯前端数据转换工具

一个功能完整的纯前端 ETL（Extract-Transform-Load）工具，使用 React + TypeScript 构建，无需后端服务器。

## 功能特性

### Extract (数据提取)
- **文件导入**: 支持 CSV、Excel (.xlsx/.xls) 文件拖拽上传
  - 多 Sheet 选择
  - 自动数据类型检测
  - 文件预览
- **数据库面板**: SQLite WASM 浏览器内运行
  - SQL 查询执行
  - 表结构浏览
  - 数据集导入 SQLite
  - 数据库导入/导出

### Transform (数据转换)
- **列操作**: 添加列、删除列、重命名列
- **数据清洗**: 
  - 去除重复行
  - 删除空行
  - 填充空值 (固定值/前向填充/后向填充/平均值/中位数/众数)
  - 字符串修剪 (两端/左侧/右侧)
  - 大小写转换 (大写/小写/标题格式/首字母大写)
- **筛选排序**:
  - 多条件筛选 (AND/OR 逻辑)
  - 12 种操作符 (等于/不等于/大于/小于/包含/开始于/结束于/为空/不为空)
  - 多列排序 (升序/降序)
- **公式计算**:
  - HyperFormula 引擎支持
  - Excel 风格公式
  - 快速示例模板
- **聚合统计**:
  - 分组聚合
  - 7 种聚合函数 (SUM/AVG/COUNT/MIN/MAX/FIRST/LAST)
  - 自定义别名
- **数据合并**:
  - Join (Inner/Left/Right/Full)
  - Union (数据追加)

### Load (数据加载)
- **文件导出**:
  - CSV 导出 (支持编码、分隔符配置)
  - JSON 导出
  - Excel 导出
  - 自定义文件名

### Pipeline (工作流)
- **可视化编辑器**: React Flow 拖拽节点
- **节点类型**: Source/Transform/Sink
- **Pipeline 管理**:
  - 创建新 Pipeline
  - 添加/删除转换步骤
  - 保存/加载 Pipeline (JSON 格式)
  - 执行所有步骤

### 数据预览
- **表格展示**: 数据类型标签、分页显示
- **实时更新**: 所有操作即时反映到预览

## 技术栈

| 功能 | 库/工具 |
|------|----------|
| 框架 | React 18 + TypeScript |
| 状态管理 | Zustand + Immer |
| UI 组件 | Ant Design 6 |
| 数据表格 | Ant Design Table |
| 流程图 | React Flow |
| CSV 解析 | PapaParse |
| Excel 解析 | SheetJS (xlsx) |
| SQLite | sql.js (WASM) |
| 公式引擎 | HyperFormula |
| 构建工具 | Vite 6 |

## 项目结构

```
web-etl/
├── src/
│   ├── components/
│   │   ├── common/          # 通用组件
│   │   ├── layout/          # 布局组件
│   │   ├── extract/         # 数据提取
│   │   ├── transform/       # 数据转换
│   │   ├── load/           # 数据加载
│   │   └── pipeline/       # 工作流
│   ├── hooks/              # 自定义 Hooks
│   ├── stores/             # Zustand Store
│   ├── types/              # TypeScript 类型
│   └── App.tsx
├── public/
│   └── sql-wasm.wasm      # SQLite WASM 文件
└── package.json
```

## 快速开始

### 安装依赖
```bash
npm install
```

### 运行开发服务器
```bash
npm run dev
```

访问 http://localhost:5173

### 构建生产版本
```bash
npm run build
```

## 使用指南

1. **导入数据**: 点击"文件导入"标签，拖拽 CSV 或 Excel 文件
2. **数据转换**: 使用各种转换工具处理数据
3. **查看结果**: 底部数据预览面板实时显示结果
4. **导出数据**: 点击"文件导出"标签，选择格式并导出

## License

MIT
