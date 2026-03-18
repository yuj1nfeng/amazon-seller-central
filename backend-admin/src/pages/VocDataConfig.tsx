import React, { useState } from 'react';
import { 
  Card, 
  Table, 
  Button, 
  Select, 
  message, 
  Typography,
  Tag,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  Switch
} from 'antd';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { ADMIN_API_CONFIG, adminApiGet, adminApiPost, adminApiPut, adminApiDelete } from '../config/api';

const { Title } = Typography;
const { Option } = Select;

interface VocDataItem {
  id: string;
  store_id: string;
  product_name: string;
  asin: string;
  sku_status: string;
  fulfillment: string;
  dissatisfaction_rate: number;
  dissatisfaction_orders: number;
  total_orders: number;
  rating: number;
  return_rate: number;
  main_negative_reason: string;
  last_updated: string;
  satisfaction_status: string;
  is_out_of_stock: boolean;
  image?: string;
}

const VocDataConfig: React.FC = () => {
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<VocDataItem | null>(null);
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  // 获取所有店铺
  const { data: stores = [] } = useQuery({
    queryKey: ['stores'],
    queryFn: async () => {
      const data = await adminApiGet(ADMIN_API_CONFIG.ENDPOINTS.STORES.LIST);
      return data.data || [];
    },
  });

  // 设置默认店铺
  React.useEffect(() => {
    if (stores.length > 0 && !selectedStoreId) {
      setSelectedStoreId(stores[0].id);
    }
  }, [stores, selectedStoreId]);

  // 获取VOC数据
  const { data: vocData = [], isLoading } = useQuery({
    queryKey: ['vocData', selectedStoreId],
    queryFn: async () => {
      if (!selectedStoreId) return [];
      const data = await adminApiGet(ADMIN_API_CONFIG.ENDPOINTS.VOC.BY_STORE(selectedStoreId));
      return data.data || [];
    },
    enabled: !!selectedStoreId,
  });

  // 获取满意度汇总
  const { data: summary = {} } = useQuery({
    queryKey: ['vocSummary', selectedStoreId],
    queryFn: async () => {
      if (!selectedStoreId) return {};
      const data = await adminApiGet(`/api/voc/summary/${selectedStoreId}`);
      return data.data || {};
    },
    enabled: !!selectedStoreId,
  });

  const handleEdit = (record: VocDataItem) => {
    setEditingItem(record);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const handleAdd = () => {
    setEditingItem(null);
    form.resetFields();
    form.setFieldsValue({
      store_id: selectedStoreId,
      sku_status: 'Active',
      fulfillment: 'Amazon Fulfillment',
      satisfaction_status: 'Good',
      is_out_of_stock: false,
      last_updated: new Date().toISOString().split('T')[0],
    });
    setIsModalVisible(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      
      if (editingItem) {
        // Update existing item
        const data = await adminApiPut(`/api/voc/data/${selectedStoreId}/${editingItem.id}`, values);
        if (data.success) {
          message.success('VOC数据更新成功！');
        } else {
          message.error('更新失败');
        }
      } else {
        // Create new item
        const data = await adminApiPost(`/api/voc/data/${selectedStoreId}`, values);
        if (data.success) {
          message.success('VOC数据创建成功！');
        } else {
          message.error('创建失败');
        }
      }
      
      queryClient.invalidateQueries({ queryKey: ['vocData'] });
      queryClient.invalidateQueries({ queryKey: ['vocSummary'] });
      setIsModalVisible(false);
    } catch (error) {
      console.error('Form validation failed:', error);
      message.error('操作失败');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const data = await adminApiDelete(`/api/voc/data/${selectedStoreId}/${id}`);
      if (data.success) {
        message.success('VOC数据删除成功！');
        queryClient.invalidateQueries({ queryKey: ['vocData'] });
        queryClient.invalidateQueries({ queryKey: ['vocSummary'] });
      } else {
        message.error('删除失败');
      }
    } catch (error) {
      message.error('删除失败');
    }
  };

  const getSatisfactionColor = (status: string) => {
    switch (status) {
      case 'Excellent': return 'green';
      case 'Good': return 'blue';
      case 'Average': return 'orange';
      case 'Poor': return 'red';
      case 'Very Poor': return 'red';
      default: return 'default';
    }
  };

  const columns = [
    {
      title: '产品名称',
      dataIndex: 'product_name',
      key: 'product_name',
      width: 200,
      ellipsis: true,
    },
    {
      title: 'ASIN',
      dataIndex: 'asin',
      key: 'asin',
      width: 120,
    },
    {
      title: 'SKU状态',
      dataIndex: 'sku_status',
      key: 'sku_status',
      width: 100,
      render: (status: string) => (
        <Tag color={status === 'Active' ? 'green' : 'red'}>{status}</Tag>
      ),
    },
    {
      title: '配送方式',
      dataIndex: 'fulfillment',
      key: 'fulfillment',
      width: 150,
      ellipsis: true,
    },
    {
      title: '不满意率',
      dataIndex: 'dissatisfaction_rate',
      key: 'dissatisfaction_rate',
      width: 100,
      render: (rate: number) => `${rate}%`,
    },
    {
      title: '不满意订单',
      dataIndex: 'dissatisfaction_orders',
      key: 'dissatisfaction_orders',
      width: 120,
    },
    {
      title: '总订单数',
      dataIndex: 'total_orders',
      key: 'total_orders',
      width: 100,
    },
    {
      title: '评分',
      dataIndex: 'rating',
      key: 'rating',
      width: 80,
      render: (rating: number) => rating.toFixed(1),
    },
    {
      title: '退货率',
      dataIndex: 'return_rate',
      key: 'return_rate',
      width: 80,
      render: (rate: number) => `${rate}%`,
    },
    {
      title: '满意度状态',
      dataIndex: 'satisfaction_status',
      key: 'satisfaction_status',
      width: 120,
      render: (status: string) => (
        <Tag color={getSatisfactionColor(status)}>{status}</Tag>
      ),
    },
    {
      title: '缺货',
      dataIndex: 'is_out_of_stock',
      key: 'is_out_of_stock',
      width: 80,
      render: (isOutOfStock: boolean) => (
        <Tag color={isOutOfStock ? 'red' : 'green'}>
          {isOutOfStock ? '是' : '否'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record: VocDataItem) => (
        <Space size="middle">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={2}>客户之声数据配置</Title>
      
      {/* 店铺选择器 */}
      <Card title="🏪 选择店铺" style={{ marginBottom: 24 }}>
        <Select
          value={selectedStoreId}
          onChange={setSelectedStoreId}
          placeholder="请选择店铺"
          style={{ width: '100%', maxWidth: 300 }}
          size="large"
        >
          {stores.map((store: any) => (
            <Option key={store.id} value={store.id}>
              {store.name} ({store.marketplace})
            </Option>
          ))}
        </Select>
      </Card>

      {!selectedStoreId ? (
        <Card>
          <div className="text-center py-8">
            <p className="text-gray-500">请先选择一个店铺</p>
          </div>
        </Card>
      ) : (
        <>
          {/* 满意度汇总 */}
          <Card title="📊 满意度汇总" style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <Tag color="green">极好: {summary['Excellent'] || 0}</Tag>
              <Tag color="blue">良好: {summary['Good'] || 0}</Tag>
              <Tag color="orange">一般: {summary['Average'] || 0}</Tag>
              <Tag color="red">不合格: {summary['Poor'] || 0}</Tag>
              <Tag color="red">极差: {summary['Very Poor'] || 0}</Tag>
            </div>
          </Card>

          {/* VOC数据表格 */}
          <Card 
            title="🗣️ 客户之声数据" 
            extra={
              <Button 
                type="primary" 
                icon={<PlusOutlined />} 
                onClick={handleAdd}
              >
                添加数据
              </Button>
            }
          >
            <Table
              columns={columns}
              dataSource={vocData}
              rowKey="id"
              loading={isLoading}
              scroll={{ x: 1200 }}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => 
                  `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
              }}
            />
          </Card>
        </>
      )}

      {/* 编辑/添加模态框 */}
      <Modal
        title={editingItem ? '编辑VOC数据' : '添加VOC数据'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => setIsModalVisible(false)}
        width={800}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            sku_status: 'Active',
            fulfillment: 'Amazon Fulfillment',
            satisfaction_status: 'Good',
            is_out_of_stock: false,
          }}
        >
          <Form.Item name="store_id" hidden>
            <Input />
          </Form.Item>

          <Form.Item
            label="产品名称"
            name="product_name"
            rules={[{ required: true, message: '请输入产品名称' }]}
          >
            <Input placeholder="请输入产品名称" />
          </Form.Item>

          <Form.Item
            label="ASIN"
            name="asin"
            rules={[{ required: true, message: '请输入ASIN' }]}
          >
            <Input placeholder="请输入ASIN" />
          </Form.Item>

          <div style={{ display: 'flex', gap: '16px' }}>
            <Form.Item
              label="SKU状态"
              name="sku_status"
              style={{ flex: 1 }}
            >
              <Select>
                <Option value="Active">Active</Option>
                <Option value="Inactive">Inactive</Option>
              </Select>
            </Form.Item>

            <Form.Item
              label="配送方式"
              name="fulfillment"
              style={{ flex: 1 }}
            >
              <Select>
                <Option value="Amazon Fulfillment">Amazon Fulfillment</Option>
                <Option value="Seller Fulfillment">Seller Fulfillment</Option>
              </Select>
            </Form.Item>
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <Form.Item
              label="不满意率 (%)"
              name="dissatisfaction_rate"
              style={{ flex: 1 }}
              rules={[{ required: true, message: '请输入不满意率' }]}
            >
              <InputNumber
                min={0}
                max={100}
                step={0.1}
                placeholder="0.0"
                style={{ width: '100%' }}
              />
            </Form.Item>

            <Form.Item
              label="不满意订单数"
              name="dissatisfaction_orders"
              style={{ flex: 1 }}
              rules={[{ required: true, message: '请输入不满意订单数' }]}
            >
              <InputNumber
                min={0}
                placeholder="0"
                style={{ width: '100%' }}
              />
            </Form.Item>
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <Form.Item
              label="总订单数"
              name="total_orders"
              style={{ flex: 1 }}
              rules={[{ required: true, message: '请输入总订单数' }]}
            >
              <InputNumber
                min={0}
                placeholder="0"
                style={{ width: '100%' }}
              />
            </Form.Item>

            <Form.Item
              label="评分"
              name="rating"
              style={{ flex: 1 }}
              rules={[{ required: true, message: '请输入评分' }]}
            >
              <InputNumber
                min={0}
                max={5}
                step={0.1}
                placeholder="0.0"
                style={{ width: '100%' }}
              />
            </Form.Item>
          </div>

          <Form.Item
            label="退货率 (%)"
            name="return_rate"
            rules={[{ required: true, message: '请输入退货率' }]}
          >
            <InputNumber
              min={0}
              max={100}
              step={0.1}
              placeholder="0.0"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            label="主要负面原因"
            name="main_negative_reason"
          >
            <Input placeholder="请输入主要负面原因" />
          </Form.Item>

          <div style={{ display: 'flex', gap: '16px' }}>
            <Form.Item
              label="满意度状态"
              name="satisfaction_status"
              style={{ flex: 1 }}
            >
              <Select>
                <Option value="Excellent">Excellent</Option>
                <Option value="Good">Good</Option>
                <Option value="Average">Average</Option>
                <Option value="Poor">Poor</Option>
                <Option value="Very Poor">Very Poor</Option>
              </Select>
            </Form.Item>

            <Form.Item
              label="是否缺货"
              name="is_out_of_stock"
              valuePropName="checked"
              style={{ flex: 1 }}
            >
              <Switch />
            </Form.Item>
          </div>

          <Form.Item
            label="图片URL"
            name="image"
          >
            <Input placeholder="请输入图片URL" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default VocDataConfig;