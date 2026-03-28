import React, { useEffect, useState } from 'react';
import { useStore } from '../store';
import { Card, Button } from '../components/UI';
import { FileText, CheckCircle2, ShieldCheck, HelpCircle, Loader2 } from 'lucide-react';
import { getTaxInfo, updateTaxInfo, type TaxInfoData, type VatRegistration } from '../services/taxInfoApi';

const TaxInfo: React.FC = () => {
  const { session, currentStore } = useStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [taxInfo, setTaxInfo] = useState<TaxInfoData | null>(null);
  const [vatRegistrations, setVatRegistrations] = useState<VatRegistration[]>([]);

  // 使用 currentStore.id 或 selectedStoreId 获取 storeId
  const storeId = currentStore?.id || session.selectedStoreId || 'store-us-main';

  useEffect(() => {
    console.log('[TaxInfo] session:', session);
    console.log('[TaxInfo] currentStore:', currentStore);
    console.log('[TaxInfo] storeId:', storeId);
    
    if (!storeId) {
      setError('No store selected');
      setLoading(false);
      return;
    }

    const fetchTaxInfo = async () => {
      try {
        console.log('[TaxInfo] Fetching tax info for storeId:', storeId);
        setLoading(true);
        setError(null);
        const data = await getTaxInfo(storeId);
        console.log('[TaxInfo] Tax info data:', data);
        setTaxInfo(data.taxInfo);
        setVatRegistrations(data.vatRegistrations);
      } catch (err) {
        console.error('[TaxInfo] Failed to fetch tax info:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch tax info');
      } finally {
        setLoading(false);
      }
    };

    fetchTaxInfo();
  }, [storeId]);

  // 获取 TIN 显示格式（隐藏部分数字）
  const getMaskedTin = (tin?: string): string => {
    if (!tin) return '********';
    if (tin.length <= 4) return '********';
    return '********' + tin.slice(-4);
  };

  // 获取税务状态
  const getTaxStatus = (): 'Verified' | 'Pending' | 'Unverified' => {
    if (taxInfo?.tax_information_complete && taxInfo.tax_interview_completed) {
      return 'Verified';
    }
    if (taxInfo?.tax_interview_completed) {
      return 'Pending';
    }
    return 'Unverified';
  };

  if (loading) {
    return (
      <div className="max-w-4xl animate-in fade-in duration-300">
        <h1 className="text-[22px] font-bold text-[#0F1111] mb-6 uppercase tracking-tight">Tax Information</h1>
        <div className="flex items-center justify-center py-12">
          <Loader2 size={32} className="animate-spin text-amazon-link" />
          <span className="ml-3 text-[#565959]">Loading tax information...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl animate-in fade-in duration-300">
        <h1 className="text-[22px] font-bold text-[#0F1111] mb-6 uppercase tracking-tight">Tax Information</h1>
        <div className="bg-red-50 border border-red-200 rounded-[4px] p-4">
          <p className="text-red-700 font-medium">Error loading tax information</p>
          <p className="text-red-600 text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  const status = getTaxStatus();

  return (
    <div className="max-w-4xl animate-in fade-in duration-300">
      <h1 className="text-[22px] font-bold text-[#0F1111] mb-6 uppercase tracking-tight">Tax Information</h1>

      <div className="space-y-6">
        <Card title="Tax Identity" headerAction={<button className="text-[13px] text-amazon-link font-bold hover:underline">Update Tax Information</button>}>
           <div className="p-2 space-y-4">
              {taxInfo?.tax_interview_completed ? (
                <div className="flex items-center gap-3 bg-[#F7FFF7] border border-[#007600]/20 p-4 rounded-[4px]">
                  <CheckCircle2 size={20} className="text-[#007600]" />
                  <span className="text-[14px] font-bold text-[#007600]">Tax Interview Completed Successfully</span>
                </div>
              ) : (
                <div className="flex items-center gap-3 bg-[#FFFBEA] border border-[#B78900]/20 p-4 rounded-[4px]">
                  <HelpCircle size={20} className="text-[#B78900]" />
                  <span className="text-[14px] font-bold text-[#B78900]">Tax Interview Required</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-y-4 pt-2">
                 <div className="text-[13px]">
                    <div className="text-[#565959] font-bold uppercase text-[10px] tracking-widest mb-1">Legal Name</div>
                    <div className="font-bold text-[#0F1111]">
                      {taxInfo?.legal_business_name || 'Not provided'}
                    </div>
                 </div>
                 <div className="text-[13px]">
                    <div className="text-[#565959] font-bold uppercase text-[10px] tracking-widest mb-1">Tax Classification</div>
                    <div className="font-bold text-[#0F1111]">
                      {taxInfo?.rfc_id ? 'LLC' : 'Corporation'}
                    </div>
                 </div>
                 <div className="text-[13px]">
                    <div className="text-[#565959] font-bold uppercase text-[10px] tracking-widest mb-1">TIN (Tax Identification Number)</div>
                    <div className="font-bold text-[#0F1111]">
                      {getMaskedTin(taxInfo?.vat_registration_number)}
                    </div>
                 </div>
                 <div className="text-[13px]">
                    <div className="text-[#565959] font-bold uppercase text-[10px] tracking-widest mb-1">Status</div>
                    <div className={`font-black uppercase tracking-tighter ${
                      status === 'Verified' ? 'text-[#007600]' : 
                      status === 'Pending' ? 'text-[#B78900]' : 'text-[#CC0000]'
                    }`}>
                      {status}
                    </div>
                 </div>
              </div>
           </div>
        </Card>

        <Card title="VAT/GST Registration" headerAction={<HelpCircle size={16} className="text-[#565959]" />}>
           <div className="p-1">
              <p className="text-[13px] text-[#565959] mb-4">
                 Manage your Value Added Tax (VAT) or Goods and Services Tax (GST) registrations for multiple regions.
              </p>

              {vatRegistrations.length > 0 ? (
                <>
                  <div className="border border-[#D5D9D9] rounded-[4px] overflow-hidden">
                    <table className="w-full text-[13px]">
                      <thead className="bg-[#F0F2F2] border-b border-[#D5D9D9]">
                        <tr className="text-[11px] font-bold text-[#565959] uppercase">
                          <th className="py-2 px-4 text-left">Country/Region</th>
                          <th className="py-2 px-4 text-left">Registration Number</th>
                          <th className="py-2 px-4 text-left">Status</th>
                          <th className="py-2 px-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#D5D9D9]">
                        {vatRegistrations.map((vat) => (
                          <tr key={vat.id} className="hover:bg-[#F0F2F2]">
                            <td className="py-3 px-4 font-bold">{vat.country}</td>
                            <td className="py-3 px-4 text-[#565959]">{vat.registration_number}</td>
                            <td className="py-3 px-4">
                              {vat.verified ? (
                                <span className="inline-flex items-center gap-1 text-[#007600] font-medium text-[11px]">
                                  <CheckCircle2 size={12} />
                                  Verified
                                </span>
                              ) : (
                                <span className="text-[#B78900] font-medium text-[11px]">Pending</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button className="text-amazon-link font-bold hover:underline">Edit</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <Button variant="white" className="mt-4 w-auto px-6 font-bold h-8 text-[12px]">
                    Add VAT/GST Number
                  </Button>
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-[#565959] mb-4">No VAT/GST registrations found</p>
                  <Button variant="white" className="w-auto px-6 font-bold h-8 text-[12px]">
                    Add VAT/GST Number
                  </Button>
                </div>
              )}
           </div>
        </Card>

        <div className="mt-8 flex items-center gap-2 text-[11px] text-[#565959] px-2">
           <ShieldCheck size={14} className="text-amazon-teal" />
           <span>Your tax information is encrypted and stored securely according to Amazon's Privacy Policy.</span>
        </div>
      </div>
    </div>
  );
};

export default TaxInfo;
