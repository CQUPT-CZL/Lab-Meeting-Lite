import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Settings, Calendar, Unlock, CheckCircle, 
  Clock, Plus, Trash2, Users, Coffee, 
  ArrowLeftRight, GripVertical, ChevronsUp, ArrowUp, ArrowDown, ChevronsDown, Check, Github, Loader2,
  Crown
} from 'lucide-react';

// 【规范引用】引入独立的 API 服务
// 请确保 src/services/api.js 文件存在
import { fetchMeetingData, saveMeetingData } from './services/api';

// --- 子组件：全局提示 Toast ---
const Toast = ({ message, show }) => (
  <div className={`fixed top-10 left-1/2 -translate-x-1/2 z-[100] transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) ${show ? 'translate-y-0 opacity-100' : '-translate-y-8 opacity-0 pointer-events-none'}`}>
    <div className={`px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 font-bold text-sm border backdrop-blur-md ${message.type === 'error' ? 'bg-rose-500/90 border-rose-400 text-white' : 'bg-slate-800/90 border-slate-700/50 text-white'}`}>
      <div className={`rounded-full p-1 shadow-lg ${message.type === 'error' ? 'bg-rose-600' : 'bg-emerald-500'}`}>
        {message.type === 'error' ? <Trash2 size={12} strokeWidth={3} className="text-white"/> : <Check size={12} strokeWidth={3} className="text-white"/>}
      </div>
      {message.text}
    </div>
  </div>
);

