# CodePic

> Một dự án web nhỏ chứa `index.html`, `app.js` và `app.css` dùng để trình diễn hoặc thử nghiệm nhanh các ý tưởng front-end.

## Mục đích

`CodePic` là một template đơn giản để trình diễn ảnh/khung vẽ hoặc làm mẫu nhỏ cho các thử nghiệm giao diện frontend. Dự án không cần build step — chỉ cần mở file HTML trong trình duyệt hoặc phục vụ bằng một HTTP server tĩnh.

## Nội dung thư mục

- `index.html` — trang HTML chính.
- `app.js` — mã JavaScript của ứng dụng.
- `app.css` — style cho ứng dụng.

## Chạy nhanh (Quick start)

Có hai cách đơn giản để chạy dự án:

1. Mở trực tiếp

   Mở `index.html` trong trình duyệt (double-click hoặc `File -> Open`). Một vài tính năng có thể yêu cầu HTTP (ví dụ: tải ảnh từ file hệ thống) — nếu vậy, dùng cách thứ hai.

2. Phục vụ tệp tĩnh bằng một HTTP server local

   - Với Python 3 (cách nhanh nhất):

     ```bash
     python3 -m http.server 8000
     ```

     Sau đó mở http://localhost:8000/ trong trình duyệt.

   - Hoặc dùng một dev server khác (ví dụ `live-server`, `http-server`, v.v.).

## Phát triển

- Chỉnh sửa `app.js` và `app.css`. Tải lại trang để xem thay đổi.
- Nếu muốn thêm hệ thống build (Webpack, Vite...), tạo `package.json` và cấu hình tương ứng.