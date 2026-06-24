import { useEffect, useState, useRef } from 'react';
import { Table, InputNumber, message, Button, Alert } from 'antd';
import axios from 'axios';

export default function WishpoolThreshold() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const debounceRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const fetchCategories = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await axios.get('/api/v1/admin/categories');
      setCategories(res.data.data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    return () => {
      Object.values(debounceRef.current).forEach(clearTimeout);
    };
  }, []);

  const updateThreshold = async (id: string, value: number) => {
    setSaving((prev) => ({ ...prev, [id]: true }));
    try {
      await axios.patch(`/api/v1/admin/categories/${id}/threshold`, {
        threshold: value,
      });
      message.success('已更新');
      fetchCategories();
    } catch {
      message.error('更新失败');
    } finally {
      setSaving((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleThresholdChange = (id: string, value: number, prevValue: number) => {
    if (isNaN(value) || value === prevValue) return;
    if (debounceRef.current[id]) clearTimeout(debounceRef.current[id]);
    debounceRef.current[id] = setTimeout(() => {
      updateThreshold(id, value);
    }, 600);
  };

  const columns = [
    { title: '分类', dataIndex: 'name' },
    { title: '当前阈值', dataIndex: 'wish_threshold' },
    {
      title: '修改阈值',
      render: (_: any, record: any) => (
        <InputNumber
          key={`${record.id}-${record.wish_threshold}`}
          min={2}
          max={20}
          defaultValue={record.wish_threshold}
          onBlur={(e) => {
            const v = parseInt(e.target.value);
            handleThresholdChange(record.id, v, record.wish_threshold);
          }}
        />
      ),
    },
  ];

  return (
    <>
      <h2>心愿池阈值配置</h2>
      {error && <Alert type="error" message="加载失败" action={<Button size="small" onClick={() => fetchCategories()}>重试</Button>} style={{ marginBottom: 16 }} />}
      <p style={{ color: '#666', marginBottom: 16 }}>
        各分类心愿单达到阈值后自动创建圈子。修改后即时生效。
      </p>
      <Table
        columns={columns}
        dataSource={categories}
        rowKey="id"
        loading={loading}
      />
    </>
  );
}
