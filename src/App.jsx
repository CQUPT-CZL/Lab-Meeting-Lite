import React, { useState, useEffect, useRef } from 'react';
import { 
  Settings, Calendar, Lock, Unlock, CheckCircle, 
  Clock, Plus, Trash2, Users, Edit2, Coffee, 
  ArrowUp, ArrowDown, ChevronsUp, ChevronsDown, ArrowLeftRight, GripVertical
} from 'lucide-react';
import defaultMembers from './config/members.json';

const App = () => {
  const [members, setMembers] = useState(defaultMembers);

  const [meetingDate, setMeetingDate] = useState(() => {
    const saved = localStorage.getItem('meeting_date_v2');
    if (saved) return new Date(saved);
    const d = new Date();
    d.setDate(d.getDate() + (5 + 7 - d.getDay()) % 7);
    return d;
  });

  // 使用 sessionStorage 保持登录状态
  const [isAdmin, setIsAdmin] = useState(() => {
    return sessionStorage.getItem('app_is_admin') === 'true';
  });

  const [passwordInput, setPasswordInput] = useState('');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [showSortModal, setShowSortModal] = useState(false);

  // Drag Refs
  const dragItemIndex = useRef(null);
  const dragOverIndex = useRef(null);

  useEffect(() => {
    localStorage.setItem('meeting_date_v2', meetingDate.toISOString());
  }, [meetingDate]);

  useEffect(() => {
    sessionStorage.setItem('app_is_admin', isAdmin);
  }, [isAdmin]);

  const saveMembersToConfig = async (list) => {
    try {
      await fetch('/api/save-members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ members: list }),
      });
    } catch (e) {}
  };

  // --- 核心操作 (带事件阻断) ---
  const moveItem = (e, fromIndex, toIndex) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation(); // 关键：阻止事件冒泡，防止弹窗关闭
    }
    if (toIndex < 0 || toIndex >= members.length) return;
    const newMembers = [...members];
    const [moved] = newMembers.splice(fromIndex, 1);
    newMembers.splice(toIndex, 0, moved);
    setMembers(newMembers);
    saveMembersToConfig(newMembers);
  };

  const moveToTop = (e, index) => moveItem(e, index, 0);
  const moveToBottom = (e, index) => moveItem(e, index, members.length - 1);
  const removeMemberWithStop = (e, id) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    if (window.confirm('移除该成员？')) {
      const next = members.filter(m => m.id !== id);
      setMembers(next);
      saveMembersToConfig(next);
    }
  };
  
  const swapSpeakers = (e) => {
    if(e) { e.preventDefault(); e.stopPropagation(); }
    if (members.length < 2) return;
    const newMembers = [...members];
    const [first] = newMembers.splice(0, 1);
    newMembers.splice(1, 0, first);
    setMembers(newMembers);
    saveMembersToConfig(newMembers);
  };

  // --- 拖拽逻辑 ---
  const handleSortDragEnd = () => {
    const from = dragItemIndex.current;
    const to = dragOverIndex.current;
    if (from !== null && to !== null && from !== to) {
      moveItem(null, from, to); // 拖拽不需要传 e
    }
    dragItemIndex.current = null;
    dragOverIndex.current = null;
  };

  // --- 其他业务逻辑 ---
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
    const newMembers = [...members];
    const finished = newMembers.splice(0, Math.min(2, newMembers.length));
    newMembers.push(...finished);
    setMembers(newMembers);
    saveMembersToConfig(newMembers);
    const newDate = new Date(meetingDate);
    newDate.setDate(newDate.getDate() + 7);
    setMeetingDate(newDate);
  };

  const handlePostpone = () => {
    if (!window.confirm('☕️ 确认本周休息/延期？')) return;
    const newDate = new Date(meetingDate);
    newDate.setDate(newDate.getDate() + 7);
    setMeetingDate(newDate);
  };

  const handleAddMember = () => {
    if (!newMemberName.trim()) return;
    const newItem = { id: Date.now().toString(), name: newMemberName.trim() };
    const next = [...members, newItem];
    setMembers(next);
    saveMembersToConfig(next);
    setNewMemberName('');
    setShowAddModal(false);
  };

  const waitingGroups = Array.from({ length: Math.ceil(members.slice(2).length / 2) }, (v, i) => members.slice(2).slice(i * 2, i * 2 + 2));

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
            <button type="button" onClick={() => setShowSortModal(true)} className="bg-teal-600 hover:bg-teal-700 text-white p-4 rounded-2xl flex flex-col items-center justify-center gap-2 shadow-lg active:scale-95 transition-all">
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

      {/* --- 排序弹窗 (修复闪退问题) --- */}
      {showSortModal && (
        // 1. 外层背景点击：只有点击这里才会关闭
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowSortModal(false)} 
        >
          {/* 2. 内部容器：阻止事件冒泡到外层 */}
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
                <p className="text-xs text-slate-400 mt-1">点击按钮或拖拽，操作实时生效</p>
              </div>
              <button 
                type="button" 
                onClick={(e) => swapSpeakers(e)} 
                className="text-xs font-bold bg-teal-50 text-teal-700 px-3 py-1.5 rounded-lg hover:bg-teal-100 transition-colors"
              >
                 交换前两名
              </button>
            </div>
            
            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-slate-50/50">
              {members.map((m, index) => {
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

                    {/* 按钮组：全部显式阻止冒泡 */}
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={(e) => moveToTop(e, index)} className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded"><ChevronsUp size={16}/></button>
                      <button type="button" onClick={(e) => moveItem(e, index, index - 1)} disabled={index === 0} className="p-1.5 text-slate-400 hover:text-slate-800 disabled:opacity-20 hover:bg-slate-100 rounded"><ArrowUp size={16}/></button>
                      <button type="button" onClick={(e) => moveItem(e, index, index + 1)} disabled={index === members.length - 1} className="p-1.5 text-slate-400 hover:text-slate-800 disabled:opacity-20 hover:bg-slate-100 rounded"><ArrowDown size={16}/></button>
                      <button type="button" onClick={(e) => moveToBottom(e, index)} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded"><ChevronsDown size={16}/></button>
                      <div className="w-px h-4 bg-slate-200 mx-1"></div>
                      <button type="button" onClick={(e) => removeMemberWithStop(e, m.id)} className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded"><Trash2 size={16}/></button>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="p-4 border-t border-slate-100 bg-white flex-shrink-0">
              <button 
                type="button"
                onClick={() => setShowSortModal(false)}
                className="w-full py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold transition-all shadow-lg shadow-slate-200 active:scale-[0.98]"
              >
                完成调整
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Login Modal */}
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

      {/* Add Modal */}
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