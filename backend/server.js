const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 5001;

// 增加请求体大小限制
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// 启用 CORS
app.use(cors());

// 验证 JWT token 的中间件
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  jwt.verify(token, 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// 内存存储用户数据
let users = [
  {
    id: '1',
    username: 'teacher',
    email: 'teacher@test.com',
    password: 'teacher123',
    role: 'teacher',
    avatar: null
  },
  {
    id: '2',
    username: 'student',
    email: 'student@test.com',
    password: 'student123',
    role: 'student',
    avatar: null
  },
  {
    id: '3',
    username: 'admin',
    email: 'admin@test.com',
    password: 'admin123',
    role: 'admin',
    avatar: null
  }
];

// 登录路由
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username);

    if (!user) {
      return res.status(401).json({ message: '账号或密码错误' });
    }

    if (password !== user.password) {
      return res.status(401).json({ message: '账号或密码错误' });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        avatar: user.avatar || 'https://randomuser.me/api/portraits/men/1.jpg'
      }
    });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

// 更新头像路由
app.post('/api/auth/update-avatar', authenticateToken, (req, res) => {
  try {
    const { avatar } = req.body;
    const userId = req.user.userId;

    if (!avatar) {
      return res.status(400).json({ message: 'Avatar data is required' });
    }

    const user = users.find(u => u.id === userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.avatar = avatar;

    res.json({
      message: 'Avatar updated successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Avatar update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// 注册路由
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    const existingUser = users.find(u => u.email === email || u.username === username);
    if (existingUser) {
      return res.status(400).json({ message: 'Username or email already exists' });
    }

    const newUser = {
      id: String(users.length + 1),
      username,
      email,
      password: password,
      role: role || 'student',
      avatar: null
    };

    users.push(newUser);

    const token = jwt.sign(
      { userId: newUser.id, role: newUser.role },
      'your-secret-key',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        avatar: newUser.avatar || 'https://randomuser.me/api/portraits/men/1.jpg'
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 