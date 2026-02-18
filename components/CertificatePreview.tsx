import React, { forwardRef } from 'react';
import { Certificate, PatentConfig } from '../types';

interface CertificatePreviewProps {
  certificate: Certificate;
  config: PatentConfig;
  isPreview?: boolean; // Controls the "Non-Official" watermark
}

export const CertificatePreview = forwardRef<HTMLDivElement, CertificatePreviewProps>(
  ({ certificate, config, isPreview = false }, ref) => {
    
    // Formatting date to Chinese format: YYYY年M月D日 (No time)
    const dateObj = new Date(certificate.issueDate);
    const formattedDate = dateObj.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return (
      <div
        ref={ref}
        className="relative bg-white text-gray-900 shadow-2xl mx-auto overflow-hidden"
        style={{
          width: '794px', // A4 width at 96 DPI
          height: '1123px', // A4 height at 96 DPI
          minWidth: '794px',
          minHeight: '1123px',
        }}
      >
        {/* User Uploaded Background Image - Bottom Center, Fill Width, Maintain Aspect Ratio */}
        {config.backgroundUrl && (
          <img 
            src={config.backgroundUrl} 
            alt=""
            className="absolute bottom-0 left-0 z-0 pointer-events-none select-none"
            style={{
              width: '100%',    // Fill page width
              height: 'auto',   // Maintain aspect ratio
              display: 'block',
              margin: 0,        // No margin
              padding: 0
            }}
          />
        )}

        {/* Default Background Pattern if no image provided */}
        {!config.backgroundUrl && (
          <div className="absolute inset-0 pointer-events-none z-0">
             <div className="absolute inset-0 border-[20px] border-double border-amber-50"></div>
             <div className="absolute inset-0 flex items-center justify-center opacity-5">
                <div className="w-[500px] h-[500px] rounded-full border-[20px] border-gray-900"></div>
             </div>
          </div>
        )}

        {/* Watermark for Preview Mode */}
        {isPreview && (
          <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none overflow-hidden">
             <div className="transform -rotate-45 border-8 border-gray-300 text-gray-300 text-8xl font-black p-8 rounded-3xl opacity-40 whitespace-nowrap select-none">
                非正式文件
             </div>
          </div>
        )}

        <div className="relative z-10 p-16 h-full flex flex-col">
          
          {/* Top Left ID */}
          <div className="absolute top-12 left-12 text-sm font-mono text-gray-600 tracking-wider">
            证书编号：{certificate.id}
          </div>

          {/* Header (No underline) */}
          <div className="text-center mt-32 mb-20">
            <h1 className="text-6xl font-serif font-bold tracking-widest text-gray-900">
              授权证明
            </h1>
          </div>

          {/* Body Content - Line by Line */}
          <div className="flex-grow px-12 space-y-12 text-lg">
            
            <div className="flex items-baseline border-b border-gray-200 pb-3">
              <span className="w-32 font-bold text-gray-500 text-xl text-justify shrink-0">专利名称：</span>
              <span className="flex-grow text-2xl font-serif font-bold text-gray-900">
                {certificate.patentName}
              </span>
            </div>

            <div className="flex items-baseline border-b border-gray-200 pb-3">
              <span className="w-32 font-bold text-gray-500 text-xl text-justify shrink-0">专利号：</span>
              <span className="flex-grow text-2xl font-mono text-gray-900">
                {certificate.patentNo}
              </span>
            </div>

            <div className="flex items-baseline border-b border-gray-200 pb-3">
              <span className="w-32 font-bold text-gray-500 text-xl text-justify shrink-0">申请企业：</span>
              <span className="flex-grow text-2xl font-serif text-gray-900">
                {certificate.applicantName}
              </span>
            </div>

            <div className="flex items-baseline border-b border-gray-200 pb-3">
              <span className="w-32 font-bold text-gray-500 text-xl text-justify shrink-0">应用项目：</span>
              <span className="flex-grow text-2xl font-serif text-gray-900">
                {certificate.projectName}
              </span>
            </div>

             <div className="flex items-baseline border-b border-gray-200 pb-3">
              <span className="w-32 font-bold text-gray-500 text-xl text-justify shrink-0">申请结果：</span>
              <span className="flex-grow text-2xl font-bold text-green-700">
                 同意授权
              </span>
            </div>

             <div className="flex items-baseline border-b border-gray-200 pb-3">
              <span className="w-32 font-bold text-gray-500 text-xl text-justify shrink-0">授权日期：</span>
              <span className="flex-grow text-2xl text-gray-900">
                {formattedDate}
              </span>
            </div>
          </div>

          {/* Footer removed as requested */}
          <div className="mb-16"></div> 

        </div>
      </div>
    );
  }
);

CertificatePreview.displayName = 'CertificatePreview';