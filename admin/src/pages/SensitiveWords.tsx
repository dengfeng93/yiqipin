import { useEffect, useState } from 'react';
import { Table, Button, Tag, Space, Input, Select, Modal, message } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import axios from 'axios';

export default function SensitiveWords() {
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [newWord, setNewWord] = useState('');
  const [newLevel, setNewLevel] = useState(1);

  const fetchWords = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/v1/admin/sensitive-words');
      setWords(res.data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWords();
  }, []);

  const addWord = async () => {
    if (!newWord.trim()) return;
    try {
      await axios.post('/api/v1/admin/sensitive-words', {
        word: newWord.trim(),
        level: newLevel,
      });
      message.success('已添加');
      setModalVisible(false);
      setNewWord('');
      setNewLevel(1);
      fetchWords();
    } catch {
      message.error('添加失败');
    }
  };

  const deleteWord = async (id: string) => {
    try {
      await axios.delete(`/api/v1/admin/sensitive-words/${id}`);
      message.success('已删除');
      fetchWords();
    } catch {
      message.error('删除失败');
    }
  };

  const columns = [
    { title: '敏感词', dataIndex: 'word' },
    {
      title: '级别',
      dataIndex: 'level',
      render: (v: number) =>
        v === 1 ? (
          <Tag color="red">拦截</Tag>
        ) : (
          <Tag color="orange">需审核</Tag>
        ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      render: (v: string) => new Date(v).toLocaleDateString(),
    },
    {
      title: '操作',
      render: (_: any, record: any) => (
        <Button
          icon={<DeleteOutlined />}
          size="small"
          danger
          onClick={() => deleteWord(record.id)}
        >
          删除
        </Button>
      ),
    },
  ];

  return (
    <>
      <h2>敏感词库</h2>
      <Space style={{ marginBottom: 16 }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setModalVisible(true)}
        >
          添加敏感词
        </Button>
      </Space>
      <Table columns={columns} dataSource={words} rowKey="id" loading={loading} />
      <Modal
        title="添加敏感词"
        open={modalVisible}
        onOk={addWord}
        onCancel={() => setModalVisible(false)}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Input
            placeholder="输入敏感词"
            value={newWord}
            onChange={(e) => setNewWord(e.target.value)}
          />
          <Select
            value={newLevel}
            onChange={(v) => setNewLevel(v)}
            style={{ width: '100%' }}
            options={[
              { label: '级别1 — 直接拦截', value: 1 },
              { label: '级别2 — 需审核', value: 2 },
            ]}
          />
        </Space>
      </Modal>
    </>
  );
}
