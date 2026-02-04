import { useState, useCallback, useRef } from 'react';
import initSqlJs, { Database, SqlJsStatic } from 'sql.js';

export const useSQLite = () => {
  const [db, setDb] = useState<Database | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sqlJsRef = useRef<SqlJsStatic | null>(null);

  const initSQLite = useCallback(async () => {
    if (sqlJsRef.current) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const SQL = await initSqlJs({
        locateFile: (file) => {
          return `/sql-wasm.wasm`;
        },
      });

      sqlJsRef.current = SQL;
      const database = new SQL.Database();
      setDb(database);

      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : '初始化 SQLite 失败');
      setLoading(false);
    }
  }, []);

  const executeQuery = useCallback(
    (query: string, params: unknown[] = []) => {
      if (!db) {
        throw new Error('数据库未初始化');
      }

      try {
        const stmt = db.prepare(query);
        stmt.bind(params);
        const result = stmt.getAsObject({}) as Record<string, unknown>[];
        stmt.free();
        return result;
      } catch (err) {
        throw new Error(`查询失败: ${err instanceof Error ? err.message : '未知错误'}`);
      }
    },
    [db],
  );

  const executeScript = useCallback(
    (script: string) => {
      if (!db) {
        throw new Error('数据库未初始化');
      }

      try {
        db.run(script);
      } catch (err) {
        throw new Error(`执行脚本失败: ${err instanceof Error ? err.message : '未知错误'}`);
      }
    },
    [db],
  );

  const createTableFromData = useCallback(
    (tableName: string, columns: { name: string; type: string }[], data: Record<string, unknown>[]) => {
      if (!db) {
        throw new Error('数据库未初始化');
      }

      try {
        const columnDefs = columns.map((col) => `${col.name} ${col.type}`).join(', ');
        const createTableSQL = `CREATE TABLE IF NOT EXISTS ${tableName} (${columnDefs})`;
        db.run(createTableSQL);

        if (data.length > 0) {
          const placeholders = columns.map(() => '?').join(', ');
          const columnNames = columns.map((col) => col.name).join(', ');
          const insertSQL = `INSERT INTO ${tableName} (${columnNames}) VALUES (${placeholders})`;

          const stmt = db.prepare(insertSQL);
          data.forEach((row) => {
            const values = columns.map((col) => row[col.name]);
            stmt.run(values);
          });
          stmt.free();
        }

        return { success: true, message: `表 ${tableName} 创建成功` };
      } catch (err) {
        throw new Error(`创建表失败: ${err instanceof Error ? err.message : '未知错误'}`);
      }
    },
    [db],
  );

  const getTables = useCallback(() => {
    if (!db) {
      return [];
    }

    try {
      const result = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
      return result[0]?.values.map((row) => row[0]) || [];
    } catch (err) {
      throw new Error(`获取表列表失败: ${err instanceof Error ? err.message : '未知错误'}`);
    }
  }, [db]);

  const getTableSchema = useCallback((tableName: string) => {
    if (!db) {
      return [];
    }

    try {
      const result = db.exec(`PRAGMA table_info(${tableName})`);
      return result[0]?.values.map((row) => ({
        name: row[1],
        type: row[2],
        notNull: row[3] === 1,
        defaultValue: row[4],
        primaryKey: row[5] === 1,
      })) || [];
    } catch (err) {
      throw new Error(`获取表结构失败: ${err instanceof Error ? err.message : '未知错误'}`);
    }
  }, [db]);

  const exportToFile = useCallback(() => {
    if (!db) {
      throw new Error('数据库未初始化');
    }

    try {
      const data = db.export();
      const blob = new Blob([data], { type: 'application/x-sqlite3' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `database_${Date.now()}.db`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      throw new Error(`导出失败: ${err instanceof Error ? err.message : '未知错误'}`);
    }
  }, [db]);

  const importFromFile = useCallback(
    async (file: File) => {
      if (!sqlJsRef.current) {
        await initSQLite();
      }

      setLoading(true);
      setError(null);

      try {
        const arrayBuffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        const SQL = sqlJsRef.current;
        if (SQL) {
          const newDb = new SQL.Database(uint8Array);
          setDb(newDb);
        }

        setLoading(false);
        return { success: true, message: '数据库导入成功' };
      } catch (err) {
        setError(err instanceof Error ? err.message : '导入数据库失败');
        setLoading(false);
        throw err;
      }
    },
    [initSQLite],
  );

  const closeDatabase = useCallback(() => {
    if (db) {
      db.close();
      setDb(null);
    }
  }, [db]);

  return {
    db,
    loading,
    error,
    initSQLite,
    executeQuery,
    executeScript,
    createTableFromData,
    getTables,
    getTableSchema,
    exportToFile,
    importFromFile,
    closeDatabase,
  };
};
