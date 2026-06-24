import { useEffect, useState } from 'react';
import { Table, Button, Tag, Space, Modal, message, Popconfirm, Alert } from 'antd';
import { EyeOutlined, StopOutlined, CheckCircleOutlined } from '@ant-design/icons';
import axios from 'axios';

export default function ReportReview() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);

  const fetchReports = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await axios.get('/api/v1/admin/reports');
      setReports(res.data.data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleAction = async (reportId: string, action: 'dismiss' | 'confirm') => {
    try {
      await axios.post(`/api/v1/admin/reports/${reportId}/handle`, { action });
      message.success(action === 'confirm' ? '已封禁被举报用户' : '已驳回举报');
      fetchReports();
    } catch {
      message.error('操作失败');
    }
  };

  const statusColors: Record<string, string> = {
    pending: 'orange',
    dismissed: 'default',
    reviewed: 'red',
  };
  const statusLabels: Record<string, string> = {
    pending: '待处理',
    dismissed: '已驳回',
    reviewed: '已审核',
  };

  const columns = [
    { title: '举报人', dataIndex: 'reporter_name' },
    { title: '被举报人', dataIndex: 'target_name' },
    {
      title: '类型',
      dataIndex: 'type',
      render: (v: string) => <Tag>{v}</Tag>,
    },
    { title: '原因', dataIndex: 'reason', ellipsis: true },
    {
      title: '状态',
      dataIndex: 'status',
      render: (v: string) => (
        <Tag color={statusColors[v] || 'default'}>
          {statusLabels[v] || v}
        </Tag>
      ),
    },
    {
      title: '时间',
      dataIndex: 'created_at',
      render: (v: string) => new Date(v).toLocaleString(),
    },
    {
      title: '操作',
      render: (_: any, record: any) => (
        <Space>
          <Button
            icon={<EyeOutlined />}
            size="small"
            onClick={() => {
              setSelectedReport(record);
              setDetailVisible(true);
            }}
          >
            详情
          </Button>
          {record.status === 'pending' && (
            <>
              <Popconfirm
                title="确认驳回?"
                onConfirm={() => handleAction(record.id, 'dismiss')}
              >
                <Button icon={<CheckCircleOutlined />} size="small">
                  驳回
                </Button>
              </Popconfirm>
              <Popconfirm
                title="确认封禁用户?"
                onConfirm={() => handleAction(record.id, 'confirm')}
              >
                <Button icon={<StopOutlined />} size="small" danger>
                  封号
                </Button>
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <>
      <h2>举报审核</h2>
      {error && <Alert type="error" message="加载失败" action={<Button size="small" onClick={() => fetchReports()}>重试</Button>} style={{ marginBottom: 16 }} />}
      <Table columns={columns} dataSource={reports} rowKey="id" loading={loading} />
      <Modal
        title="举报详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
      >
        {selectedReport && (
          <>
            <p>
              <b>举报人:</b> {selectedReport.reporter_name}
            </p>
            <p>
              <b>被举报人:</b> {selectedReport.target_name}
            </p>
            <p>
              <b>类型:</b> {selectedReport.type}
            </p>
            <p>
              <b>原因:</b> {selectedReport.reason}
            </p>
            <p>
              <b>详细说明:</b> {selectedReport.detail || '无'}
            </p>
          </>
        )}
      </Modal>
    </>
  );
}
