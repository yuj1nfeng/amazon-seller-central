import React, { useState } from 'react';
import { 
  Card, 
  Form, 
  InputNumber, 
  Button, 
  DatePicker, 
  Slider, 
  message, 
  Typography,
  Row,
  Col,
  Statistic
} from 'antd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { salesApi } from '../services/api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface SalesDataConfigProps {
  selectedStoreId: string;
  selectedStore: any;
  onStoreChange: (storeId: string, store: any) => void;
}

const SalesDataConfig: React.FC<SalesDataConfigProps> = ({ 
  selectedStoreId, 
  selectedStore 
}) => {
  const [form] = Form.useForm();
  const [generateForm] = Form.useForm();
  const [volatility, setVolatility] = useState(0.3);
  const queryClient = useQueryClient();

  // 获取销售快照数据
  const { data: salesSnapshot, isLoading } = useQuery({
    queryKey: ['salesSnapshot', selectedStoreId],
    queryFn: () => salesApi.getSalesSnapshot(selectedStoreId),
    enabled: !!selectedStoreId,
  });

  // 更新销售快照
  const updateSnapshotMutation = useMutation({
    mutationFn: (data: any) => salesApi.updateSalesSnapshot(selectedStoreId, data),
    onSuccess: () => {
      message.success('销售快照更新成功！');
      queryClient.invalidateQueries({ queryKey: ['salesSnapshot'] });
    },
    onError: () => {
      message.error('更新失败，请重试');
    },
  });

  // 生成每日销售数据
  const generateDailySalesMutation = useMutation({
    mutationFn: (data: any) => salesApi.generateDailySales(selectedStoreId, data),
    onSuccess: (response) => {
      message.success(`成功生成 ${response.data.length} 天的销售数据！`);
      queryClient.invalidateQueries({ queryKey: ['dailySales'] });
    },
    onError: () => {
      message.error('生成失败，请重试');
    },
  });

  const handleSnapshotSubmit = (values: any) => {
    if (!selectedStoreId) {
      message.error('请先选择店铺');
      return;
    }
    updateSnapshotMutation.mutate(values);
  };

  const handleGenerateData = (values: any) => {
    if (!selectedStoreId) {
      message.error('请先选择店铺');
      return;
    }
    
    const { dateRange, totalSales, totalUnits } = values;
    
    generateDailySalesMutation.mutate({
      startDate: dateRange[0].format('YYYY-MM-DD'),
      endDate: dateRange[1].format('YYYY-MM-DD'),
      totalSales,
      totalUnits,
      volatility,
    });
  };

  // 计算平均值
  const calculateAverages = (values: any) => {
    const { total_order_items, units_ordered, ordered_product_sales } = values;
    
    if (total_order_items && units_ordered) {
      form.setFieldValue('avg_units_per_order', (units_ordered / total_order_items).toFixed(2));
    }
    
    if (total_order_items && ordered_product_sales) {
      form.setFieldValue('avg_sales_per_order', (ordered_product_sales / total_order_items).toFixed(2));
    }
  };

  React.useEffect(() => {
    if (salesSnapshot) {
      form.setFieldsValue(salesSnapshot);
    }
  }, [salesSnapshot, form]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={2}>销售数据配置</Title>
        {selectedStore && (
          <div style={{ fontSize: '14px', color: '#666' }}>
            当前店铺: <strong>{selectedStore.name}</strong> ({selectedStore.marketplace})
          </div>
        )}
      </div>

      {!selectedStoreId ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '60px 0', 
          color: '#999',
          fontSize: '16px' 
        }}>
          请先在页面顶部选择一个店铺
        </div>
      ) : (
        <Row gutter={24}>
        <Col span={12}>
          {/* 销售快照数据配置 */}
          <Card title="📈 销售快照数据" style={{ marginBottom: 24 }}>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSnapshotSubmit}
              onValuesChange={calculateAverages}
            >
              <Form.Item
                label="总订单项数"
                name="total_order_items"
                rules={[{ required: true, message: '请输入总订单项数' }]}
              >
                <InputNumber
                  placeholder="请输入总订单项数"
                  min={0}
                  style={{ width: '100%' }}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                />
              </Form.Item>

              <Form.Item
                label="订购单位数"
                name="units_ordered"
                rules={[{ required: true, message: '请输入订购单位数' }]}
              >
                <InputNumber
                  placeholder="请输入订购单位数"
                  min={0}
                  style={{ width: '100%' }}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                />
              </Form.Item>

              <Form.Item
                label="订购销售额"
                name="ordered_product_sales"
                rules={[{ required: true, message: '请输入订购销售额' }]}
              >
                <InputNumber
                  placeholder="请输入订购销售额"
                  min={0}
                  step={0.01}
                  style={{ width: '100%' }}
                  addonBefore="$"
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                />
              </Form.Item>

              <Form.Item
                label="平均单位/订单 (自动计算)"
                name="avg_units_per_order"
              >
                <InputNumber
                  placeholder="自动计算"
                  disabled
                  style={{ width: '100%' }}
                />
              </Form.Item>

              <Form.Item
                label="平均销售/订单 (自动计算)"
                name="avg_sales_per_order"
              >
                <InputNumber
                  placeholder="自动计算"
                  disabled
                  style={{ width: '100%' }}
                  addonBefore="$"
                />
              </Form.Item>

              <Form.Item>
                <Button 
                  type="primary" 
                  htmlType="submit"
                  loading={updateSnapshotMutation.isPending}
                  block
                >
                  保存销售快照
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        <Col span={12}>
          {/* 图表数据生成 */}
          <Card title="📊 图表数据生成" style={{ marginBottom: 24 }}>
            <Form
              form={generateForm}
              layout="vertical"
              onFinish={handleGenerateData}
              initialValues={{
                dateRange: [dayjs().subtract(30, 'day'), dayjs()],
                totalSales: 500000,
                totalUnits: 10000,
              }}
            >
              <Form.Item
                label="日期范围"
                name="dateRange"
                rules={[{ required: true, message: '请选择日期范围' }]}
              >
                <RangePicker style={{ width: '100%' }} />
              </Form.Item>

              <Form.Item
                label="总销售额"
                name="totalSales"
                rules={[{ required: true, message: '请输入总销售额' }]}
              >
                <InputNumber
                  placeholder="请输入总销售额"
                  min={0}
                  step={0.01}
                  style={{ width: '100%' }}
                  addonBefore="$"
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                />
              </Form.Item>

              <Form.Item
                label="总订单数"
                name="totalUnits"
                rules={[{ required: true, message: '请输入总订单数' }]}
              >
                <InputNumber
                  placeholder="请输入总订单数"
                  min={0}
                  style={{ width: '100%' }}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                />
              </Form.Item>

              <Form.Item label={`波动系数: ${volatility} (0-1, 越大波动越明显)`}>
                <Slider
                  min={0}
                  max={1}
                  step={0.1}
                  value={volatility}
                  onChange={setVolatility}
                  marks={{
                    0: '0',
                    0.3: '0.3',
                    0.5: '0.5',
                    1: '1'
                  }}
                />
              </Form.Item>

              <Form.Item>
                <Button 
                  type="primary" 
                  htmlType="submit"
                  loading={generateDailySalesMutation.isPending}
                  block
                  style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                >
                  🎲 生成随机每日数据
                </Button>
              </Form.Item>
            </Form>
          </Card>

          {/* 当前数据统计 */}
          {salesSnapshot && (
            <Card title="📋 当前数据统计">
              <Row gutter={16}>
                <Col span={12}>
                  <Statistic
                    title="总订单项"
                    value={salesSnapshot.total_order_items}
                    formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="订购单位"
                    value={salesSnapshot.units_ordered}
                    formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  />
                </Col>
                <Col span={12} style={{ marginTop: 16 }}>
                  <Statistic
                    title="销售额"
                    value={salesSnapshot.ordered_product_sales}
                    prefix="$"
                    precision={2}
                    formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  />
                </Col>
                <Col span={12} style={{ marginTop: 16 }}>
                  <Statistic
                    title="平均订单价值"
                    value={salesSnapshot.avg_sales_per_order}
                    prefix="$"
                    precision={2}
                  />
                </Col>
              </Row>
            </Card>
          )}
        </Col>
      </Row>
      )}
    </div>
  );
};

export default SalesDataConfig;