<div align="center">

# HTML → PDF Converter
**Chuyển tài liệu HTML thành PDF ngay trên trình duyệt.**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-149eca?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript)](https://www.typescriptlang.org/)

**Nhập HTML · Xem trước · Xuất PDF**

</div>

---

## Tính năng
- Nhập một file `.html` / `.htm` hoặc chọn cả thư mục dự án.
- Tự đóng gói CSS, CSS `@import`, hình ảnh, font, SVG và một số tài nguyên media cục bộ.
- Xem Raw HTML và Preview ngay trong ứng dụng.
- Chờ ảnh và font tải xong trước khi xuất.
- Xuất PDF theo kích thước nội dung Preview, hỗ trợ nội dung dài nhiều trang.
- Xử lý hoàn toàn trong trình duyệt, không cần API backend.
- Giới hạn nhập: **50 MB** cho một file hoặc tổng các file trong thư mục.

## Sử dụng
1. Chọn **Chọn file HTML** nếu không cần tài nguyên bên ngoài.
2. Chọn **Chọn thư mục** nếu HTML tham chiếu đến CSS, ảnh, font hoặc tài nguyên cục bộ. Nếu có `index.html`, ứng dụng sẽ ưu tiên file này.
3. Kiểm tra Raw HTML và Preview.
4. Khi Preview sẵn sàng, nhấn **Xuất PDF** để tải xuống.

> Tài nguyên cục bộ chỉ được nhúng khi bạn nhập thư mục chứa chúng. Tài nguyên từ xa phụ thuộc vào khả năng truy cập và chính sách CORS của máy chủ nguồn.

## Bắt đầu
Cần Node.js, npm và trình duyệt hiện đại.

```bash
git clone https://github.com/<your-username>/<your-repository>.git
cd <your-repository>
npm install
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000).

| Lệnh | Mô tả |
| --- | --- |
| `npm run dev` | Chạy máy chủ phát triển. |
| `npm run lint` | Kiểm tra mã nguồn bằng ESLint. |
| `npm run build` | Tạo bản build production. |
| `npm run start` | Chạy bản production đã build. |

## Công nghệ
- [Next.js 16](https://nextjs.org/) và [React 19](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [styled-components](https://styled-components.com/)
- [html-to-image](https://github.com/bubkoo/html-to-image) — kết xuất nội dung HTML thành ảnh
- [jsPDF](https://github.com/parallax/jsPDF) — tạo và tải PDF
## Giới hạn
- Trình duyệt chỉ đọc được thư mục bạn chủ động chọn.
- Tài nguyên bên ngoài có thể không tải được do mạng, xác thực hoặc CORS.
- Nội dung phụ thuộc JavaScript hoặc API đặc thù có thể hiển thị khác trang gốc; PDF được tạo từ nội dung đã render trong Preview.
- Nội dung rất lớn có thể bị giới hạn bởi bộ nhớ và khả năng kết xuất của trình duyệt.

## Đóng góp
Mở issue để báo lỗi hoặc đề xuất tính năng, hoặc gửi pull request. Trước khi gửi thay đổi, hãy chạy:

```bash
npm run lint
npm run build
```

## Giấy phép
Chưa có thông tin giấy phép được khai báo trong repository.
