import React from 'react';
import {
  Card,
  Button,
  message,
  Typography,
  Space,
  Form,
  InputNumber,
  Row,
  Col,
  Statistic,
  DatePicker
} from 'antd';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { SaveOutlined, ReloadOutlined } from '@ant-design/icons';
import { ADMIN_API_CONFIG, adminApiGet, adminApiPut } from '../config/api';
import dayjs from 'dayjs';

const { Title } = Typography;

interface BusinessReportsConfigProps {
  selectedStoreId: string;
  selectedStore: any;
}

const BusinessReportsConfig: React.FC<BusinessReportsConfigProps> = ({
  selectedStoreId,
  selectedStore
}) => {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  // ?? Sales Snapshot ??
  const { data: salesSnapshotData, isLoading } = useQuery({
    queryKey: ['salesSnapshotData', selectedStoreId],
    queryFn: async () => {
      if (!selectedStoreId) return null;
      const data = await adminApiGet(`/api/sales/snapshot/${selectedStoreId}`);
      return data.data || null;
    },
    enabled: !!selectedStoreId,
  });

  // ?????????????
  React.useEffect(() => {
    if (salesSnapshotData) {
      form.setFieldsValue({
        ...salesSnapshotData,
        snapshot_time: salesSnapshotData.snapshot_time ? dayjs(salesSnapshotData.snapshot_time) : dayjs()
      });
    }
  }, [salesSnapshotData, form]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();

      // ??????
      const formattedValues = {
        ...values,
        snapshot_time: values.snapshot_time ? values.snapshot_time.toISOString() : new Date().toISOString()
      };

      const data = await adminApiPut(`/api/sales/snapshot/${selectedStoreId}`, formattedValues);
      if (data.success) {
        message.success('Business Reports ???????');
        queryClient.invalidateQueries({ queryKey: ['salesSnapshotData'] });
      } else {
        message.error('????');
      }
    } catch (error) {
      console.error('Form validation failed:', error);
      message.error('????');
    }
  };

  const handleReset = () => {
    if (salesSnapshotData) {
      form.setFieldsValue({
        ...salesSnapshotData,
        snapshot_time: salesSnapshotData.snapshot_time ? dayjs(salesSnapshotData.snapshot_time) : dayjs()
      });
      message.info('????????');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={2}>Business Reports ????</Title>
        {selectedStore && (
          <div style={{ fontSize: '14px', color: '#666' }}>
            ?????<strong>{selectedStore.name}</strong> ({selectedStore.marketplace})
          </div>
        )}
      </div>

      {!selectedStoreId ? (
        <Card>
          <div style={{
            textAlign: 'center',
            padding: '60px 0',
            color: '#999',
            fontSize: '16px'
          }}>
            ?????????????
          </div>
        </Card>
      ) : (
        <>
          {/* ?????? */}
          <Card title="?? ?? Sales Snapshot ??" style={{ marginBottom: 24 }}>
            <Row gutter={16}>
              <Col span={4}>
                <Statistic
                  title="Total Order Items"
                  value={salesSnapshotData?.total_order_items || 0}
                  formatter={(value) => formatNumber(Number(value))}
                />
              </Col>
              <Col span={4}>
                <Statistic
                  title="Units Ordered"
                  value={salesSnapshotData?.units_ordered || 0}
                  formatter={(value) => formatNumber(Number(value))}
                />
              </Col>
              <Col span={4}>
                <Statistic
                  title="Ordered Product Sales"
                  value={salesSnapshotData?.ordered_product_sales || 0}
                  formatter={(value) => formatCurrency(Number(value))}
                />
              </Col>
              <Col span={4}>
                <Statistic
                  title="Avg Units/Order Item"
                  value={salesSnapshotData?.avg_units_per_order_item || 0}
                  precision={2}
                />
              </Col>
              <Col span={4}>
                <Statistic
                  title="Avg Sales/Order Item"
                  value={salesSnapshotData?.avg_sales_per_order_item || 0}
                  formatter={(value) => formatCurrency(Number(value))}
                />
              </Col>
              <Col span={4}>
                <Statistic
                  title="Last Updated"
                  value={salesSnapshotData?.snapshot_time ? dayjs(salesSnapshotData.snapshot_time).format('MM/DD HH:mm') : 'N/A'}
                />
              </Col>
            </Row>
          </Card>

          {/* ???? */}
          <Card
            title="?? ?? Sales Snapshot ??"
            extra={
              <Space>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={handleReset}
                >
                  ??
                </Button>
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  onClick={handleSave}
                  loading={isLoading}
                >
                  ????
                </Button>
              </Space>
            }
          >
            <Form
              form={form}
              layout="vertical"
              initialValues={{
                total_order_items: 154066,
                units_ordered: 174714,
                ordered_product_sales: 19701989.13,
                avg_units_per_order_item: 1.13,
                avg_sales_per_order_item: 127.88,
                snapshot_time: dayjs()
              }}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Total Order Items"
                    name="total_order_items"
                    rules={[{ required: true, message: '??? Total Order Items' }]}
                  >
                    <InputNumber
                      min={0}
                      placeholder="154066"
                      style={{ width: '100%' }}
                      size="large"
                      formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    label="Units Ordered"
                    name="units_ordered"
                    rules={[{ required: true, message: '??? Units Ordered' }]}
                  >
                    <InputNumber
                      min={0}
                      placeholder="174714"
                      style={{ width: '100%' }}
                      size="large"
                      formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Ordered Product Sales ($)"
                    name="ordered_product_sales"
                    rules={[{ required: true, message: '??? Ordered Product Sales' }]}
                  >
                    <InputNumber
                      min={0}
                      precision={2}
                      placeholder="19701989.13"
                      style={{ width: '100%' }}
                      size="large"
                      formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    label="Avg. Units/Order Item"
                    name="avg_units_per_order_item"
                    rules={[{ required: true, message: '??? Avg Units per Order Item' }]}
                  >
                    <InputNumber
                      min={0}
                      precision={2}
                      placeholder="1.13"
                      style={{ width: '100%' }}
                      size="large"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Avg. Sales/Order Item ($)"
                    name="avg_sales_per_order_item"
                    rules={[{ required: true, message: '??? Avg Sales per Order Item' }]}
                  >
                    <InputNumber
                      min={0}
                      precision={2}
                      placeholder="127.88"
                      style={{ width: '100%' }}
                      size="large"
                      formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    label="Snapshot Time"
                    name="snapshot_time"
                    rules={[{ required: true, message: '???????' }]}
                  >
                    <DatePicker
                      showTime
                      format="YYYY-MM-DD HH:mm:ss"
                      style={{ width: '100%' }}
                      size="large"
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          </Card>

          {/* ???? */}
          <Card title="?? ????" style={{ marginTop: 24 }}>
            <div style={{ lineHeight: '1.8' }}>
              <p><strong>Sales Snapshot</strong> ??? Business Reports ??????????</p>
              <ul style={{ paddingLeft: '20px' }}>
                <li><strong>Total Order Items</strong>: ??????</li>
                <li><strong>Units Ordered</strong>: ?????</li>
                <li><strong>Ordered Product Sales</strong>: ???????</li>
                <li><strong>Avg. Units/Order Item</strong>: ?????/????</li>
                <li><strong>Avg. Sales/Order Item</strong>: ?????/????</li>
              </ul>
              <p><strong>???</strong>?????????? Business Reports ??? Sales Snapshot ????????</p>
            </div>
          </Card>
        </>
      )}
    </div>
  );
};

export default BusinessReportsConfig;
