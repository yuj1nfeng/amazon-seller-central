import React from 'react';
import { Card } from '../components/UI';
import { Info, Globe, CheckCircle2 } from 'lucide-react';

const StoreInfo: React.FC = () => {
  return (
    <div className="max-w-4xl animate-in fade-in duration-300">
      <h1 className="text-[22px] font-bold text-[#0F1111] mb-6 uppercase tracking-tight">Store Info</h1>

      <div className="space-y-6">
        {/* Store Information Card */}
        <Card title="Store Information" headerAction={<button className="text-[13px] text-amazon-link font-bold hover:underline">Edit Store Info</button>}>
          <div className="p-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="font-bold text-[14px] mb-2">Store Name</div>
                <div className="text-[13px] text-[#565959]">ENSHZHIXUN</div>
              </div>
              <div>
                <div className="font-bold text-[14px] mb-2">Seller ID</div>
                <div className="text-[13px] text-[#565959]">A123456789BCDEF</div>
              </div>
              <div>
                <div className="font-bold text-[14px] mb-2">Marketplace</div>
                <div className="flex items-center gap-2 text-[13px] text-[#565959]">
                  <Globe size={16} />
                  <span>United States (Amazon.com)</span>
                </div>
              </div>
              <div>
                <div className="font-bold text-[14px] mb-2">Store Status</div>
                <div className="flex items-center gap-2 text-[13px] text-[#007600]">
                  <CheckCircle2 size={16} />
                  <span>Active</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Store URL Card */}
        <Card title="Store URL" headerAction={<button className="text-[13px] text-amazon-link font-bold hover:underline">Manage Store URL</button>}>
          <div className="p-1">
            <div className="flex items-center gap-3">
              <span className="text-[13px] text-[#565959]">https://www.amazon.com/shops/</span>
              <span className="font-bold text-[13px]">enshzhixun</span>
            </div>
            <div className="mt-4 text-[13px] text-[#565959]">
              Your store URL is automatically generated based on your store name. You can customize your store URL if it's available.
            </div>
          </div>
        </Card>

        {/* Store Design Card */}
        <Card title="Store Design" headerAction={<button className="text-[13px] text-amazon-link font-bold hover:underline">Design Your Store</button>}>
          <div className="p-1">
            <div className="flex items-start gap-4">
              <div className="w-32 h-32 bg-[#F0F2F2] rounded-[4px] flex items-center justify-center">
                <Globe size={32} className="text-[#565959]" />
              </div>
              <div className="flex-1">
                <div className="font-bold text-[14px] mb-1">Current Store Design</div>
                <div className="text-[13px] text-[#565959] mb-3">Basic Amazon Store Design</div>
                <div className="text-[13px] text-[#565959] leading-relaxed">
                  Customize your store design to showcase your brand and products. Add a logo, cover image, and organize your products into categories.
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default StoreInfo;
