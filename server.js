const http = require('http');
const app = require('./app');
const dotenv = require('dotenv');
const { initializeSocketServer } = require('./sockets/socket');

// 環境変数の読み込み
dotenv.config();

// ポート設定
const PORT = process.env.PORT || 5000;

// HTTPサーバーの作成
const server = http.createServer(app);

// Socket.IOサーバーの初期化
const io = initializeSocketServer(server);

// サーバーの起動
server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
