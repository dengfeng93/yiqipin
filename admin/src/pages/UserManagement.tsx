import { useEffect, useState } from 'react';
import { Table, Button, Tag, Space, Input, message, Popconfirm } from 'antd';
import { SearchOutlined, EyeOutlined, StopOutlined, CheckCircleOutlined } from '@ant-design/icons';
import axios from 'axios';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const fetchUsers = async (keyword?: string) => {
    setLoading(true);
    try {
      const res = await axios.get('/api/v1/admin/users', { params: { keyword: keyword || search || undefined } });
      setUsers(res.data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const toggleBan = async (userId: string, banned: boolean) => {
    try {
      await axios.patch(`/api/v1/admin/users/${userId}/ban`, { banned: !banned });
      message.success(banned ? '已解封' : '已封禁');
      fetchUsers();
    } catch {
      message.error('操作失败');
    }
  };

  const columns = [
    {
      title: '头像',
      dataIndex: 'avatar',
      render: (v: string) => (
        <img src={v} width={40} style={{ borderRadius: '50%' }} alt="" />
      ),
    },
    { title: '昵称', dataIndex: 'nickname' },
    { title: '手机号', dataIndex: 'phone' },
    {
      title: '角色',
      dataIndex: 'role',
      render: (v: string) =>
        v === 'admin' ? <Tag color="red">管理员</Tag> : <Tag>用户</Tag>,
    },
    {
      title: '兴趣标签',
      dataIndex: 'interest_tags',
      render: (v: string[]) => v?.join(', ') || '-',
    },
    {
      title: '状态',
      dataIndex: 'is_banned',
      render: (v: boolean) =>
        v ? <Tag color="red">已封禁</Tag> : <Tag color="green">正常</Tag>,
    },
    {
      title: '注册时间',
      dataIndex: 'created_at',
      render: (v: string) => new Date(v).toLocaleDateString(),
    },
    {
      title: '操作',
      render: (_: any, record: any) => (
        <Space>
          <Button icon={<EyeOutlined />} size="small">
            档案
          </Button>
          <Popconfirm
            title={record.is_banned ? '确认解封?' : '确认封禁?'}
            onConfirm={() => toggleBan(record.id, record.is_banned)}
          >
            <Button
              icon={record.is_banned ? <CheckCircleOutlined /> : <StopOutlined />}
              size="small"
              danger={!record.is_banned}
            >
              {record.is_banned ? '解封' : '封禁'}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <h2>用户管理</h2>
      <Space style={{ marginBottom: 16 }}>
        <Input.Search
          placeholder="搜索用户"
          onSearch={(v) => {
            setSearch(v);
            fetchUsers(v);
          }}
          enterButton={<SearchOutlined />}
        />
      </Space>
      <Table columns={columns} dataSource={users} rowKey="id" loading={loading} />
    </>
  );
}
