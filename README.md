# Turtle App — Build Tailwind CSS chuẩn (thay CDN)

Trước đây app dùng `<script src="https://cdn.tailwindcss.com">` — tiện để xem nhanh
nhưng trình duyệt cảnh báo **"should not be used in production"** vì nó phải tính
toán lại toàn bộ CSS mỗi lần tải trang, rất chậm khi có nhiều người dùng thật.

Cấu trúc trong thư mục này đã chuyển sang **Tailwind CLI** — build sẵn 1 file CSS
tối ưu, không còn cảnh báo, tải nhanh hơn nhiều.

## Cấu trúc

```
turtle-app/
├── index.html          # Giao diện chính (đã bỏ CDN, chỉ còn <link> tới CSS đã build)
├── script.js           # Toàn bộ logic JS (trước đây nằm inline trong index.html)
├── tailwind.config.js  # Cấu hình màu brand, borderRadius... (trước đây là tailwind.config inline)
├── src/
│   └── input.css       # File nguồn Tailwind (@tailwind base/components/utilities + animation tùy chỉnh)
├── dist/
│   └── output.css      # File CSS ĐÃ BUILD — được sinh ra khi bạn chạy lệnh build (chưa có sẵn)
└── package.json
```

## Cách chạy (cần Node.js đã cài sẵn trên máy bạn)

```bash
cd turtle-app
npm install          # cài Tailwind CLI
npm run build        # build 1 lần ra dist/output.css (bản minify, dùng để deploy)
```

Sau đó mở `index.html` bằng trình duyệt (hoặc `npm run serve` để chạy qua server local) —
sẽ không còn cảnh báo Tailwind CDN nữa.

### Khi đang chỉnh sửa giao diện (dev)

Chạy lệnh này ở 1 terminal riêng, để mở, mỗi lần bạn sửa class Tailwind trong
`index.html` hoặc `script.js` thì `dist/output.css` tự build lại:

```bash
npm run watch
```

## Lưu ý quan trọng

- Toàn bộ giao diện, logic, dữ liệu (localStorage), Spaced Repetition, Streak... **giữ nguyên 100%**,
  chỉ thay đổi cách nạp CSS. Không có tính năng nào bị ảnh hưởng.
- Icon `lucide` vẫn dùng qua CDN (`unpkg.com/lucide`) — cái đó **không** gây cảnh báo,
  nên không cần đổi.
- Nếu muốn deploy lên hosting thật (Vercel, Netlify, GitHub Pages...), chỉ cần
  `npm run build` rồi upload nguyên thư mục này (đã có `dist/output.css`).
