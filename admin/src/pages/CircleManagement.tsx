import { useEffect, useState } from 'react';
import { Table, Button, Tag, Space, Select, message, Popconfirm } from 'antd';
import { StopOutlined, EyeOutlined } from '@ant-design/icons';
import axios from 'axios';

export default function CircleManagement() {
  const [circles, setCircles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('');

  const fetchCircles = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/v1/admin/circles', {
        params: { status: statusFilter || undefined },
      });
      setCircles(res.data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCircles();
  }, [statusFilter]);

  const dissolveCircle = async (circleId: string) => {
    try {
      await axios.delete(`/api/v1/admin/circles/${circleId}`);
      message.success('圈子已解散');
      fetchCircles();
    } catch {
      message.error('操作失败');
    }
  };

  const statusColors: Record<string, string> = {
    preparing: 'orange',
    active: 'green',
    archived: 'blue',
    dissolved: 'red',
  };

  const columns = [
    { title: '圈子名称', dataIndex: 'title' },
    { title: '创建者', dataIndex: 'creator_name' },
    {
      title: '成员',
      render: (_: any, r: any) => `${r.member_count}/${r.max_members}`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      render: (v: string) => (
        <Tag color={statusColors[v] || 'default'}>{v}</Tag>
      ),
    },
    {
      title: '开始时间',
      dataIndex: 'start_time',
      render: (v: string) => new Date(v).toLocaleString(),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      render: (v: string) => new Date(v).toLocaleDateString(),
    },
    {
      title: '操作',
      render: (_: any, record: any) => (
        <Space>
          <Button icon={<EyeOutlined />} size="small">
            详情
          </Button>
          {record.status !== 'dissolved' && (
            <Popconfirm
              title="确认强制解散?"
              onConfirm={() => dissolveCircle(record.id)}
            >
              <Button icon={<StopOutlined />} size="small" danger>
                解散
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <>
      <h2>圈子管理</h2>
      <Space style={{ marginBottom: 16 }}>
        <Select
          placeholder="状态筛选"
          allowClear
          style={{ width: 120 }}
          onChange={(v) => setStatusFilter(v || '')}
          options={[
            { label: '筹备中', value: 'preparing' },
            { label: '活跃', value: 'active' },
            { label: '已结束', value: 'archived' },
            { label: '已解散', value: 'dissolved' },
          ]}
        />
      </Space>
      <Table columns={columns} dataSource={circles} rowKey="id" loading={loading} />
    </>
  );
}
