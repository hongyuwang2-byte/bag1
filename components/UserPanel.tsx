import React, { useState } from 'react';
import { AppData, Certificate, Project, User } from '../types';
import { CheckCircle, Download, ShoppingBag, CreditCard, Search, FileText, Loader2, Eye, X, Lock, Key } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { CertificatePreview } from './CertificatePreview';
import { createPortal } from 'react-dom';

interface UserPanelProps {
  user: User;
  data: AppData;
  onApply: (project: Project) => void;
  onDeductForDownload: (certId: string) => boolean;
  onUpdateUser: (updatedUser: User) => void;
}

export const UserPanel: React.FC<UserPanelProps> = ({ user, data, onApply, onDeductForDownload, onUpdateUser }) => {
  const [activeTab, setActiveTab] = useState<'apply' | 'my-certs'>('apply');
  const [previewCert, setPreviewCert] = useState<Certificate | null>(null); // For PDF generation (hidden)
  const [viewingCert, setViewingCert] = useState<Certificate | null>(null); // For UI Modal Preview
  const printRef = React.useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingCertId, setGeneratingCertId] = useState<string | null>(null);
  
  // Password Change State
  const [showPwdModal, setShowPwdModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const myCertificates = data.certificates.filter(c => c.userId === user.id);

  const handleApply = (project: Project) => {
    // Ensure numerical comparison
    const userCredits = Number(user.credits);
    const projectCost = Number(project.cost);

    if (userCredits < projectCost) {
      alert(`您的积分不足，无法申请此项目！\n\n当前积分：${userCredits}\n所需积分：${projectCost}\n\n请联系管理员充值。`);
      return;
    }

    onApply(project);
    setActiveTab('my-certs');
  };

  const handleDownload = async (cert: Certificate) => {
      if (isGenerating) return;

      const project = data.projects.find(p => p.id === cert.projectId);
      const cost = project ? Number(project.cost) : 0;
      const userCredits = Number(user.credits);

      // Pre-check for unpaid certs
      if (!cert.isPaid && userCredits < cost) {
          alert(`积分不足，无法下载！\n\n需要：${cost}\n可用：${userCredits}`);
          return;
      }

      setPreviewCert(cert);
      setGeneratingCertId(cert.id);
      setIsGenerating(true);
      
      // Wait for React to render the portal content
      setTimeout(async () => {
        if (printRef.current) {
          try {
            // 1. Generate PDF Blob
            const canvas = await html2canvas(printRef.current, {
              scale: 2, // Keep scale 2 for decent text sharpness
              useCORS: true,
              logging: false,
              backgroundColor: '#ffffff',
              allowTaint: true
            });
            
            // OPTIMIZATION: Use JPEG with 0.75 quality to significantly reduce file size (target ~2MB)
            const imgData = canvas.toDataURL('image/jpeg', 0.75);
            
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            
            pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
            
            // 2. Deduct Points (After generation, before save)
            // If already paid, this returns true without deducting
            const success = onDeductForDownload(cert.id);
            
            if (success) {
                // 3. Save File
                pdf.save(`授权证明_${cert.id}.pdf`);
            } else {
                console.error("Deduction failed");
            }

          } catch (e) {
            console.error("PDF 生成失败", e);
            alert("无法生成 PDF 文件，请稍后重试或联系管理员。");
          } finally {
            setIsGenerating(false);
            setGeneratingCertId(null);
            setPreviewCert(null);
          }
        } else {
             setIsGenerating(false);
             setGeneratingCertId(null);
             setPreviewCert(null);
             alert("生成环境初始化失败，请重试。");
        }
      }, 1500); // Increased timeout slightly to ensure rendering
  };
  
  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
        alert("请输入新密码");
        return;
    }
    if (newPassword !== confirmPassword) {
        alert("两次输入的密码不一致");
        return;
    }
    
    // Update user
    onUpdateUser({
        ...user,
        password: newPassword
    });
    
    alert("密码修改成功！");
    setShowPwdModal(false);
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="space-y-6">
       {/* Info Bar */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-6 text-white shadow-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
           <div className="flex items-center gap-3">
              <h2 className="text-xl sm:text-2xl font-bold">{user.companyName}</h2>
              <button 
                onClick={() => setShowPwdModal(true)}
                className="bg-white/20 hover:bg-white/30 p-1.5 rounded-lg transition-colors text-white"
                title="修改登录密码"
              >
                <Lock className="w-4 h-4" />
              </button>
           </div>
           <p className="text-blue-100 opacity-80 text-sm">用户名: {user.username}</p>
        </div>
        <div className="text-left sm:text-right w-full sm:w-auto bg-white/10 sm:bg-transparent p-3 sm:p-0 rounded-lg">
           <p className="text-xs uppercase tracking-wider opacity-70 mb-1">可用积分</p>
           <div className="text-3xl sm:text-4xl font-bold flex items-center sm:justify-end gap-2">
             <CreditCard className="w-6 h-6 sm:w-8 sm:h-8" />
             {user.credits}
           </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 border-b border-gray-200 pb-2 overflow-x-auto">
        <button
          className={`px-4 py-2 font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'apply' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('apply')}
        >
          <ShoppingBag className="w-4 h-4"/> 可申请项目
        </button>
        <button
          className={`px-4 py-2 font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'my-certs' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('my-certs')}
        >
          <CheckCircle className="w-4 h-4"/> 我的授权证明
        </button>
      </div>

      {/* Content */}
      {activeTab === 'apply' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.projects.map(project => {
             const alreadyOwned = myCertificates.some(c => c.projectId === project.id);
             const canAfford = user.credits >= project.cost;
             
             return (
              <div key={project.id} className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-xl transition-shadow flex flex-col">
                <div className="p-6 flex-grow">
                   <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4">
                     <FileText className="w-6 h-6" />
                   </div>
                   <h3 className="text-xl font-bold text-gray-800 mb-2">{project.name}</h3>
                   <p className="text-gray-500 text-sm">
                      申请 <strong>{data.config.patentName}</strong> ({data.config.patentNo}) 在该项目中的使用授权。
                   </p>
                </div>
                <div className="bg-gray-50 p-4 border-t border-gray-100 flex justify-between items-center">
                   <div className="flex flex-col">
                       <span className={`font-bold text-lg ${canAfford ? 'text-gray-700' : 'text-red-500'}`}>
                           {project.cost} 积分
                       </span>
                       {!canAfford && <span className="text-xs text-red-400">积分不足</span>}
                   </div>
                   <button 
                     type="button"
                     disabled={alreadyOwned}
                     onClick={(e) => {
                         e.preventDefault();
                         if (!alreadyOwned) handleApply(project);
                     }}
                     className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                       alreadyOwned 
                         ? 'bg-green-100 text-green-700 cursor-default border border-green-200'
                         : canAfford
                            ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg' 
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200 border border-gray-200' 
                     }`}
                   >
                     {alreadyOwned ? '已申请' : '立即申请'}
                   </button>
                </div>
              </div>
             )
          })}
          {data.projects.length === 0 && (
             <div className="col-span-full text-center py-10 text-gray-500">
                暂无可申请的项目。
             </div>
          )}
        </div>
      )}

      {activeTab === 'my-certs' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
           {myCertificates.length === 0 ? (
             <div className="p-10 text-center text-gray-400">
               <Search className="w-12 h-12 mx-auto mb-4 opacity-50"/>
               <p>暂无授权证明。请前往“可申请项目”进行申请。</p>
             </div>
           ) : (
            <div className="overflow-x-auto">
             <table className="min-w-full divide-y divide-gray-200">
               <thead className="bg-gray-50">
                 <tr>
                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">证书编号</th>
                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">项目名称</th>
                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">授权时间</th>
                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                   <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-200">
                 {myCertificates.map(cert => {
                   const isPaid = cert.isPaid;
                   const isCurrentCertGenerating = isGenerating && generatingCertId === cert.id;
                   
                   return (
                   <tr key={cert.id} className="hover:bg-gray-50">
                     <td className="px-6 py-4 whitespace-nowrap font-mono text-sm text-gray-600">{cert.id}</td>
                     <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{cert.projectName}</td>
                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(cert.issueDate).toLocaleString('zh-CN')}
                     </td>
                     <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {isPaid ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              已支付
                            </span>
                        ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              未支付
                            </span>
                        )}
                     </td>
                     <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                       <div className="flex justify-end gap-3">
                           <button
                             type="button"
                             onClick={() => setViewingCert(cert)}
                             className="text-gray-500 hover:text-blue-600 transition-colors flex items-center gap-1"
                             title="预览证书"
                           >
                             <Eye className="w-4 h-4" /> 预览
                           </button>
                           
                           <button 
                             type="button"
                             onClick={() => handleDownload(cert)}
                             disabled={isGenerating}
                             className={`flex items-center justify-end gap-1 transition-colors ${
                                 isGenerating 
                                 ? 'opacity-50 cursor-not-allowed' 
                                 : 'cursor-pointer text-blue-600 hover:text-blue-900'
                             }`}
                           >
                             {isCurrentCertGenerating ? (
                               <>
                                 <Loader2 className="w-4 h-4 animate-spin" /> 生成中...
                               </>
                             ) : (
                               <>
                                 <Download className="w-4 h-4" /> 
                                 {isPaid ? '下载 PDF' : '支付并下载'}
                               </>
                             )}
                           </button>
                       </div>
                     </td>
                   </tr>
                 )})}
               </tbody>
             </table>
             </div>
           )}
        </div>
      )}

      {/* UI Modal for Preview */}
      {viewingCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl max-h-[90vh] w-full flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" /> 证书预览
              </h3>
              <button 
                onClick={() => setViewingCert(null)}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-200 p-2 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-auto p-4 sm:p-8 bg-gray-100 flex justify-center">
              {/* Reduced scale for Mobile (0.4) -> Tablet (0.6) -> Desktop (0.8) */}
              <div className="transform origin-top scale-[0.4] sm:scale-[0.6] md:scale-[0.7] lg:scale-[0.8]" style={{ marginBottom: '-40%' }}> 
                 <div style={{ transformOrigin: 'top center' }}>
                    <CertificatePreview 
                      certificate={viewingCert} 
                      config={data.config} 
                      isPreview={true}
                    />
                 </div>
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 bg-white flex justify-end gap-3">
               <button 
                 onClick={() => setViewingCert(null)}
                 className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
               >
                 关闭
               </button>
               <button
                    onClick={() => handleDownload(viewingCert)}
                    disabled={isGenerating}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isGenerating && generatingCertId === viewingCert.id ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            生成中...
                        </>
                    ) : (
                        <>
                            <Download className="w-4 h-4" />
                            {viewingCert.isPaid ? '下载 PDF' : '支付并下载'}
                        </>
                    )}
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPwdModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <Key className="w-5 h-5 text-blue-600" /> 修改登录密码
                 </h3>
                 <button onClick={() => setShowPwdModal(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-5 h-5" />
                 </button>
              </div>
              <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">新密码</label>
                    <input 
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="请输入新密码"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">确认新密码</label>
                    <input 
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="请再次输入新密码"
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                     <button
                       type="button"
                       onClick={() => setShowPwdModal(false)}
                       className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                     >
                       取消
                     </button>
                     <button
                       type="submit"
                       className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md"
                     >
                       确认修改
                     </button>
                  </div>
              </form>
           </div>
        </div>
      )}

      {/* Hidden Render Area for PDF Generation */}
      {previewCert && createPortal(
        <div style={{ position: 'fixed', top: 0, left: '-9999px' }}>
          <CertificatePreview 
            ref={printRef}
            certificate={previewCert}
            config={data.config}
            isPreview={false}
          />
        </div>,
        document.body
      )}
    </div>
  );
};