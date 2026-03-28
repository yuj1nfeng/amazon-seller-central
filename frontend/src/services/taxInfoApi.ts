// Tax Info API service
import { API_CONFIG, apiGet, apiPut } from '../config/api';

// 税务信息数据类型
export interface TaxInfoData {
  id?: string;
  store_id: string;
  legal_business_name?: string;
  place_of_establishment?: string;
  vat_registration_number?: string;
  rfc_id?: string;
  tax_interview_completed?: boolean;
  tax_information_complete?: boolean;
  created_at?: string;
  updated_at?: string;
}

// VAT/GST 注册数据
export interface VatRegistration {
  id?: string;
  store_id: string;
  country: string;
  registration_number: string;
  status?: 'Active' | 'Pending' | 'Expired';
  verified?: boolean;
  created_at?: string;
  updated_at?: string;
}

// API 响应数据类型
export interface TaxInfoResponse {
  taxInfo: TaxInfoData;
  vatRegistrations: VatRegistration[];
}

// 获取税务信息
export const getTaxInfo = async (storeId: string): Promise<TaxInfoResponse> => {
  const response = await apiGet(API_CONFIG.ENDPOINTS.TAX_INFO.GET(storeId));

  if (!response.success) {
    throw new Error(response.message || '获取税务信息失败');
  }

  // 后端返回的数据格式：{ success: true, data: taxInfo }
  const taxInfo = response.data;

  // 生成 VAT 注册数据
  let vatRegistrations: VatRegistration[] = [];

  // 从税务信息中提取 VAT 号码（如果存在）
  if (taxInfo.vat_registration_number) {
    // 解析多个 VAT 号码（假设格式为 "GB 123 4567 89; DE 987 6543 21"）
    const vatNumbers = taxInfo.vat_registration_number.split(';').map((v: string) => v.trim());
    vatRegistrations = vatNumbers
      .filter((v: string) => v)
      .map((vatNum: string, index: number) => {
        const countryMatch = vatNum.match(/^([A-Z]{2})/);
        const country = countryMatch ? countryMatch[1] : 'Unknown';
        return {
          id: `vat-${index}`,
          store_id: storeId,
          country: getCountryName(country),
          registration_number: vatNum,
          status: 'Active' as const,
          verified: true,
        };
      });
  }

  // 如果没有 VAT 数据，返回空数组（不再使用默认示例数据）
  return {
    taxInfo,
    vatRegistrations,
  };
};

// 更新税务信息
export const updateTaxInfo = async (
  storeId: string, 
  data: Partial<TaxInfoData>
): Promise<TaxInfoData> => {
  const response = await apiPut(
    API_CONFIG.ENDPOINTS.TAX_INFO.UPDATE(storeId), 
    data
  );

  if (!response.success) {
    throw new Error(response.message || '更新税务信息失败');
  }

  return response.data;
};

// 辅助函数：将国家代码转换为国家名称
const getCountryName = (code: string): string => {
  const countryMap: Record<string, string> = {
    'GB': 'United Kingdom',
    'UK': 'United Kingdom',
    'DE': 'Germany',
    'FR': 'France',
    'IT': 'Italy',
    'ES': 'Spain',
    'US': 'United States',
    'JP': 'Japan',
    'CN': 'China',
    'AU': 'Australia',
    'CA': 'Canada',
    'MX': 'Mexico',
    'IN': 'India',
    'BR': 'Brazil',
  };
  return countryMap[code] || code;
};
