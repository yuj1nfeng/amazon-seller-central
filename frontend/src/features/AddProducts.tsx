
import React, { useState } from 'react';
import { Search, Plus, Upload, HelpCircle, ChevronRight, Info, PackageSearch, Store, LayoutGrid, FileText } from 'lucide-react';
import { Card, Button } from '../components/UI';
import { useI18n } from '../hooks/useI18n';
import { cn } from '../utils/cn';

const AddProducts: React.FC = () => {
  const { t } = useI18n();
  const [isSearching, setIsSearching] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchValue.trim()) return;
    setIsSearching(true);
    setTimeout(() => setIsSearching(false), 1500);
  };

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
      <div className="flex items-center justify-between mb-8 px-1">
        <h1 className="text-2xl font-black text-amazon-text uppercase tracking-tighter">{t('addProductsToInventory')}</h1>
        <button className="flex items-center gap-1.5 text-xs-amz text-amazon-link font-black hover:underline uppercase tracking-widest">
          <HelpCircle size={16} /> {t('helpDocumentation')}
        </button>
      </div>

      <Card className="mb-10 shadow-xl border-amazon-border relative overflow-hidden group">
        <div className="relative z-10">
          <h2 className="text-xl font-black mb-2 text-amazon-text tracking-tight uppercase">{t('searchAmazonGlobalCatalog')}</h2>
          <p className="text-sm-amz text-amazon-secondaryText mb-8 max-w-3xl font-medium">
            {t('avoidDuplicateListings')}
          </p>
          
          <form onSubmit={handleSearch} className="flex gap-0 group/search max-w-4xl relative">
            <div className="relative flex-1">
              <input 
                className="w-full border-2 border-gray-300 rounded-l-sm px-5 py-3.5 text-base-amz amz-input-focus shadow-inner font-medium placeholder:text-gray-400 border-r-0 focus:border-amazon-orange transition-all"
                placeholder={t('productNameUpcEan')}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
              />
              <PackageSearch className="absolute right-4 top-4 text-gray-300" size={24} />
            </div>
            <button 
              type="submit" 
              className={cn(
                "bg-amazon-yellow border-2 border-amazon-yellowBorder rounded-r-sm px-10 font-black text-amazon-text uppercase tracking-[0.15em] shadow-md hover:bg-amazon-yellowHover active:bg-amazon-orange/10 transition-all flex items-center justify-center min-w-[160px]",
                isSearching ? "opacity-80 cursor-wait" : ""
              )}
              disabled={isSearching}
            >
              {isSearching ? <div className="w-5 h-5 border-2 border-amazon-text border-t-transparent rounded-full animate-spin"></div> : t('searchCatalog')}
            </button>
          </form>
          
          <div className="mt-6 flex items-start gap-3 text-[11px] text-amazon-secondaryText bg-gray-50/80 p-3 rounded border border-gray-200 border-dashed max-w-2xl">
            <Info size={16} className="text-amazon-teal shrink-0 mt-0.5" />
            <span className="font-medium">
              {t('importantAccurateId')}
            </span>
          </div>
        </div>
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-amazon-teal/5 rounded-full blur-3xl group-hover:bg-amazon-orange/5 transition-all"></div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <div className="flex flex-col h-full bg-white border border-amazon-border rounded-sm shadow-amz-card hover:shadow-xl transition-all group cursor-pointer border-l-[6px] border-l-amazon-teal">
           <div className="p-6 flex-1">
              <div className="w-12 h-12 bg-amazon-teal/10 rounded-sm flex items-center justify-center mb-6 text-amazon-teal group-hover:scale-110 transition-transform">
                <Store size={28} />
              </div>
              <h3 className="font-black text-base-amz mb-3 uppercase tracking-tight text-amazon-text">{t('privateLabelNewBrand')}</h3>
              <p className="text-[13px] text-amazon-secondaryText leading-relaxed font-medium">
                {t('addingProductNotOnAmazon')}
              </p>
           </div>
           <div className="px-6 py-4 bg-gray-50 border-t flex justify-between items-center group-hover:bg-blue-50 transition-colors">
              <span className="text-xs-amz font-black text-amazon-link uppercase tracking-widest">{t('createNewListing')}</span>
              <ChevronRight size={16} className="text-amazon-teal group-hover:translate-x-1 transition-transform" />
           </div>
        </div>

        <div className="flex flex-col h-full bg-white border border-amazon-border rounded-sm shadow-amz-card hover:shadow-xl transition-all group cursor-pointer border-l-[6px] border-l-blue-500">
           <div className="p-6 flex-1">
              <div className="w-12 h-12 bg-blue-50 rounded-sm flex items-center justify-center mb-6 text-blue-500 group-hover:scale-110 transition-transform">
                <LayoutGrid size={28} />
              </div>
              <h3 className="font-black text-base-amz mb-3 uppercase tracking-tight text-amazon-text">{t('bulkInventoryOperations')}</h3>
              <p className="text-[13px] text-amazon-secondaryText leading-relaxed font-medium">
                {t('uploadFileMultipleProducts')}
              </p>
           </div>
           <div className="px-6 py-4 bg-gray-50 border-t flex justify-between items-center group-hover:bg-blue-50 transition-colors">
              <span className="text-xs-amz font-black text-amazon-link uppercase tracking-widest">{t('uploadInventoryFile')}</span>
              <ChevronRight size={16} className="text-amazon-teal group-hover:translate-x-1 transition-transform" />
           </div>
        </div>

        <div className="flex flex-col h-full bg-white border border-amazon-border rounded-sm shadow-amz-card hover:shadow-xl transition-all group cursor-pointer border-l-[6px] border-l-amazon-orange">
           <div className="p-6 flex-1">
              <div className="w-12 h-12 bg-orange-50 rounded-sm flex items-center justify-center mb-6 text-amazon-orange group-hover:scale-110 transition-transform">
                <FileText size={28} />
              </div>
              <h3 className="font-black text-base-amz mb-3 uppercase tracking-tight text-amazon-text">{t('applicationCenter')}</h3>
              <p className="text-[13px] text-amazon-secondaryText leading-relaxed font-medium">
                {t('checkStatusProductApplications')}
              </p>
           </div>
           <div className="px-6 py-4 bg-gray-50 border-t flex justify-between items-center group-hover:bg-blue-50 transition-colors">
              <span className="text-xs-amz font-black text-amazon-link uppercase tracking-widest">{t('viewStatus')}</span>
              <ChevronRight size={16} className="text-amazon-teal group-hover:translate-x-1 transition-transform" />
           </div>
        </div>
      </div>

      <div className="mt-4 bg-white border border-amazon-border rounded-sm shadow-amz-card">
        <div className="px-6 py-4 border-b bg-gray-100 flex justify-between items-center">
          <span className="font-black text-xs-amz text-amazon-secondaryText uppercase tracking-[0.2em]">{t('auditTrailRecentSubmissions')}</span>
          <button className="text-[10px] font-black text-amazon-link uppercase tracking-widest hover:underline">{t('viewHistoricalData')}</button>
        </div>
        <div className="p-16 text-center">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-gray-100">
            <Upload className="text-gray-200" size={36} />
          </div>
          <h4 className="text-base-amz font-black text-gray-400 uppercase tracking-widest">{t('noActiveSubmissions')}</h4>
          <p className="text-xs text-gray-400 mt-2 font-medium max-w-sm mx-auto">{t('noSubmissionsLast30Days')}</p>
        </div>
      </div>
    </div>
  );
};

export default AddProducts;
