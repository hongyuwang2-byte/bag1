import React, { useState, useRef } from 'react';
import { AppData, Project, User, UserRole, PatentConfig } from '../types';
import { Plus, Trash2, Edit2, Upload, Save, Lock, X, Key, ShieldCheck } from 'lucide-react';

interface AdminPanelProps {
  currentUser: User;
  data: AppData;
  onUpdate: (newData: AppData) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ currentUser, data, onUpdate }) => {
  const [activeTab, setActiveTab] = useState<'config' | 'users'>('config');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Password Change State
  const [showPwdModal, setShowPwdModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // --- Handlers for Patent Config ---
  const handleConfigChange = (key: keyof PatentConfig, value: string) => {
    onUpdate({
      ...data,
      config: { ...data.config, [key]: value },
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleConfigChange('backgroundUrl', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // --- Handlers for Projects ---
  const handleProjectChange = (id: string, field: keyof Project, value: string | number) => {
    onUpdate({
      ...data,
      projects: data.projects.map((p) => (p.id === id ? { ...p, [field]: value } : p)),
    });
  };

  const addProject = () => {
    const newProject: Project = {
      id: Date.now().toString(),
      name: '新项目',
      cost: 100,
    };
    onUpdate({ ...data, projects: [...data.projects, newProject] });
  };

  const deleteProject = (id: string) => {
    onUpdate({ ...data, projects: data.projects.filter((p) => p.id !== id) });
  };

  // --- Handlers for Users ---
  const handleUserChange = (id: string, field: keyof User, value: string | number) => {
    onUpdate({
      ...data,
      users: data.users.map((u) => (u.id === id ? { ...u, [field]: value } : u)),
    });
  };

  const addUser = () => {
    const newUser: User = {
      id: Date.now().toString(),
      username: `user_${Math.floor(Math.random() * 1000)}`,
      password: 'password',
      companyName: '新注册企业',
      credits: 0,
      role: UserRole.USER,
    };
    onUpdate({ ...data, users: [...data.users, newUser] });
  };

  // --- Handler for Admin Password Change ---
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

    // Update current logged in admin user
    onUpdate({
        ...data,
        users: data.users.map(u => u.id === currentUser.id ? { ...u, password: newPassword } : u)
    });

    alert("管理员密码修改成功！");
    setShowPwdModal(false);
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="space-y-6">
      {/* Admin Header */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex justify-between items-center">
         <div className="flex items-center gap-4">
            <div className="p-3 bg-gray-100 rounded-lg">
               <ShieldCheck className="w-6 h-6 text-gray-700" />
            </div>
            <div>
               <h2 className="text-xl font-bold text-gray-800">系统管理控制台</h2>
               <p className="text-sm text-gray-500">管理专利信息、项目设置及注册用户</p>
            </div>
         </div>
         <button 
           onClick={() => setShowPwdModal(true)}
           className="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg border border-gray-200 transition-colors"
         >
            <Lock className="w-4 h-4" />
            <span>修改管理员密码</span>
         </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 border-b border-gray-200 pb-2">
        <button
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'config' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('config')}
        >
          系统设置 (专利与项目)
        </button>
        <button
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'users' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('users')}
        >
          用户管理 (企业与积分)
        </button>
      </div>

      {activeTab === 'config' && (
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Patent Details */}
          <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
              <Edit2 className="w-5 h-5 mr-2 text-blue-500" /> 专利信息设置
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">专利名称</label>
                <input
                  type="text"
                  value={data.config.patentName}
                  onChange={(e) => handleConfigChange('patentName', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">专利编号</label>
                <input
                  type="text"
                  value={data.config.patentNo}
                  onChange={(e) => handleConfigChange('patentNo', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">证明底纹图片</label>
                <div className="mt-2 flex items-center space-x-4">
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition"
                    >
                        <Upload className="w-4 h-4 mr-2" />
                        上传背景图
                    </button>
                    <input 
                        type="file" 
                        ref={fileInputRef}
                        className="hidden" 
                        accept="image/*"
                        onChange={handleImageUpload}
                    />
                    {data.config.backgroundUrl && (
                        <button 
                            onClick={() => handleConfigChange('backgroundUrl', '')}
                            className="text-red-500 text-sm hover:underline"
                        >
                            清除背景
                        </button>
                    )}
                </div>
                {data.config.backgroundUrl && (
                    <div className="mt-4 h-32 w-24 border rounded overflow-hidden shadow-sm">
                        <img src={data.config.backgroundUrl} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                )}
              </div>
            </div>
          </div>

          {/* Project Types */}
          <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
             <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-800 flex items-center">
                <Save className="w-5 h-5 mr-2 text-green-500" /> 项目与所需积分
                </h3>
                <button onClick={addProject} className="text-sm bg-blue-50 text-blue-600 px-3 py-1 rounded hover:bg-blue-100 flex items-center">
                    <Plus className="w-4 h-4 mr-1"/> 添加项目
                </button>
            </div>
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {data.projects.map((proj) => (
                <div key={proj.id} className="flex items-start space-x-2 p-3 bg-gray-50 rounded border border-gray-200">
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      value={proj.name}
                      onChange={(e) => handleProjectChange(proj.id, 'name', e.target.value)}
                      className="block w-full text-sm rounded border-gray-300 border p-1"
                      placeholder="项目名称"
                    />
                    <div className="flex items-center space-x-2">
                         <span className="text-xs text-gray-500">所需积分:</span>
                         <input
                            type="number"
                            value={proj.cost}
                            onChange={(e) => handleProjectChange(proj.id, 'cost', parseInt(e.target.value) || 0)}
                            className="block w-24 text-sm rounded border-gray-300 border p-1"
                        />
                    </div>
                  </div>
                  <button onClick={() => deleteProject(proj.id)} className="text-red-400 hover:text-red-600 p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
             <h3 className="font-bold text-gray-700">注册用户管理</h3>
             <button onClick={addUser} className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 flex items-center">
                 <Plus className="w-4 h-4 mr-2" /> 添加用户
             </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">用户名</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">密码</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">企业名称</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">剩余积分</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                       <input 
                         className="border-b border-transparent hover:border-gray-300 focus:border-blue-500 outline-none bg-transparent w-full"
                         value={user.username}
                         onChange={(e) => handleUserChange(user.id, 'username', e.target.value)}
                         disabled={user.role === UserRole.ADMIN} // Protect admin username
                       />
                       {user.role === UserRole.ADMIN && <span className="text-xs text-blue-500 block">管理员</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        <input 
                         type="text"
                         className="border-b border-transparent hover:border-gray-300 focus:border-blue-500 outline-none bg-transparent w-full font-mono text-sm"
                         value={user.password}
                         onChange={(e) => handleUserChange(user.id, 'password', e.target.value)}
                       />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        <input 
                         className="border-b border-transparent hover:border-gray-300 focus:border-blue-500 outline-none bg-transparent w-full"
                         value={user.companyName}
                         onChange={(e) => handleUserChange(user.id, 'companyName', e.target.value)}
                       />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        <input 
                         type="number"
                         className="border-b border-transparent hover:border-gray-300 focus:border-blue-500 outline-none bg-transparent w-24 text-right pr-2"
                         value={user.credits}
                         onChange={(e) => handleUserChange(user.id, 'credits', parseInt(e.target.value) || 0)}
                       />
                    </td>
                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.role !== UserRole.ADMIN && (
                            <button className="text-red-500 hover:text-red-700" onClick={() => onUpdate({ ...data, users: data.users.filter(u => u.id !== user.id) })}>
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Change Admin Password Modal */}
      {showPwdModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <Key className="w-5 h-5 text-gray-700" /> 修改管理员密码
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
                       className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 shadow-md"
                     >
                       确认修改
                     </button>
                  </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};