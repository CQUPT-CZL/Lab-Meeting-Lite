import express from 'express';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';

// 在 module 模式下，需要手动创建 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// 指定数据文件的位置
// 注意：确保你的 data.json 确实在这个路径下
const DATA_FILE = path.join(__dirname, 'src', 'config', 'data.json');

// 处理保存请求
app.post('/api/save-data', (req, res) => {
  const newData = req.body;
  
  console.log(`[${new Date().toLocaleTimeString()}] 收到保存请求...`);

  const jsonString = JSON.stringify(newData, null, 2);

  fs.writeFile(DATA_FILE, jsonString, 'utf8', (err) => {
    if (err) {
      console.error('❌ 写入文件失败:', err);
      return res.status(500).json({ success: false });
    }
    console.log('✅ 文件已成功更新！');
    res.json({ success: true });
  });
});

app.listen(port, () => {
  console.log(`后端服务已启动: http://localhost:${port}`);
  console.log(`目标文件路径: ${DATA_FILE}`);
});