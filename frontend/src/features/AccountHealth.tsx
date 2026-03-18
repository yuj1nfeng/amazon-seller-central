
import React, { useState, useEffect } from 'react';
import { ShieldCheck, ChevronRight, ChevronDown } from 'lucide-react';
import { Card, Button } from '../components/UI';
import { useI18n } from '../hooks/useI18n';
import { useStore } from '../store';
import { apiGet } from '../config/api';

interface AccountHealthData {
  id: string;
  store_id: string;
  order_defect_rate: {
    seller_fulfilled: number;
    fulfilled_by_amazon: number;
  };
  policy_violations: {
    negative_feedback: number;
    a_to_z_claims: number;
    chargeback_claims: number;
  };
  account_health_rating: number;
  shipping_performance: {
    late_shipment_rate: number;
    pre_fulfillment_cancel_rate: number;
    valid_tracking_rate: number;
    on_time_delivery_rate: number | null;
  };
  policy_compliance: {
    product_policy_violations: number;
    listing_policy_violations: number;
    intellectual_property_violations: number;
    customer_product_reviews: number;
    other_policy_violations: number;
  };
  updated_at: string;
}

const AccountHealth: React.FC = () => {
  const { t } = useI18n();
  const { currentStore } = useStore();
  const [accountHealthData, setAccountHealthData] = useState<AccountHealthData | null>(null);
  const [loading, setLoading] = useState(false);

  // Load account health data from backend
  useEffect(() => {
    const loadAccountHealthData = async () => {
      if (!currentStore?.id) return;

      try {
        setLoading(true);
        const response = await apiGet(`/api/account-health/${currentStore.id}`);
        if (response.success && response.data) {
          setAccountHealthData(response.data);
        }
      } catch (error) {
        console.error('Failed to load account health data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAccountHealthData();
  }, [currentStore]);

  // Calculate total policy violations
  const totalPolicyViolations = accountHealthData ? 
    accountHealthData.policy_compliance.product_policy_violations +
    accountHealthData.policy_compliance.listing_policy_violations +
    accountHealthData.policy_compliance.intellectual_property_violations +
    accountHealthData.policy_compliance.customer_product_reviews +
    accountHealthData.policy_compliance.other_policy_violations : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-amazon-teal border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Page Title */}
      <h1 className="text-2xl font-black text-amazon-text uppercase tracking-tight mb-4">{t('accountHealth')}</h1>
      
      {/* Intro Paragraph */}
      <p className="text-sm-amz text-amazon-secondaryText leading-relaxed mb-6">
        {t('accountHealthIntro')}
        <a href="#" className="text-amazon-link font-bold hover:underline ml-1">{t('contactEmergencySupport')}</a> {t('immediateAssistance')}
      </p>

      {/* Top Section */}
      <div className="grid grid-cols-12 gap-6 mb-8">
        {/* Center Banner: Account Health Assurance */}
        <div className="col-span-12 lg:col-span-8">
          <Card className="!p-6 flex items-center gap-4">
            <div className="text-amazon-teal">
              <ShieldCheck size={48} />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-amazon-text mb-2">{t('accountHealthAssurance')}</h2>
              <p className="text-sm-amz text-amazon-secondaryText leading-relaxed mb-3">
                {t('accountHealthAssuranceDesc')}
              </p>
              <a href="#" className="text-amazon-link font-bold hover:underline flex items-center gap-1">
                {t('seeQualifyRequirements')} <ChevronRight size={14} />
              </a>
            </div>
          </Card>
        </div>
        
        {/* Right-side Help Card */}
        <div className="col-span-12 lg:col-span-4">
          <Card className="!p-6">
            <h2 className="text-lg font-bold text-amazon-text mb-2">{t('needHelpAccount')}</h2>
            <p className="text-sm-amz text-amazon-secondaryText leading-relaxed mb-4">
              {t('supportTeamAvailable')}
            </p>
            <Button variant="yellow" className="w-full">
              {t('contactUs')}
            </Button>
          </Card>
        </div>
      </div>

      {/* Main Content: 3-column Layout */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left Card: Customer Service Performance */}
        <div className="col-span-12 lg:col-span-4">
          <Card title={t('customerServicePerformance')} className="h-full">
            <div className="space-y-6">
              {/* Order Defect Rate */}
              <div>
                <h3 className="text-sm-amz font-bold text-amazon-text mb-2">{t('orderDefectRate')}</h3>
                <p className="text-xs-amz text-amazon-secondaryText mb-4">{t('target')}: {t('under1Percent')}</p>
                
                {/* Comparison Table */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-gray-50 rounded-sm p-3">
                    <p className="text-xs-amz text-amazon-secondaryText mb-1">{t('sellerFulfilled')}</p>
                    <p className="text-lg font-bold text-amazon-text">
                      {accountHealthData?.order_defect_rate?.seller_fulfilled || 3}%
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-sm p-3">
                    <p className="text-xs-amz text-amazon-secondaryText mb-1">{t('fulfilledByAmazon')}</p>
                    <p className="text-lg font-bold text-amazon-text">
                      {accountHealthData?.order_defect_rate?.fulfilled_by_amazon || 2}%
                    </p>
                  </div>
                </div>
                
                {/* Metrics Breakdown */}
                <p className="text-xs-amz text-amazon-secondaryText mb-2">
                  {t('orderDefectRateConsists')}
                </p>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between items-center">
                    <p className="text-sm-amz text-amazon-secondaryText">{t('negativeFeedback')}</p>
                    <p className="text-sm-amz font-bold text-amazon-text">
                      {accountHealthData?.policy_violations?.negative_feedback || 0}%
                    </p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-sm-amz text-amazon-secondaryText">{t('aToZClaims')}</p>
                    <p className="text-sm-amz font-bold text-amazon-text">
                      {accountHealthData?.policy_violations?.a_to_z_claims || 0}%
                    </p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-sm-amz text-amazon-secondaryText">{t('chargebackClaims')}</p>
                    <p className="text-sm-amz font-bold text-amazon-text">
                      {accountHealthData?.policy_violations?.chargeback_claims || 0}%
                    </p>
                  </div>
                </div>
                
                {/* View Details Link */}
                <a href="#" className="text-amazon-link font-bold hover:underline text-sm-amz">
                  {t('viewDetails')}
                </a>
              </div>
            </div>
          </Card>
        </div>
        
        {/* Middle Card: Policy Compliance */}
        <div className="col-span-12 lg:col-span-4">
          <Card 
            title={t('policyCompliance')} 
            className="h-full" 
            headerAction={
              <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs font-bold">
                {t('healthy')}
              </span>
            }
          >
            <div className="space-y-6">
              {/* Account Health Rating */}
              <div>
                <h3 className="text-sm-amz font-bold text-amazon-text mb-2">{t('accountHealthRating')}</h3>
                <p className="text-3xl font-bold text-amazon-text mb-4">
                  {accountHealthData?.account_health_rating || 982}
                </p>
                
                {/* Horizontal Scale Bar */}
                <div className="relative">
                  <div className="w-full h-4 bg-gray-200 rounded-sm overflow-hidden">
                    <div 
                      className="h-full bg-amazon-teal rounded-sm" 
                      style={{ width: `${((accountHealthData?.account_health_rating || 982) / 1000) * 100}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between mt-1 text-[10px] text-amazon-secondaryText">
                    <span>0</span>
                    <span>100</span>
                    <span>200</span>
                    <span>1000</span>
                  </div>
                </div>
              </div>
              
              {/* All Issues List */}
              <div>
                <h3 className="text-sm-amz font-bold text-amazon-text mb-3">{t('allIssues')}</h3>
                <div className="space-y-2 mb-4">
                  {[
                    { key: 'productPolicyViolations', label: t('productPolicyViolations'), value: accountHealthData?.policy_compliance?.product_policy_violations || 0 },
                    { key: 'listingPolicyViolations', label: t('listingPolicyViolations'), value: accountHealthData?.policy_compliance?.listing_policy_violations || 0 },
                    { key: 'intellectualPropertyViolations', label: t('intellectualPropertyViolations'), value: accountHealthData?.policy_compliance?.intellectual_property_violations || 0 },
                    { key: 'customerProductReviews', label: t('customerProductReviews'), value: accountHealthData?.policy_compliance?.customer_product_reviews || 0 },
                    { key: 'otherPolicyViolations', label: t('otherPolicyViolations'), value: accountHealthData?.policy_compliance?.other_policy_violations || 0 }
                  ].map((issue, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <p className="text-sm-amz text-amazon-secondaryText">{issue.label}</p>
                      <p className="text-sm-amz font-bold text-amazon-text">{issue.value}</p>
                    </div>
                  ))}
                </div>
                
                {/* View All Link */}
                <a href="#" className="text-amazon-link font-bold hover:underline text-sm-amz">
                  {t('viewAll')}({totalPolicyViolations})
                </a>
              </div>
            </div>
          </Card>
        </div>
        
        {/* Right Card: Shipping Performance */}
        <div className="col-span-12 lg:col-span-4">
          <Card 
            title={t('shippingPerformance')} 
            className="h-full" 
            headerAction={
              <div className="flex items-center gap-1 text-amazon-link font-bold text-sm-amz cursor-pointer hover:underline">
                {t('sellerFulfilled')} <ChevronDown size={14} />
              </div>
            }
          >
            <div className="space-y-4">
              {/* Metrics List */}
              {[
                { 
                  name: t('lateShipmentRate'), 
                  value: `${accountHealthData?.shipping_performance?.late_shipment_rate || 0}%`, 
                  target: t('under4Percent'), 
                  period: t('thirtyDays') 
                },
                { 
                  name: t('preFulfillmentCancelRate'), 
                  value: `${accountHealthData?.shipping_performance?.pre_fulfillment_cancel_rate || 0}%`, 
                  target: t('under2Point5Percent'), 
                  period: t('sevenDays') 
                },
                { 
                  name: t('validTrackingRate'), 
                  value: `${accountHealthData?.shipping_performance?.valid_tracking_rate || 99}%`, 
                  target: t('over95Percent'), 
                  period: t('thirtyDays') 
                },
                { 
                  name: t('onTimeDeliveryRate'), 
                  value: accountHealthData?.shipping_performance?.on_time_delivery_rate ? `${accountHealthData.shipping_performance.on_time_delivery_rate}%` : 'N/A', 
                  target: t('over90Percent'), 
                  period: '' 
                }
              ].map((metric, index) => (
                <div key={index} className="flex justify-between items-center">
                  <div>
                    <p className="text-sm-amz font-medium text-amazon-text">{metric.name}</p>
                    {metric.period && (
                      <p className="text-[10px] text-amazon-secondaryText">{t('target')}: {metric.target}, {metric.period}</p>
                    )}
                    {!metric.period && (
                      <p className="text-[10px] text-amazon-secondaryText">{t('target')}: {metric.target}</p>
                    )}
                  </div>
                  <p className="text-sm-amz font-bold text-amazon-text">{metric.value}</p>
                </div>
              ))}
              
              {/* Bottom Links */}
              <div className="pt-4 border-t border-gray-200 space-y-2">
                <a href="#" className="text-amazon-link font-bold hover:underline text-sm-amz block">
                  {t('viewDetails')}
                </a>
                <a href="#" className="text-amazon-link font-bold hover:underline text-sm-amz block">
                  {t('viewShippingEligibilities')}
                </a>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AccountHealth;
