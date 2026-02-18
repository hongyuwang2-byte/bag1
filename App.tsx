import React, { useState, useEffect } from 'react';
import { loadData, saveData, resetData } from './services/storage';
import { AppData, User, Project, Certificate, UserRole } from './types';
import { AdminPanel } from './components/AdminPanel';
import { UserPanel } from './components/UserPanel';
import { LogOut, LayoutGrid, Award, ShieldCheck, User as UserIcon } from 'lucide-react';

// Generates ID in format: yyyyMMddHHmmssSSS + random (Ensures uniqueness)
const generateCertId = (date: Date): string => {
  const pad = (n: number) => n.toString().padStart(2, '0');
  const yyyy = date.getFullYear();
  const MM = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const HH = pad(date.getHours());
  const mm = pad(date.getMinutes());
  const ss = pad(date.getSeconds());
  const ms = date.getMilliseconds().toString().padStart(3, '0');
  const rand = Math.floor(Math.random() * 100).toString().padStart(2, '0');
  return `${yyyy}${MM}${dd}${HH}${mm}${ss}${ms}${rand}`;
};

const App: React.FC = () => {
  const [data, setData] = useState<AppData>(loadData());
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Login State
  const [loginMode, setLoginMode] = useState<'USER' | 'ADMIN'>('USER');
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');

  // Persist data whenever it changes
  useEffect(() => {
    saveData(data);
  }, [data]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = data.users.find(u => u.username === loginUser && u.password === loginPass);
    
    if (user) {
      // Role Validation
      if (loginMode === 'ADMIN' && user.role !== UserRole.ADMIN) {
        setLoginError('该账号没有管理员权限');
        return;
      }
      if (loginMode === 'USER' && user.role !== UserRole.USER) {
        setLoginError('管理员请切换至管理员登录入口');
        return;
      }

      setCurrentUser(user);
      setLoginError('');
      setLoginUser('');
      setLoginPass('');
    } else {
      setLoginError('用户名或密码错误');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setLoginMode('USER'); // Reset to user mode on logout
  };

  const handleReset = () => {
    if (window.confirm('确定要重置所有演示数据吗？\n这将清除所有申请记录和用户修改，并恢复到初始状态。')) {
      resetData(); // Clears local storage
      const initialData = loadData(); // Reloads fresh structure from storage.ts default
      setData(initialData); // Updates React State
      setCurrentUser(null); // Log out
      setLoginMode('USER');
    }
  };

  const handleDataUpdate = (newData: AppData) => {
    setData(newData);
    // If we updated the current user (e.g. admin changed their own details), update session
    if (currentUser) {
       const updatedCurrent = newData.users.find(u => u.id === currentUser.id);
       if (updatedCurrent) setCurrentUser(updatedCurrent);
    }
  };

  // Allow user to update their own profile (e.g. password)
  const handleUserUpdate = (updatedUser: User) => {
    const newUsers = data.users.map(u => u.id === updatedUser.id ? updatedUser : u);
    const newData = { ...data, users: newUsers };
    setData(newData);
    setCurrentUser(updatedUser); // Update current session immediately
  };

  const handleApply = (project: Project) => {
    if (!currentUser) return;

    // Check credits but DO NOT deduct yet (deduction happens at download)
    const userInDb = data.users.find(u => u.id === currentUser.id);
    if (!userInDb || userInDb.credits < project.cost) {
      alert("验证失败：积分不足，无法生成授权证书。");
      return;
    }

    const now = new Date();
    const certId = generateCertId(now);
    
    const newCert: Certificate = {
      id: certId,
      userId: currentUser.id,
      projectId: project.id,
      projectName: project.name,
      patentName: data.config.patentName,
      patentNo: data.config.patentNo,
      applicantName: userInDb.companyName,
      issueDate: now.toISOString(),
      isPaid: false, // Not paid yet
    };

    // Only update certificates, do not deduct credits yet
    const newData: AppData = {
      ...data,
      certificates: [...data.certificates, newCert]
    };

    handleDataUpdate(newData);
    alert(`申请成功！授权证明已生成。请前往“我的授权证明”下载（下载时将扣除 ${project.cost} 积分）。`);
  };

  const handleDeductForDownload = (certId: string): boolean => {
    // Check if ID is unique enough in the array - logging
    const matchingCerts = data.certificates.filter(c => c.id === certId);
    if (matchingCerts.length > 1) {
        console.error("Critical Error: Duplicate Certificate IDs found. Logic may be flawed.", certId);
    }

    const certIndex = data.certificates.findIndex(c => c.id === certId);
    if (certIndex === -1) return false;
    
    const cert = data.certificates[certIndex];
    if (cert.isPaid) return true; // Already paid, proceed

    const project = data.projects.find(p => p.id === cert.projectId);
    const cost = project ? project.cost : 0;
    
    const userIndex = data.users.findIndex(u => u.id === cert.userId);
    if (userIndex === -1) return false;
    const user = data.users[userIndex];

    if (user.credits < cost) {
      alert("积分不足，无法下载！");
      return false;
    }

    // Deduct and Mark Paid
    const updatedUser = { ...user, credits: user.credits - cost };
    const updatedCert = { ...cert, isPaid: true };
    
    const newUsers = [...data.users];
    newUsers[userIndex] = updatedUser;
    
    const newCerts = [...data.certificates];
    newCerts[certIndex] = updatedCert;

    handleDataUpdate({
      ...data,
      users: newUsers,
      certificates: newCerts
    });

    return true;
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
          
          {/* Login Mode Tabs */}
          <div className="flex border-b border-gray-100">
             <button 
               className={`flex-1 py-4 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${loginMode === 'USER' ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
               onClick={() => {
                 setLoginMode('USER');
                 setLoginError('');
               }}
             >
                <UserIcon className="w-4 h-4" /> 企业用户登录
             </button>
             <button 
               className={`flex-1 py-4 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${loginMode === 'ADMIN' ? 'bg-gray-800 text-white' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
               onClick={() => {
                 setLoginMode('ADMIN');
                 setLoginError('');
               }}
             >
                <ShieldCheck className="w-4 h-4" /> 管理员登录
             </button>
          </div>

          <div className="p-8">
            <div className="text-center mb-8">
              <div className={`w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg transform -rotate-6 transition-colors ${loginMode === 'ADMIN' ? 'bg-gray-800' : 'bg-blue-600'}`}>
                <Award className="text-white w-8 h-8" />
              </div>
              <h1 className="text-2xl font-bold text-gray-800">
                {loginMode === 'ADMIN' ? '后台管理系统' : '专利授权系统'}
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                {loginMode === 'ADMIN' ? '请输入管理员账号进行系统配置' : '登录以申请专利授权证书'}
              </p>
            </div>
            
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">账号</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  value={loginUser}
                  onChange={(e) => setLoginUser(e.target.value)}
                  placeholder={loginMode === 'ADMIN' ? "admin" : "企业用户名"}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
                <input
                  type="password"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  value={loginPass}
                  onChange={(e) => setLoginPass(e.target.value)}
                  placeholder="请输入登录密码"
                />
              </div>
              {loginError && (
                <p className="text-red-500 text-sm text-center bg-red-50 p-2 rounded animate-pulse">{loginError}</p>
              )}
              <button
                type="submit"
                className={`w-full text-white font-semibold py-3 rounded-lg transition shadow-md hover:shadow-lg ${loginMode === 'ADMIN' ? 'bg-gray-800 hover:bg-gray-900' : 'bg-blue-600 hover:bg-blue-700'}`}
              >
                {loginMode === 'ADMIN' ? '进入管理后台' : '登录系统'}
              </button>
            </form>

            <div className="mt-6 text-center text-xs text-gray-400">
               {loginMode === 'ADMIN' ? (
                  <p>默认管理员: admin / admin</p>
               ) : (
                  <p>默认演示账号: tech_corp / 123</p>
               )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navbar */}
      <nav className="bg-white shadow-sm border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Award className={`w-8 h-8 mr-3 ${currentUser.role === UserRole.ADMIN ? 'text-gray-700' : 'text-blue-600'}`} />
              <span className="font-bold text-xl text-gray-800">
                {currentUser.role === UserRole.ADMIN ? '授权管理后台' : '专利授权系统'}
              </span>
            </div>
            <div className="flex items-center space-x-4">
               <div className="text-right hidden sm:block">
                 <div className="text-sm font-medium text-gray-900">{currentUser.companyName}</div>
                 <div className="text-xs text-gray-500">{currentUser.role === UserRole.ADMIN ? '系统管理员' : '授权合作伙伴'}</div>
               </div>
               <button
                 onClick={handleLogout}
                 className="p-2 rounded-full text-gray-500 hover:bg-gray-100 transition"
                 title="退出登录"
               >
                 <LogOut className="w-5 h-5" />
               </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {currentUser.role === UserRole.ADMIN ? (
          <AdminPanel 
            currentUser={currentUser}
            data={data} 
            onUpdate={handleDataUpdate} 
          />
        ) : (
          <UserPanel 
            user={currentUser} 
            data={data} 
            onApply={handleApply}
            onDeductForDownload={handleDeductForDownload}
            onUpdateUser={handleUserUpdate}
          />
        )}
      </main>
      
      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center text-sm text-gray-500">
           <p>&copy; 2024 专利授权管理系统. 保留所有权利。</p>
           <button onClick={handleReset} className="text-xs hover:text-red-500 underline">重置演示数据</button>
        </div>
      </footer>
    </div>
  );
};

export default App;