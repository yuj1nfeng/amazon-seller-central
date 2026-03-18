
import React from 'react';
import { Card, Button } from '../components/UI';
import { CheckCircle2, ArrowLeft } from 'lucide-react';

const LegalEntity: React.FC = () => {
  return (
    <div className="max-w-3xl animate-in fade-in duration-300 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="text-[13px] text-[#565959] mb-2">Account Info</div>
          <h1 className="text-[22px] font-bold text-[#0F1111]">Legal Entity</h1>
        </div>
        <Button variant="yellow" className="w-auto px-6">
          Edit
        </Button>
      </div>

      {/* Tax Status Callout Card */}
      <div className="bg-white border-2 border-[#007600] rounded-[8px] p-6 flex gap-6 overflow-hidden relative">
        {/* Green Vertical Accent */}
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#007600]"></div>
        
        <div className="flex items-start gap-4">
          <div className="mt-1">
            <div className="w-10 h-10 bg-[#F7FFF7] rounded-full flex items-center justify-center border border-[#007600]/20">
              <CheckCircle2 className="text-[#007600]" size={20} />
            </div>
          </div>
          
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-[16px] font-bold text-[#007600] mb-1">Tax information is complete</h2>
                <p className="text-[13px] text-[#565959] mb-4">
                  Your tax information has been validated successfully.
                </p>
              </div>
              <a href="#" className="text-[13px] font-medium text-[#007185] hover:text-[#C45500]">
                Tax interview help guide
              </a>
            </div>
            
            <Button variant="yellow" className="w-auto px-8">
              Update Tax Information
            </Button>
          </div>
        </div>
      </div>

      {/* Instruction Paragraph */}
      <div className="bg-white p-6 rounded-[8px] border border-[#D5D9D9]">
        <p className="text-[13px] text-[#0F1111] leading-relaxed">
          To update your legal entity name or address, please retake the tax interview by clicking the "Update Tax Information" button above.
          This will ensure your information is properly verified and compliant with Amazon's requirements.
        </p>
      </div>

      {/* Read-only Info Blocks */}
      <div className="space-y-4">
        {/* Legal Business Name Block */}
        <div className="bg-[#F7FAFA] p-6 rounded-[8px] border border-[#D5D9D9]">
          <div className="text-[13px] font-medium text-[#565959] mb-2">Legal business name</div>
          <div className="text-[16px] font-bold text-[#0F1111]">EnShZhiXun Technology Co., Ltd.</div>
        </div>

        {/* Place of Establishment Address Block */}
        <div className="bg-[#F7FAFA] p-6 rounded-[8px] border border-[#D5D9D9]">
          <div className="text-[13px] font-medium text-[#565959] mb-2">Place of establishment address</div>
          <div className="text-[16px] font-bold text-[#0F1111] leading-relaxed">
            Shiyan Street, Industrial Park Area 3<br />
            Building 8, Suite 304<br />
            Guangdong Province, 518000<br />
            China
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="pt-4 pb-8">
        <Button 
          variant="white" 
          className="w-auto px-6 flex items-center gap-2"
          onClick={() => window.history.back()}
        >
          <ArrowLeft size={16} />
          Back
        </Button>
      </div>
    </div>
  );
};

export default LegalEntity;
