
import React from 'react';
import { Card, Button } from '../components/UI';
import { FileText, CheckCircle2, ShieldCheck, HelpCircle } from 'lucide-react';

const TaxInfo: React.FC = () => {
  return (
    <div className="max-w-4xl animate-in fade-in duration-300">
      <h1 className="text-[22px] font-bold text-[#0F1111] mb-6 uppercase tracking-tight">Tax Information</h1>

      <div className="space-y-6">
        <Card title="Tax Identity" headerAction={<button className="text-[13px] text-amazon-link font-bold hover:underline">Update Tax Information</button>}>
           <div className="p-2 space-y-4">
              <div className="flex items-center gap-3 bg-[#F7FFF7] border border-[#007600]/20 p-4 rounded-[4px]">
                 <CheckCircle2 size={20} className="text-[#007600]" />
                 <span className="text-[14px] font-bold text-[#007600]">Tax Interview Completed Successfully</span>
              </div>

              <div className="grid grid-cols-2 gap-y-4 pt-2">
                 <div className="text-[13px]">
                    <div className="text-[#565959] font-bold uppercase text-[10px] tracking-widest mb-1">Legal Name</div>
                    <div className="font-bold text-[#0F1111]">EnShZhiXun Technology Co., Ltd.</div>
                 </div>
                 <div className="text-[13px]">
                    <div className="text-[#565959] font-bold uppercase text-[10px] tracking-widest mb-1">Tax Classification</div>
                    <div className="font-bold text-[#0F1111]">Corporation</div>
                 </div>
                 <div className="text-[13px]">
                    <div className="text-[#565959] font-bold uppercase text-[10px] tracking-widest mb-1">TIN (Tax Identification Number)</div>
                    <div className="font-bold text-[#0F1111]">********4117</div>
                 </div>
                 <div className="text-[13px]">
                    <div className="text-[#565959] font-bold uppercase text-[10px] tracking-widest mb-1">Status</div>
                    <div className="font-black text-[#007600] uppercase tracking-tighter">Verified</div>
                 </div>
              </div>
           </div>
        </Card>

        <Card title="VAT/GST Registration" headerAction={<HelpCircle size={16} className="text-[#565959]" />}>
           <div className="p-1">
              <p className="text-[13px] text-[#565959] mb-4">
                 Manage your Value Added Tax (VAT) or Goods and Services Tax (GST) registrations for multiple regions.
              </p>
              
              <div className="border border-[#D5D9D9] rounded-[4px] overflow-hidden">
                <table className="w-full text-[13px]">
                   <thead className="bg-[#F0F2F2] border-b border-[#D5D9D9]">
                      <tr className="text-[11px] font-bold text-[#565959] uppercase">
                         <th className="py-2 px-4 text-left">Country/Region</th>
                         <th className="py-2 px-4 text-left">Registration Number</th>
                         <th className="py-2 px-4 text-right">Action</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-[#D5D9D9]">
                      <tr className="hover:bg-[#F0F2F2]">
                         <td className="py-3 px-4 font-bold">United Kingdom</td>
                         <td className="py-3 px-4 text-[#565959]">GB 123 4567 89</td>
                         <td className="py-3 px-4 text-right">
                            <button className="text-amazon-link font-bold hover:underline">Edit</button>
                         </td>
                      </tr>
                      <tr className="hover:bg-[#F0F2F2]">
                         <td className="py-3 px-4 font-bold">Germany</td>
                         <td className="py-3 px-4 text-[#565959]">DE 987 6543 21</td>
                         <td className="py-3 px-4 text-right">
                            <button className="text-amazon-link font-bold hover:underline">Edit</button>
                         </td>
                      </tr>
                   </tbody>
                </table>
              </div>
              <Button variant="white" className="mt-4 w-auto px-6 font-bold h-8 text-[12px]">Add VAT/GST Number</Button>
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
