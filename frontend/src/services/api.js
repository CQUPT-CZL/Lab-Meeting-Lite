// 生产环境留空，开发环境通过 Vite 的 proxy 代理转发
const BASE_URL = ''; 

// 通用请求封装
const request = async (url, options = {}) => {
  const res = await fetch(`${BASE_URL}${url}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Server Error: ${res.status} - ${errorText}`);
  }

  const data = await res.json();
  // 某些后端可能返回 HTTP 200 但在 body 里写 success: false
  if (options.method === 'POST' && data.success === false) {
    throw new Error(data.message || 'Backend reported failure');
  }
  return data;
};

export const fetchMeetingData = async () => {
  return request('/api/data');
};

/**
 * 修改重点：
 * 1. 参数改为 (members, meetingDate) 以匹配 App.jsx 的调用方式
 * 2. body 直接使用传入的这两个参数构建对象
 */
export const saveMeetingData = async (members, meetingDate) => {
  return request('/api/save-data', {
    method: 'POST',
    body: JSON.stringify({ 
      members: members, 
      meetingDate: meetingDate 
    }),
  });
};