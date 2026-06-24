import { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Button } from 'antd';
import {
  TeamOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import axios from 'axios';

export default function Dashboard() {
  const [stats, setStats] = useState({
    users: 0,
    circles: 0,
    completion: 0,
    reports: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchStats = () => {
    setLoading(true);
    setError(false);
    axios
      .get('/api/v1/admin/stats')
      .then((res) => setStats(res.data.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <>
      <h2>仪表盘</h2>
      <Row gutter={16}>
        {error && (
          <Col span={24}>
            <Card>
              <p style={{ color: '#ff4d4f' }}>加载失败</p>
              <Button onClick={fetchStats}>重试</Button>
            </Card>
          </Col>
        )}
        <Col span={6}>
          <Card>
            <Statistic
              title="总用户数"
              value={stats.users}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="今日圈子"
              value={stats.circles}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="成局率"
              value={stats.completion}
              suffix="%"
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="待审举报"
              value={stats.reports}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>
      </Row>
    </>
  );
}
