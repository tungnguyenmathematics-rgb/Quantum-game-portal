# Quantum Game Portal

Nền tảng chia sẻ & chơi web game do cộng đồng đăng tải — bản nâng cấp full‑stack
(React + Node/Express + Socket.IO + SQLite) từ file HTML gốc.

## Đã nâng cấp so với bản HTML tĩnh

- **Backend thật**: Express + SQLite (better-sqlite3), thay cho Firebase ẩn danh.
- **Đăng nhập / đăng ký thật**: mật khẩu hash bằng bcrypt, phiên đăng nhập bằng JWT.
- **Tài khoản Admin** được tạo qua script seed (xem phần "Tài khoản Admin" bên dưới).
- **Giao diện React** (Vite + Tailwind), responsive từ mobile đến desktop, giữ nguyên
  phong cách neon cyberpunk của bản gốc.
- **Lưu điểm & bảng xếp hạng** cho từng game qua `window.QuantumSDK.submitScore(n)`
  mà mọi game nhúng đều có sẵn.
- **Chơi online nhiều người**: mọi game bật cờ "multiplayer" có sẵn API
  `window.QuantumMultiplayer.join(roomCode)` / `.send(payload)` / `.onMessage(cb)` —
  Socket.IO ở backend làm cầu nối theo phòng (room) mà game không cần server riêng.
- **Logo sản phẩm**: nhà phát triển upload logo cho từng game (và avatar cá nhân).
- **Gói Developer**: tài khoản mặc định là `player`; cần đăng ký "gói Dev" (miễn phí,
  1 click) mới được đăng game — dễ dàng đổi thành gói trả phí sau này.
- **Tính năng kiểu Y8**: kết bạn ("xin số"/gửi lời mời), chat cộng đồng theo thời gian
  thực, nhắn tin riêng, trang Cài Đặt (đổi avatar, tên hiển thị, mật khẩu), trang Admin
  (thống kê, quản lý vai trò/xoá tài khoản & game).
- **render.yaml**: deploy 1-click lên Render (single Node service, có ổ đĩa bền để
  SQLite + file upload không mất khi redeploy).

## Cấu trúc thư mục

```
quantum-portal/
├── backend/            # Express API + Socket.IO + SQLite
│   └── src/
│       ├── db/         # schema + script seed admin
│       ├── middleware/ # JWT auth
│       ├── routes/     # auth, games, scores, friends, chat, admin
│       └── server.js
├── frontend/           # React (Vite) SPA
│   └── src/
│       ├── pages/       Home, Login, Register, Publish, Play, Settings, Friends, Chat, Admin
│       ├── components/  Navbar, GameCard, CodeEditor
│       ├── context/     AuthContext
│       └── lib/         api.js, socket.js, gameRunner.js
└── render.yaml
```

## Chạy thử ở máy local

### 1. Backend

```bash
cd backend
cp .env.example .env     # rồi chỉnh JWT_SECRET, ADMIN_USERNAME, ADMIN_PASSWORD nếu muốn
npm install
npm run seed:admin       # tạo tài khoản admin
npm start                # chạy tại http://localhost:4000
```

### 2. Frontend (chế độ phát triển, hot-reload)

```bash
cd frontend
npm install
npm run dev               # chạy tại http://localhost:5173, tự proxy /api sang :4000
```

Mở `http://localhost:5173` để dùng giao diện; API và Socket.IO tự động được proxy
tới backend tại cổng 4000 (xem `frontend/vite.config.js`).

### 3. Build & chạy như production (1 service duy nhất)

```bash
cd frontend && npm run build
cd ../backend && rm -rf public && cp -r ../frontend/dist public
npm start
```

Giờ mở `http://localhost:4000` — backend vừa phục vụ API vừa phục vụ giao diện React.

## Tài khoản Admin

Script `npm run seed:admin` (trong `backend/`) tạo hoặc cập nhật tài khoản admin dựa
trên biến môi trường:

```
ADMIN_USERNAME=QuantumPortalGameADMIN12345678
ADMIN_PASSWORD=Tunglaihoclaptrinhmobile@142010ADMINQUANTUMPORTAL
```

Mật khẩu **không** được lưu dạng chữ thường (plaintext) trong database — nó được hash
bằng bcrypt trước khi ghi vào SQLite. File `.env.example` có sẵn 2 giá trị trên làm mặc
định để bạn dùng ngay, nhưng vì lý do bảo mật:

- **Không commit file `.env` thật** (đã có trong `.gitignore`).
- Khi deploy lên Render, đặt `ADMIN_USERNAME` / `ADMIN_PASSWORD` trực tiếp trong mục
  Environment của dashboard (đã cấu hình `sync: false` trong `render.yaml` để không bị
  đẩy lên Git).
- Nên đổi mật khẩu admin sau lần đăng nhập đầu tiên (trang Cài Đặt → Đổi Mật Khẩu),
  vì mật khẩu bạn cung cấp đã xuất hiện trong tin nhắn này — coi như không còn bí mật.

## Deploy lên Render

1. Đẩy thư mục này lên một Git repo (GitHub/GitLab).
2. Trên Render: **New → Blueprint**, trỏ vào repo, Render sẽ đọc `render.yaml` và tự
   tạo 1 Web Service.
3. Trong tab Environment của service, điền `ADMIN_USERNAME` và `ADMIN_PASSWORD` (giá
   trị bạn muốn dùng thật) — `JWT_SECRET` đã được Render tự sinh ngẫu nhiên.
4. Deploy. `buildCommand` sẽ build React rồi copy `dist/` vào `backend/public`;
   `startCommand` sẽ chạy `seed:admin` (an toàn để chạy lại nhiều lần) rồi khởi động
   server.
5. Ổ đĩa bền (`/data`, 1GB) được gắn để file SQLite và ảnh upload không mất sau mỗi lần
   redeploy. Muốn dùng Postgres thay vì SQLite khi lượng dữ liệu lớn hơn, hãy nói để
   mình chuyển sang `pg` + Render Postgres.

## Cách một game tích hợp tính năng portal

Trong file JS của game (chạy trong iframe), có sẵn 2 API toàn cục:

```js
// Lưu điểm số của người chơi hiện tại lên bảng xếp hạng
window.QuantumSDK.submitScore(1234);

// Chỉ dùng khi bật "chơi online nhiều người" lúc đăng game
window.QuantumMultiplayer.join('phong-vip-01');
window.QuantumMultiplayer.send({ x: 10, y: 20 }); // gửi trạng thái tới người chơi khác trong phòng
window.QuantumMultiplayer.onMessage((msg) => {
  if (msg.type === 'state') console.log('Trạng thái đối thủ:', msg.payload);
});
```

## Việc nên làm tiếp theo (gợi ý, chưa làm trong bản này)

- Thêm rate limiting cho `/api/auth/*` để chống brute-force đăng nhập.
- Thêm xác thực email hoặc CAPTCHA khi đăng ký nếu mở public.
- Chuyển từ SQLite sang PostgreSQL nếu portal phát triển nhiều người dùng đồng thời.
- Thêm gói Dev trả phí thật (Stripe) thay vì miễn phí như hiện tại.
- Kiểm duyệt nội dung game trước khi hiển thị công khai (hiện tại publish là hiện ngay).
