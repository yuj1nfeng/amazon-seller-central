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
  Progress,
  Divider
} from 'antd';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { SaveOutlined, ReloadOutlined } from '@ant-design/icons';
import { ADMIN_API_CONFIG, adminApiGet, adminApiPut } from '../config/api';

const { Title } = Typography;

interface AccountHealthConfigProps {
  selectedStoreId: string;
  selectedStore: any;
}

const AccountHealthConfig: React.FC<AccountHealthConfigProps> = ({ 
  selectedStoreId, 
  selectedStore 
}) => {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  // 获取Account Health数据
  const { data: accountHealthData, isLoading } = useQuery({
    queryKey: ['accountHealthData', selectedStoreId],
    queryFn: async () => {
      if (!selectedStoreId) return null;
      const data = await adminApiGet(`/api/account-health/${selectedStoreId}`);
      return data.data || null;
    },
    enabled: !!selectedStoreId,
  });

  // 当数据加载完成时，更新表单
  React.useEffect(() => {
    if (accountHealthData) {
      form.setFieldsValue({
        ...accountHealthData,
        // Flatten nested objects for form
        seller_fulfilled_defect_rate: accountHealthData.order_defect_rate.seller_fulfilled,
        fulfilled_by_amazon_defect_rate: accountHealthData.order_defect_rate.fulfilled_by_amazon,
        negative_feedback: accountHealthData.policy_violations.negative_feedback,
        a_to_z_claims: accountHealthData.policy_violations.a_to_z_claims,
        chargeback_claims: accountHealthData.policy_violations.chargeback_claims,
        late_shipment_rate: accountHealthData.shipping_performance.late_shipment_rate,
        pre_fulfillment_cancel_rate: accountHealthData.shipping_performance.pre_fulfillment_cancel_rate,
        valid_tracking_rate: accountHealthData.shipping_performance.valid_tracking_rate,
        on_time_delivery_rate: accountHealthData.shipping_performance.on_time_delivery_rate,
        product_policy_violations: accountHealthData.policy_compliance.product_policy_violations,
        listing_policy_violations: accountHealthData.policy_compliance.listing_policy_violations,
        intellectual_property_violations: accountHealthData.policy_compliance.intellectual_property_violations,
        customer_product_reviews: accountHealthData.policy_compliance.customer_product_reviews,
        other_policy_violations: accountHealthData.policy_compliance.other_policy_violations
      });
    }
  }, [accountHealthData, form]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      
      // Restructure data to match API format
      const formattedValues = {
        order_defect_rate: {
          seller_fulfilled: values.seller_fulfilled_defect_rate,
          fulfilled_by_amazon: values.fulfilled_by_amazon_defect_rate
        },
        policy_violations: {
          negative_feedback: values.negative_feedback,
          a_to_z_claims: values.a_to_z_claims,
          chargeback_claims: values.chargeback_claims
        },
        account_health_rating: values.account_health_rating,
        shipping_performance: {
          late_shipment_rate: values.late_shipment_rate,
          pre_fulfillment_cancel_rate: values.pre_fulfillment_cancel_rate,
          valid_tracking_rate: values.valid_tracking_rate,
          on_time_delivery_rate: values.on_time_delivery_rate
        },
        policy_compliance: {
          product_policy_violations: values.product_policy_violations,
          listing_policy_violations: values.listing_policy_violations,
          intellectual_property_violations: values.intellectual_property_violations,
          customer_product_reviews: values.customer_product_reviews,
          other_policy_violations: values.other_policy_violations
        }
      };
      
      const data = await adminApiPut(`/api/account-health/${selectedStoreId}`, formattedValues);
      if (data.success) {
        message.success('Account Health数据更新成功！');
        queryClient.invalidateQueries({ queryKey: ['accountHealthData'] });
      } else {
        message.error('更新失败');
      }
    } catch (error) {
      console.error('Form validation failed:', error);
      message.error('操作失败');
    }
  };

  const handleReset = () => {
    if (accountHealthData) {
      form.setFieldsValue({
        ...accountHealthData,
        seller_fulfilled_defect_rate: accountHealthData.order_defect_rate.seller_fulfilled,
        fulfilled_by_amazon_defect_rate: accountHealthData.order_defect_rate.fulfilled_by_amazon,
        negative_feedback: accountHealthData.policy_violations.negative_feedback,
        a_to_z_claims: accountHealthData.policy_violations.a_to_z_claims,
        chargeback_claims: accountHealthData.policy_violations.chargeback_claims,
        late_shipment_rate: accountHealthData.shipping_performance.late_shipment_rate,
        pre_fulfillment_cancel_rate: accountHealthData.shipping_performance.pre_fulfillment_cancel_rate,
        valid_tracking_rate: accountHealthData.shipping_performance.valid_tracking_rate,
        on_time_delivery_rate: accountHealthData.shipping_performance.on_time_delivery_rate,
        product_policy_violations: accountHealthData.policy_compliance.product_policy_violations,
        listing_policy_violations: accountHealthData.policy_compliance.listing_policy_violations,
        intellectual_property_violations: accountHealthData.policy_compliance.intellectual_property_violations,
        customer_product_reviews: accountHealthData.policy_compliance.customer_product_reviews,
        other_policy_violations: accountHealthData.policy_compliance.other_policy_violations
      });
      message.info('已重置为原始数据');
    }
  };

  const getHealthRatingColor = (rating: number) => {
    if (rating >= 900) return '#52c41a'; // Green
    if (rating >= 700) return '#faad14'; // Orange
    return '#f5222d'; // Red
  };

  const getHealthRatingStatus = (rating: number) => {
    if (rating >= 900) return 'success';
    if (rating >= 700) return 'normal';
    return 'exception';
  };

  const currentStore = selectedStore;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={2}>Account Health 数据配置</Title>
        {selectedStore && (
          <div style={{ fontSize: '14px', color: '#666' }}>
            当前店铺: <strong>{selectedStore.name}</strong> ({selectedStore.marketplace})
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
            请先在页面顶部选择一个店铺
          </div>
        </Card>
      ) : (
        <>
          {/* 当前数据概览 */}
          <Card title="📊 当前Account Health概览" style={{ marginBottom: 24 }}>
            <Row gutter={16}>
              <Col span={6}>
                <Statistic
                  title="Account Health Rating"
                  value={accountHealthData?.account_health_rating || 0}
                  suffix="/ 1000"
                  valueStyle={{ color: getHealthRatingColor(accountHealthData?.account_health_rating || 0) }}
                />
                <Progress 
                  percent={(accountHealthData?.account_health_rating || 0) / 10} 
                  status={getHealthRatingStatus(accountHealthData?.account_health_rating || 0)}
                  showInfo={false}
                  style={{ marginTop: 8 }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Seller Fulfilled Defect Rate"
                  value={accountHealthData?.order_defect_rate?.seller_fulfilled || 0}
                  suffix="%"
                  precision={1}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="FBA Defect Rate"
                  value={accountHealthData?.order_defect_rate?.fulfilled_by_amazon || 0}
                  suffix="%"
                  precision={1}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Valid Tracking Rate"
                  value={accountHealthData?.shipping_performance?.valid_tracking_rate || 0}
                  suffix="%"
                />
              </Col>
            </Row>
          </Card>

          {/* 编辑表单 */}
          <Card 
            title="✏️ 编辑Account Health数据" 
            extra={
              <Space>
                <Button 
                  icon={<ReloadOutlined />} 
                  onClick={handleReset}
                >
                  重置
                </Button>
                <Button 
                  type="primary" 
                  icon={<SaveOutlined />} 
                  onClick={handleSave}
                  loading={isLoading}
                >
                  保存更改
                </Button>
              </Space>
            }
          >
            <Form
              form={form}
              layout="vertical"
              initialValues={{
                account_health_rating: 982,
                seller_fulfilled_defect_rate: 3,
                fulfilled_by_amazon_defect_rate: 2,
                negative_feedback: 0,
                a_to_z_claims: 0,
                chargeback_claims: 0,
                late_shipment_rate: 0,
                pre_fulfillment_cancel_rate: 0,
                valid_tracking_rate: 99,
                on_time_delivery_rate: null,
                product_policy_violations: 0,
                listing_policy_violations: 0,
                intellectual_property_violations: 0,
                customer_product_reviews: 0,
                other_policy_violations: 0
              }}
            >
              {/* Account Health Rating */}
              <Divider orientation="left">Account Health Rating</Divider>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Account Health Rating (0-1000)"
                    name="account_health_rating"
                    rules={[{ required: true, message: '请输入Account Health Rating' }]}
                  >
                    <InputNumber
                      min={0}
                      max={1000}
                      placeholder="982"
                      style={{ width: '100%' }}
                      size="large"
                    />
                  </Form.Item>
                </Col>
              </Row>

              {/* Order Defect Rate */}
              <Divider orientation="left">Order Defect Rate</Divider>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Seller Fulfilled (%)"
                    name="seller_fulfilled_defect_rate"
                    rules={[{ required: true, message: '请输入Seller Fulfilled缺陷率' }]}
                  >
                    <InputNumber
                      min={0}
                      max={100}
                      precision={1}
                      placeholder="3.0"
                      style={{ width: '100%' }}
                      size="large"
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Fulfilled by Amazon (%)"
                    name="fulfilled_by_amazon_defect_rate"
                    rules={[{ required: true, message: '请输入FBA缺陷率' }]}
                  >
                    <InputNumber
                      min={0}
                      max={100}
                      precision={1}
                      placeholder="2.0"
                      style={{ width: '100%' }}
                      size="large"
                    />
                  </Form.Item>
                </Col>
              </Row>

              {/* Policy Violations */}
              <Divider orientation="left">Policy Violations</Divider>
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item
                    label="Negative Feedback (%)"
                    name="negative_feedback"
                    rules={[{ required: true, message: '请输入负面反馈率' }]}
                  >
                    <InputNumber
                      min={0}
                      max={100}
                      precision={1}
                      placeholder="0"
                      style={{ width: '100%' }}
                      size="large"
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="A-to-Z Claims (%)"
                    name="a_to_z_claims"
                    rules={[{ required: true, message: '请输入A-to-Z申诉率' }]}
                  >
                    <InputNumber
                      min={0}
                      max={100}
                      precision={1}
                      placeholder="0"
                      style={{ width: '100%' }}
                      size="large"
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="Chargeback Claims (%)"
                    name="chargeback_claims"
                    rules={[{ required: true, message: '请输入退单申诉率' }]}
                  >
                    <InputNumber
                      min={0}
                      max={100}
                      precision={1}
                      placeholder="0"
                      style={{ width: '100%' }}
                      size="large"
                    />
                  </Form.Item>
                </Col>
              </Row>

              {/* Shipping Performance */}
              <Divider orientation="left">Shipping Performance</Divider>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Late Shipment Rate (%)"
                    name="late_shipment_rate"
                    rules={[{ required: true, message: '请输入延迟发货率' }]}
                  >
                    <InputNumber
                      min={0}
                      max={100}
                      precision={1}
                      placeholder="0"
                      style={{ width: '100%' }}
                      size="large"
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Pre-fulfillment Cancel Rate (%)"
                    name="pre_fulfillment_cancel_rate"
                    rules={[{ required: true, message: '请输入预履行取消率' }]}
                  >
                    <InputNumber
                      min={0}
                      max={100}
                      precision={1}
                      placeholder="0"
                      style={{ width: '100%' }}
                      size="large"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Valid Tracking Rate (%)"
                    name="valid_tracking_rate"
                    rules={[{ required: true, message: '请输入有效跟踪率' }]}
                  >
                    <InputNumber
                      min={0}
                      max={100}
                      precision={0}
                      placeholder="99"
                      style={{ width: '100%' }}
                      size="large"
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="On-time Delivery Rate (%) - Optional"
                    name="on_time_delivery_rate"
                  >
                    <InputNumber
                      min={0}
                      max={100}
                      precision={1}
                      placeholder="N/A"
                      style={{ width: '100%' }}
                      size="large"
                    />
                  </Form.Item>
                </Col>
              </Row>

              {/* Policy Compliance */}
              <Divider orientation="left">Policy Compliance Issues</Divider>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Product Policy Violations"
                    name="product_policy_violations"
                    rules={[{ required: true, message: '请输入产品政策违规数' }]}
                  >
                    <InputNumber
                      min={0}
                      placeholder="0"
                      style={{ width: '100%' }}
                      size="large"
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Listing Policy Violations"
                    name="listing_policy_violations"
                    rules={[{ required: true, message: '请输入列表政策违规数' }]}
                  >
                    <InputNumber
                      min={0}
                      placeholder="0"
                      style={{ width: '100%' }}
                      size="large"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item
                    label="Intellectual Property Violations"
                    name="intellectual_property_violations"
                    rules={[{ required: true, message: '请输入知识产权违规数' }]}
                  >
                    <InputNumber
                      min={0}
                      placeholder="0"
                      style={{ width: '100%' }}
                      size="large"
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="Customer Product Reviews"
                    name="customer_product_reviews"
                    rules={[{ required: true, message: '请输入客户产品评论问题数' }]}
                  >
                    <InputNumber
                      min={0}
                      placeholder="0"
                      style={{ width: '100%' }}
                      size="large"
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="Other Policy Violations"
                    name="other_policy_violations"
                    rules={[{ required: true, message: '请输入其他政策违规数' }]}
                  >
                    <InputNumber
                      min={0}
                      placeholder="0"
                      style={{ width: '100%' }}
                      size="large"
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          </Card>

          {/* 使用说明 */}
          <Card title="💡 使用说明" style={{ marginTop: 24 }}>
            <div style={{ lineHeight: '1.8' }}>
              <p><strong>Account Health</strong> 数据显示在前端Account Health页面：</p>
              <ul style={{ paddingLeft: '20px' }}>
                <li><strong>Account Health Rating</strong>: 账户健康评分 (0-1000)</li>
                <li><strong>Order Defect Rate</strong>: 订单缺陷率，分为自发货和FBA</li>
                <li><strong>Policy Violations</strong>: 政策违规相关指标</li>
                <li><strong>Shipping Performance</strong>: 发货表现指标</li>
                <li><strong>Policy Compliance</strong>: 政策合规问题数量</li>
              </ul>
              <p><strong>注意：</strong>修改这些数值后，前端Account Health页面会实时更新显示。</p>
            </div>
          </Card>
        </>
      )}
    </div>
  );
};

export default AccountHealthConfig;