const App = () => {
  // --- 状态管理 ---
  const [members, setMembers] = useState([]);
  const [meetingDate, setMeetingDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  
  // 权限与 UI 状态
  const [isAdmin, setIsAdmin] = useState(() => sessionStorage.getItem('app_is_admin') === 'true');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
  
  // 输入框状态
  const [passwordInput, setPasswordInput] = useState('');
  const [newMemberName, setNewMemberName] = useState('');
  
  // 排序临时状态
  const [pendingMembers, setPendingMembers] = useState([]);
  
  // 保存锁定状态
  const [isSaving, setIsSaving] = useState(false);

  // 提示框状态
  const [toast, setToast] = useState({ show: false, msg: { text: '', type: 'success' } });
  const toastTimerRef = useRef(null);

  // 拖拽引用
  const dragItemIndex = useRef(null);
  const dragOverIndex = useRef(null);

  // --- 辅助函数：显示提示 ---
  const showToastMsg = useCallback((text, type = 'success') => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ show: true, msg: { text, type } });
    toastTimerRef.current = setTimeout(() => {
      setToast({ show: false, msg: { text: '', type: 'success' } });
    }, 4000);
  }, []);

  // --- 初始化与数据加载 ---
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      // 调用 API 层
      const data = await fetchMeetingData();
      
      if (Array.isArray(data.members)) {
        setMembers(data.members);
      }
      
      if (data.meetingDate) {
        const d = new Date(data.meetingDate);
        if (!isNaN(d.getTime())) setMeetingDate(d);
      } else {
        // 如果后端没日期，自动算一个下周的日期
        const d = new Date();
        d.setDate(d.getDate() + (5 + 7 - d.getDay()) % 7);
        setMeetingDate(d);
      }
    } catch (err) {
      console.error("数据加载失败:", err);
      showToastMsg(`无法连接服务器: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [showToastMsg]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    sessionStorage.setItem('app_is_admin', isAdmin);
  }, [isAdmin]);

  // --- 核心逻辑：数据保存 ---

  /**
   * 统一的数据保存入口
   * 采用“乐观更新 + 失败回滚”策略
   */
  const handleSave = async (newMembers, newDate, successMsg = '保存成功') => {
    if (isSaving) return;

    // 1. 备份旧数据（用于回滚）
    const oldMembers = [...members];
    const oldDate = new Date(meetingDate);

    // 2. 乐观更新：先在界面上改了再说
    setMembers(newMembers);
    setMeetingDate(newDate);
    setIsSaving(true);

    try {
      // 3. 调用 API 层发送给后端
      await saveMeetingData(newMembers, newDate.toISOString());
      
      // 4. 真正成功
      localStorage.setItem('meeting_date_v2', newDate.toISOString());
      if (successMsg) showToastMsg(successMsg);

    } catch (error) {
      // 5. 失败回滚
      console.error("保存失败:", error);
      setMembers(oldMembers);
      setMeetingDate(oldDate);
      showToastMsg(`保存失败！${error.message}`, 'error');
      
      // 延迟重试拉取
      setTimeout(() => loadData(), 1000);
    } finally {
      setIsSaving(false);
    }
  };

  // --- 业务操作 ---

  const formatFriendlyDate = (date) => {
    return date.toLocaleDateString('zh-CN', { 
      month: 'long', 
      day: 'numeric', 
      weekday: 'long' 
    }).replace(/星期/, '周');
  };

  const isVIP = (name) => name && name.includes('冉');

  const handleLogin = (e) => {
    e.preventDefault();
    if (passwordInput === '1234') {
      setIsAdmin(true);
      setShowLoginModal(false);
      setPasswordInput('');
      showToastMsg('已进入管理模式');
    } else {
      showToastMsg('密码错误', 'error');
    }
  };

  // 1. 完成本周 (轮转前两个)
  const handleCompleteMeeting = async () => {
    if (members.length === 0) return;
    const newMembers = [...members];
    // 取出前两个放到最后
    const finished = newMembers.splice(0, Math.min(2, newMembers.length));
    newMembers.push(...finished);
    
    // 日期 + 7天
    const newDate = new Date(meetingDate);
    newDate.setDate(newDate.getDate() + 7);
    
    await handleSave(newMembers, newDate, '🎉 本周已完成，列表已轮转');
  };

  // 2. 顺延一周 (不改人，只改时间)
  const handlePostpone = async () => {
    const newDate = new Date(meetingDate);
    newDate.setDate(newDate.getDate() + 7);
    await handleSave(members, newDate, '☕️ 已顺延一周');
  };

  // 3. 新增成员
  const handleAddMember = async () => {
    if (!newMemberName.trim()) return;
    const newItem = { id: Date.now().toString(), name: newMemberName.trim() };
    const nextMembers = [...members, newItem];
    
    await handleSave(nextMembers, meetingDate, '已添加新成员');
    setNewMemberName('');
    setShowAddModal(false);
  };

  // 4. 排序相关
  const openSortModal = () => { 
    setPendingMembers([...members]); 
    setShowSortModal(true); 
  };
  
  const saveSortChanges = async () => {
    if (pendingMembers.length > 0) {
      await handleSave(pendingMembers, meetingDate, '顺序调整已保存');
    }
    setShowSortModal(false);
    setPendingMembers([]);
  };

  // 模态框内的各种移动逻辑
  const moveItemInModal = (from, to) => {
    if (to < 0 || to >= pendingMembers.length) return;
    const list = [...pendingMembers];
    const [item] = list.splice(from, 1);
    list.splice(to, 0, item);
    setPendingMembers(list);
  };
  const removeMemberInModal = (id) => {
    setPendingMembers(prev => prev.filter(m => m.id !== id));
  };
  const swapSpeakersInModal = () => {
    if (pendingMembers.length < 2) return;
    const list = [...pendingMembers];
    [list[0], list[1]] = [list[1], list[0]];
    setPendingMembers(list);
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
  const waitingList = members.length > 2 ? members.slice(2) : [];
  const waitingGroups = Array.from({ length: Math.ceil(waitingList.length / 2) }, (_, i) => waitingList.slice(i * 2, i * 2 + 2));

  // --- 界面渲染 ---

  if (loading && members.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F3F4F6] text-slate-400">
        <div className="flex flex-col items-center gap-2">
          <Loader2 size={32} className="animate-spin text-teal-500"/>
          <p>正在连接组会服务器...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F4F6] text-slate-700 font-sans pb-20 selection:bg-teal-100">
      <Toast message={toast.msg} show={toast.show} />

      {/* 导航栏 */}
      <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-slate-200/60 px-4 md:px-6 py-4 transition-all">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-teal-500/20">
              <Calendar size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800 tracking-tight">立立小组 组会顺序</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a href="https://github.com/CQUPT-CZL/Lab-Meeting-Lite" target="_blank" rel="noopener noreferrer" className="hidden md:flex items-center justify-center w-9 h-9 rounded-full border bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-black transition-colors">
              <Github size={18} />
            </a>
            <button 
              onClick={() => isAdmin ? setIsAdmin(false) : setShowLoginModal(true)} 
              className={`flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-full transition-all border shadow-sm active:scale-95 ${isAdmin ? 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
            >
              {isAdmin ? <><Unlock size={14} /> 退出管理</> : <><Settings size={14} /> 管理模式</>}
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
        {/* Header Section */}
        <section className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 p-6 md:p-10 relative overflow-hidden border border-white">
          <div className="absolute top-0 right-0 w-80 h-80 bg-teal-50 rounded-full blur-3xl opacity-60 pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl opacity-60 pointer-events-none translate-y-1/3 -translate-x-1/3"></div>
          
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-2">
              <div>
                 <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                   本周主讲
                   <span className="bg-teal-100 text-teal-700 text-[10px] px-2 py-1 rounded-full font-extrabold uppercase tracking-wide">Session</span>
                 </h2>
                 <p className="text-slate-400 font-medium text-sm mt-1.5 flex items-center gap-1.5 bg-slate-50 w-fit px-3 py-1 rounded-full">
                   <Clock size={14} className="text-teal-500" /> {formatFriendlyDate(meetingDate)}
                 </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[0, 1].map((index) => {
                const member = members[index];
                const isNoble = member && isVIP(member.name); 

                return (
                  <div key={index} className={`group relative rounded-3xl p-8 border transition-all duration-300 flex flex-col items-center text-center min-h-[220px] justify-center ${member ? 'bg-white border-slate-100 shadow-sm hover:shadow-xl hover:shadow-teal-500/5 hover:border-teal-100 hover:-translate-y-1' : 'border-2 border-dashed border-slate-200/80 bg-slate-50/50'}`}>
                    {member ? (
                      <>
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-xl mb-5 shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 ${isNoble ? 'bg-gradient-to-tr from-amber-100 to-amber-50 text-amber-500 border border-amber-200' : 'bg-gradient-to-tr from-slate-50 to-white text-slate-300 border border-slate-100'}`}>
                           {isNoble ? <Crown size={28} fill="currentColor"/> : <span className="group-hover:text-teal-500 transition-colors">0{index + 1}</span>}
                        </div>
                        <h3 className={`text-3xl font-bold tracking-tight mb-2 transition-colors flex items-center gap-2 ${isNoble ? 'text-amber-500 drop-shadow-sm' : 'text-slate-800 group-hover:text-teal-700'}`}>
                          {member.name}
                        </h3>
                        <div className={`h-1 rounded-full transition-all duration-300 ${isNoble ? 'w-16 bg-amber-300' : 'w-8 bg-teal-100 group-hover:w-16 group-hover:bg-teal-400'}`}></div>
                      </>
                    ) : (
                      <div className="text-slate-300 flex flex-col items-center"><Users size={32} className="mb-2 opacity-30"/><span className="text-sm font-medium">虚位以待</span></div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Admin Controls */}
        {isAdmin && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {[
              { label: '完成本周', icon: CheckCircle, color: 'text-emerald-400', onClick: handleCompleteMeeting, bg: 'bg-slate-800 hover:bg-slate-900 text-white' },
              { label: '调整顺序', icon: ArrowLeftRight, color: 'text-teal-200', onClick: openSortModal, bg: 'bg-teal-600 hover:bg-teal-700 text-white' },
              { label: '本周休息', icon: Coffee, color: 'text-amber-500', onClick: handlePostpone, bg: 'bg-white hover:bg-amber-50 text-slate-700 border border-slate-200' },
              { label: '新增成员', icon: Plus, color: 'text-teal-600', onClick: () => setShowAddModal(true), bg: 'bg-white hover:bg-teal-50 text-slate-700 border border-slate-200' },
            ].map((btn, idx) => (
              <button 
                key={idx}
                onClick={btn.onClick}
                disabled={isSaving}
                className={`${btn.bg} p-4 rounded-2xl flex flex-col items-center justify-center gap-2 shadow-sm hover:shadow-md active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isSaving ? <Loader2 size={24} className="animate-spin opacity-80" /> : <btn.icon size={24} className={btn.color} />}
                <span className="font-bold text-sm">{btn.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Waiting List */}
        <section className="animate-in slide-in-from-bottom-8 duration-700 delay-100">
          <div className="flex items-center justify-between mb-5 px-2">
            <div className="flex items-center gap-2">
               <div className="w-1 h-4 bg-teal-500 rounded-full"></div>
               <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">后续队列</h3>
            </div>
            <span className="text-xs font-medium text-slate-400 bg-white px-2 py-1 rounded-md border border-slate-100 shadow-sm">
              共 {waitingList.length} 人
            </span>
          </div>
          
          <div className="space-y-3">
            {waitingGroups.map((group, i) => (
              <div key={i} className="group bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex items-center gap-5">
                <div className="w-10 flex flex-col items-center justify-center border-r border-slate-100 pr-5">
                  <span className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">Group</span>
                  <span className="text-xl font-black text-slate-300 group-hover:text-teal-400 transition-colors">{i + 2}</span>
                </div>
                <div className="flex gap-3 flex-wrap">
                  {group.map(m => {
                    const isNoble = isVIP(m.name);
                    return (
                      <div key={m.id} className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border transition-all font-medium ${
                        isNoble 
                          ? 'bg-amber-50 border-amber-200 text-amber-700 shadow-sm' 
                          : 'bg-slate-50 border-slate-100 text-slate-600 group-hover:bg-teal-50/50 group-hover:border-teal-100 group-hover:text-teal-800'
                      }`}>
                        <div className={`w-2 h-2 rounded-full transition-colors ${isNoble ? 'bg-amber-400' : 'bg-slate-300 group-hover:bg-teal-400'}`}></div>
                        {m.name}
                        {isNoble && <Crown size={14} className="text-amber-500" fill="currentColor"/>}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
            {waitingGroups.length === 0 && <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-3xl text-slate-300 text-sm font-medium">暂无排队人员</div>}
          </div>
        </section>
      </main>

      {/* --- Modals --- */}

      {/* Sort Modal */}
      {showSortModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={(e) => { if(e.target === e.currentTarget && !isSaving) setShowSortModal(false); }}>
          <div className="w-full max-w-lg bg-white rounded-[2rem] shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white z-10">
              <div><h3 className="font-bold text-xl text-slate-800 flex items-center gap-2">调整顺序</h3><p className="text-xs text-slate-400 mt-1">长按拖拽或点击按钮调整</p></div>
              <button onClick={swapSpeakersInModal} disabled={isSaving} className="text-xs font-bold bg-teal-50 text-teal-700 px-4 py-2 rounded-xl hover:bg-teal-100 transition-colors disabled:opacity-50">交换前两名</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-slate-50/50">
              {pendingMembers.map((m, index) => {
                const isSpeaker = index < 2;
                const isNoble = isVIP(m.name);
                return (
                  <div key={m.id} draggable onDragStart={() => dragItemIndex.current = index} onDragEnter={() => dragOverIndex.current = index} onDragEnd={handleSortDragEnd} onDragOver={e => e.preventDefault()} className={`flex items-center gap-3 p-3 rounded-xl border transition-all select-none group ${isSpeaker ? 'bg-white border-teal-200 shadow-sm ring-1 ring-teal-50' : 'bg-white border-slate-100 hover:border-teal-200'}`}>
                    <div className="text-slate-300 cursor-grab active:cursor-grabbing hover:text-slate-500"><GripVertical size={18} /></div>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0 ${isSpeaker ? 'bg-teal-500 text-white' : 'bg-slate-100 text-slate-400'}`}>{index + 1}</div>
                    <div className="flex-1 min-w-0">
                      <div className={`font-bold truncate flex items-center gap-1 ${isNoble ? 'text-amber-600' : 'text-slate-700'}`}>
                        {m.name} {isNoble && <Crown size={14} fill="currentColor" />}
                      </div>
                      <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{isSpeaker ? <span className="text-teal-600">本周主讲</span> : `排队 GRP ${Math.floor((index-2)/2) + 2}`}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => moveItemInModal(index, 0)} className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded"><ChevronsUp size={16}/></button>
                      <button onClick={() => moveItemInModal(index, index - 1)} disabled={index === 0} className="p-1.5 text-slate-400 hover:text-slate-800 disabled:opacity-20 hover:bg-slate-100 rounded"><ArrowUp size={16}/></button>
                      <button onClick={() => moveItemInModal(index, index + 1)} disabled={index === pendingMembers.length - 1} className="p-1.5 text-slate-400 hover:text-slate-800 disabled:opacity-20 hover:bg-slate-100 rounded"><ArrowDown size={16}/></button>
                      <button onClick={() => moveItemInModal(index, pendingMembers.length - 1)} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded"><ChevronsDown size={16}/></button>
                      <div className="w-px h-4 bg-slate-200 mx-1"></div>
                      <button onClick={() => removeMemberInModal(m.id)} className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded"><Trash2 size={16}/></button>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="p-4 border-t border-slate-100 bg-white grid grid-cols-2 gap-3">
              <button onClick={() => setShowSortModal(false)} disabled={isSaving} className="py-3 text-slate-500 hover:bg-slate-50 rounded-xl font-bold transition-all border border-transparent hover:border-slate-200 disabled:opacity-50">取消</button>
              <button onClick={saveSortChanges} disabled={isSaving} className="py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold transition-all shadow-lg shadow-slate-200 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2">
                {isSaving && <Loader2 size={18} className="animate-spin"/>} 确认并保存
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
              <input autoFocus type="password" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} placeholder="输入密码" className="w-full border border-slate-200 rounded-xl p-3 text-center mb-4 focus:ring-2 ring-teal-500/50 outline-none text-slate-800 text-lg tracking-widest"/>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowLoginModal(false)} className="flex-1 py-2.5 text-slate-500 hover:bg-slate-50 rounded-xl font-bold text-sm">取消</button>
                <button type="submit" className="flex-1 bg-slate-800 text-white rounded-xl font-bold text-sm shadow-lg shadow-slate-200">进入</button>
              </div>
            </form>
          </div>
        </div> 
      )}
      
      {/* Add Modal */}
      {showAddModal && ( 
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => !isSaving && setShowAddModal(false)}>
          <div className="bg-white rounded-2xl p-6 shadow-2xl w-full max-w-xs animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-center mb-4 text-slate-800">新增成员</h3>
            <input autoFocus value={newMemberName} onChange={e => setNewMemberName(e.target.value)} placeholder="输入名字" className="w-full border border-slate-200 rounded-xl p-3 text-center mb-4 focus:ring-2 ring-teal-500/50 outline-none text-slate-800"/>
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowAddModal(false)} disabled={isSaving} className="flex-1 py-2.5 text-slate-500 hover:bg-slate-50 rounded-xl font-bold text-sm">取消</button>
              <button type="button" onClick={handleAddMember} disabled={isSaving} className="flex-1 bg-teal-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-teal-200 flex justify-center items-center gap-2">
                {isSaving && <Loader2 size={16} className="animate-spin"/>}确认
              </button>
            </div>
          </div>
        </div> 
      )}
    </div>
  );
};

export default App;