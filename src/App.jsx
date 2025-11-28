import React, { useState, useEffect, useRef } from 'react';
import { 
  Settings, Calendar, Unlock, CheckCircle, 
  Clock, Plus, Trash2, Users, Coffee, 
  ArrowLeftRight, GripVertical, ChevronsUp, ArrowUp, ArrowDown, ChevronsDown, X
} from 'lucide-react';

// 【改动1】导入新的总数据文件
import initialData from './config/data.json'; 

const App = () => {
  // 【改动2】初始化成员：从 initialData.members 读取
  const [members, setMembers] = useState(initialData.members || []);

  // 【改动3】初始化时间：优先读 JSON，其次读 LocalStorage，最后自动计算
  const [meetingDate, setMeetingDate] = useState(() => {
    // A. 优先尝试从 JSON 文件读取 (这是“服务器/后端”给的最新时间)
    if (initialData.meetingDate) {
      const d = new Date(initialData.meetingDate);
      if (!isNaN(d.getTime())) return d;
    }

    // B. 如果 JSON 里没有，再看看本地缓存 (容错)
    const saved = localStorage.getItem('meeting_date_v2');
    if (saved) {
      const d = new Date(saved);
      if (!isNaN(d.getTime())) return d;
    }

    // C. 都没有，自动计算下一个周五
    const d = new Date();
    d.setDate(d.getDate() + (5 + 7 - d.getDay()) % 7);
    return d;
  });

  const [isAdmin, setIsAdmin] = useState(() => {
    return sessionStorage.getItem('app_is_admin') === 'true';
  });

  const [passwordInput, setPasswordInput] = useState('');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [showSortModal, setShowSortModal] = useState(false);
  const [pendingMembers, setPendingMembers] = useState([]);

  const dragItemIndex = useRef(null);
  const dragOverIndex = useRef(null);

  useEffect(() => {
    localStorage.setItem('meeting_date_v2', meetingDate.toISOString());
  }, [meetingDate]);

  useEffect(() => {
    sessionStorage.setItem('app_is_admin', isAdmin);
  }, [isAdmin]);

  // 【改动4】通用的保存函数：同时保存 成员列表 和 当前时间
  // 注意：需要传入当前的 members 和 date，因为 React 的 state 在函数闭包里可能不是最新的
  const saveDataToBackend = async (currentMembers, currentDate) => {
    try {
      await fetch('/api/save-data', { // 假设接口改成 save-data
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          members: currentMembers, 
          meetingDate: currentDate.toISOString() 
        }),
      });
    } catch (e) {
      console.error("Save failed", e);
    }
  };

  // 封装一个快捷保存，默认使用当前 state 中的日期
  // 用于：只调整了顺序，没调整时间的情况
  const saveMembersOnly = (newMembers) => {
    setMembers(newMembers);
    saveDataToBackend(newMembers, meetingDate);
  };

  // --- 核心业务逻辑 ---

  const handleLogin = (e) => {
    e.preventDefault();
    if (passwordInput === '1234') {
      setIsAdmin(true);
      setShowLoginModal(false);
      setPasswordInput('');
    }
  };

  const handleLogout = () => {
    setIsAdmin(false);
    sessionStorage.removeItem('app_is_admin');
  };

  const handleCompleteMeeting = () => {
    if (members.length === 0) return;
    const currentNames = members.slice(0, 2).map(m => m.name).join(' & ');
    if (!window.confirm(`🎉 确认 ${currentNames} 讲完了？`)) return;
    
    // 1. 计算新名单
    const newMembers = [...members];
    const finished = newMembers.splice(0, Math.min(2, newMembers.length));
    newMembers.push(...finished);
    
    // 2. 计算新时间
    const newDate = new Date(meetingDate);
    newDate.setDate(newDate.getDate() + 7);
    
    // 3. 更新状态
    setMembers(newMembers);
    setMeetingDate(newDate);

    // 4. 【关键】保存两样东西到后端
    saveDataToBackend(newMembers, newDate);
  };

  const handlePostpone = () => {
    if (!window.confirm('☕️ 确认本周休息/延期？')) return;
    
    const newDate = new Date(meetingDate);
    newDate.setDate(newDate.getDate() + 7);
    
    setMeetingDate(newDate);
    
    // 延期时，名单没变，但时间变了，也要保存
    saveDataToBackend(members, newDate);
  };

  const handleAddMember = () => {
    if (!newMemberName.trim()) return;
    const newItem = { id: Date.now().toString(), name: newMemberName.trim() };
    const next = [...members, newItem];
    setMembers(next);
    saveDataToBackend(next, meetingDate); // 保存
    setNewMemberName('');
    setShowAddModal(false);
  };

  // --- 排序相关 ---
  const openSortModal = () => {
    setPendingMembers([...members]); 
    setShowSortModal(true);
  };

  const closeSortModal = () => {
    setPendingMembers([]);
    setShowSortModal(false);
  };

  const saveSortChanges = () => {
    if (pendingMembers && pendingMembers.length > 0) {
      // 保存排序后的名单，时间保持不变
      saveMembersOnly(pendingMembers);
    }
    closeSortModal();
  };

  // ... (中间的 moveItemInModal 等 helper 函数保持不变，因为它们只操作 pendingMembers) ...
  const moveItemInModal = (fromIndex, toIndex) => {
    if (!pendingMembers || toIndex < 0 || toIndex >= pendingMembers.length) return;
    const newMembers = [...pendingMembers];
    const [moved] = newMembers.splice(fromIndex, 1);
    newMembers.splice(toIndex, 0, moved);
    setPendingMembers(newMembers);
  };
  const moveToTopInModal = (index) => moveItemInModal(index, 0);
  const moveToBottomInModal = (index) => moveItemInModal(index, pendingMembers.length - 1);
  const removeMemberInModal = (id) => {
    const next = pendingMembers.filter(m => m.id !== id);
    setPendingMembers(next);
  };
  const swapSpeakersInModal = () => {
    if (!pendingMembers || pendingMembers.length < 2) return;
    const newMembers = [...pendingMembers];
    const [first] = newMembers.splice(0, 1);
    newMembers.splice(1, 0, first);
    setPendingMembers(newMembers);
  };
  const handleSortDragEnd = () => {
    const from = dragItemIndex.current;
    const to = dragOverIndex.current;
    if (from !== null && to !== null && from !== to) {
      moveItemInModal(from, to);
    }
    dragItemIndex.current = null;
    dragOverIndex.current = null;
  };


  // 计算分组
  const waitingList = members && members.length > 2 ? members.slice(2) : [];
  const waitingGroups = Array.from(
    { length: Math.ceil(waitingList.length / 2) }, 
    (_, i) => waitingList.slice(i * 2, i * 2 + 2)
  );

  return (
    <div className="min-h-screen bg-[#F3F4F6] text-slate-700 font-sans pb-20">
      {/* 顶部导航 */}
      <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-slate-200/60 px-6 py-4">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-teal-500/20">
              <Calendar size={20} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800">Group Meeting</h1>
            </div>
          </div>
          <button 
            type="button"
            onClick={() => isAdmin ? handleLogout() : setShowLoginModal(true)}
            className={`flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-full transition-all border ${isAdmin ? 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
          >
            {isAdmin ? <><Unlock size={14} /> 退出管理</> : <><Settings size={14} /> 管理模式</>}
          </button>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto p-4 md:p-8 space-y-8">
        {/* 主讲区域 */}
        <section className="bg-white rounded-[2rem] shadow-xl p-6 md:p-10 relative overflow-hidden border border-white">
          <div className="absolute top-0 right-0 w-64 h-64 bg-teal-50 rounded-full blur-3xl opacity-60 pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
          <div className="relative z-10">
            <div className="flex justify-between items-center mb-8">
              <div>
                 <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">本周主讲</h2>
                 <p className="text-slate-400 text-sm mt-1 flex items-center gap-1"><Clock size={14} /> {meetingDate.toLocaleDateString()}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[0, 1].map((index) => {
                const member = members[index];
                return (
                  <div key={index} className={`relative bg-white rounded-2xl p-6 border ${member ? 'border-slate-100 shadow-sm' : 'border-dashed border-slate-200'} flex flex-col items-center text-center min-h-[200px] justify-center`}>
                    {member ? (
                      <>
                        <div className="w-16 h-16 bg-gradient-to-tr from-slate-100 to-white border border-slate-100 rounded-full flex items-center justify-center text-slate-400 font-bold text-xl mb-4 shadow-inner">{index + 1}</div>
                        <h3 className="text-2xl font-bold text-slate-800">{member.name}</h3>
                        <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider">Speaker</p>
                      </>
                    ) : (
                      <div className="text-slate-300 flex flex-col items-center"><Users size={32} className="mb-2 opacity-50"/><span>空缺</span></div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 管理员工具栏 */}
        {isAdmin && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-4">
            <button type="button" onClick={handleCompleteMeeting} className="bg-slate-800 hover:bg-slate-900 text-white p-4 rounded-2xl flex flex-col items-center justify-center gap-2 shadow-lg active:scale-95 transition-all">
              <CheckCircle size={24} className="text-emerald-400" />
              <span className="font-bold text-sm">完成本周</span>
            </button>
            <button type="button" onClick={openSortModal} className="bg-teal-600 hover:bg-teal-700 text-white p-4 rounded-2xl flex flex-col items-center justify-center gap-2 shadow-lg active:scale-95 transition-all">
              <ArrowLeftRight size={24} className="text-teal-200" />
              <span className="font-bold text-sm">调整顺序</span>
            </button>
            <button type="button" onClick={handlePostpone} className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 p-4 rounded-2xl flex flex-col items-center justify-center gap-2 shadow-sm active:scale-95 transition-all">
              <Coffee size={24} className="text-amber-500" />
              <span className="font-bold text-sm">本周休息</span>
            </button>
            <button type="button" onClick={() => setShowAddModal(true)} className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 p-4 rounded-2xl flex flex-col items-center justify-center gap-2 shadow-sm active:scale-95 transition-all">
              <Plus size={24} className="text-teal-600" />
              <span className="font-bold text-sm">新增成员</span>
            </button>
          </div>
        )}

        {/* 排队展示 */}
        <section>
          <div className="flex items-center gap-2 mb-4 px-2">
            <Users size={16} className="text-slate-400"/>
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">排队列表</h3>
          </div>
          <div className="space-y-3">
            {waitingGroups.map((group, i) => (
              <div key={i} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
                <div className="w-8 flex flex-col items-center text-slate-300 font-bold"><span className="text-[10px]">GRP</span><span className="text-lg">{i + 2}</span></div>
                <div className="flex gap-2 flex-wrap">
                  {group.map(m => (
                    <div key={m.id} className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                      <div className="w-2 h-2 rounded-full bg-teal-400"></div>
                      <span className="text-sm font-medium text-slate-700">{m.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {waitingGroups.length === 0 && <div className="text-center py-8 border-dashed border-2 border-slate-100 rounded-xl text-slate-400 text-sm">无人排队</div>}
          </div>
        </section>
      </main>

      {/* --- 排序弹窗 --- */}
      {showSortModal && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={(e) => {
             if(e.target === e.currentTarget) closeSortModal();
          }} 
        >
          <div 
            className="w-full max-w-lg bg-white rounded-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()} 
          >
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-white z-10 flex-shrink-0">
              <div>
                <h3 className="font-bold text-xl text-slate-800 flex items-center gap-2">
                  <ArrowLeftRight size={22} className="text-teal-600"/> 调整顺序
                </h3>
                <p className="text-xs text-slate-400 mt-1">拖拽或点击调整，按底部按钮保存</p>
              </div>
              <button 
                type="button" 
                onClick={swapSpeakersInModal} 
                className="text-xs font-bold bg-teal-50 text-teal-700 px-3 py-1.5 rounded-lg hover:bg-teal-100 transition-colors"
              >
                 交换前两名
              </button>
            </div>
            
            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-slate-50/50">
              {pendingMembers && pendingMembers.map((m, index) => {
                const isSpeaker = index < 2;
                return (
                  <div 
                    key={m.id}
                    draggable
                    onDragStart={() => dragItemIndex.current = index}
                    onDragEnter={() => dragOverIndex.current = index}
                    onDragEnd={handleSortDragEnd}
                    onDragOver={e => e.preventDefault()}
                    className={`
                      flex items-center gap-3 p-3 rounded-xl border transition-all select-none group
                      ${isSpeaker ? 'bg-white border-teal-200 shadow-sm ring-1 ring-teal-50' : 'bg-white border-slate-100 hover:border-teal-200'}
                    `}
                  >
                    <div className="text-slate-300 cursor-grab active:cursor-grabbing hover:text-slate-500">
                      <GripVertical size={18} />
                    </div>

                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0 ${isSpeaker ? 'bg-teal-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                      {index + 1}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-700 truncate">{m.name}</div>
                      <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                        {isSpeaker ? <span className="text-teal-600">本周主讲</span> : `排队 GRP ${Math.floor((index-2)/2) + 2}`}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => moveToTopInModal(index)} className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded"><ChevronsUp size={16}/></button>
                      <button type="button" onClick={() => moveItemInModal(index, index - 1)} disabled={index === 0} className="p-1.5 text-slate-400 hover:text-slate-800 disabled:opacity-20 hover:bg-slate-100 rounded"><ArrowUp size={16}/></button>
                      <button type="button" onClick={() => moveItemInModal(index, index + 1)} disabled={index === pendingMembers.length - 1} className="p-1.5 text-slate-400 hover:text-slate-800 disabled:opacity-20 hover:bg-slate-100 rounded"><ArrowDown size={16}/></button>
                      <button type="button" onClick={() => moveToBottomInModal(index)} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded"><ChevronsDown size={16}/></button>
                      <div className="w-px h-4 bg-slate-200 mx-1"></div>
                      <button type="button" onClick={() => removeMemberInModal(m.id)} className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded"><Trash2 size={16}/></button>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="p-4 border-t border-slate-100 bg-white flex-shrink-0 grid grid-cols-2 gap-3">
              <button 
                type="button"
                onClick={closeSortModal}
                className="py-3 text-slate-500 hover:bg-slate-50 rounded-xl font-bold transition-all border border-transparent hover:border-slate-200"
              >
                取消
              </button>
              <button 
                type="button"
                onClick={saveSortChanges}
                className="py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold transition-all shadow-lg shadow-slate-200 active:scale-[0.98]"
              >
                确认并保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Login / Add Modals (保持不变)... */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowLoginModal(false)}>
          <div className="bg-white rounded-2xl p-6 shadow-2xl w-full max-w-xs animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-center mb-4 text-slate-800">管理员验证</h3>
            <form onSubmit={handleLogin}>
              <input autoFocus type="password" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} placeholder="密码: 1234" className="w-full border border-slate-200 rounded-xl p-3 text-center mb-4 focus:ring-2 ring-teal-500/50 outline-none text-slate-800 tracking-widest"/>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowLoginModal(false)} className="flex-1 py-2.5 text-slate-500 hover:bg-slate-50 rounded-xl transition-colors font-medium text-sm">取消</button>
                <button type="submit" className="flex-1 bg-slate-800 text-white rounded-xl font-bold text-sm shadow-lg shadow-slate-200">进入</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowAddModal(false)}>
          <div className="bg-white rounded-2xl p-6 shadow-2xl w-full max-w-xs animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-center mb-4 text-slate-800">新增成员</h3>
            <input autoFocus value={newMemberName} onChange={e => setNewMemberName(e.target.value)} placeholder="输入名字" className="w-full border border-slate-200 rounded-xl p-3 text-center mb-4 focus:ring-2 ring-teal-500/50 outline-none text-slate-800"/>
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-2.5 text-slate-500 hover:bg-slate-50 rounded-xl transition-colors font-medium text-sm">取消</button>
              <button type="button" onClick={handleAddMember} className="flex-1 bg-teal-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-teal-200">确认</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;