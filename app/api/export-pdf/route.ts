import { NextRequest, NextResponse } from "next/server";
import { chromium } from "playwright";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_HTML_SIZE = 10 * 1024 * 1024;

function sanitizeFileName(name: string): string {
  return (
    name
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 80) || "document"
  );
}

export async function POST(request: NextRequest) {
  let browser;

  try {
    // 1. Kiểm tra Content-Type
    const contentType = request.headers.get("content-type") || "";

    if (!contentType.includes("application/json")) {
      return NextResponse.json(
        { success: false, message: "Content-Type phải là application/json" },
        { status: 415 }
      );
    }

    // 2. Đọc dữ liệu
    const body = await request.json();

    const html = body?.html;
    const fileName = sanitizeFileName(
      typeof body?.fileName === "string" ? body.fileName : "document"
    );

    if (typeof html !== "string" || !html.trim()) {
      return NextResponse.json(
        { success: false, message: "Nội dung HTML không được để trống." },
        { status: 400 }
      );
    }

    if (Buffer.byteLength(html, "utf8") > MAX_HTML_SIZE) {
      return NextResponse.json(
        { success: false, message: "HTML vượt quá giới hạn 10 MB." },
        { status: 413 }
      );
    }

    // 3. Khởi chạy Chromium
    browser = await chromium.launch({
      headless: true,
    });

    const page = await browser.newPage({
      viewport: {
        width: 794,
        height: 1123,
      },
      deviceScaleFactor: 1,
    });

    // Không thực thi JavaScript trong HTML được nhập
    await page.setJavaScriptEnabled(false);

    // Chặn truy cập mạng từ HTML nhập vào.
    // Nếu HTML cần ảnh/font online, cần thiết kế whitelist riêng.
    await page.route("**/*", async (route) => {
      const url = route.request().url();

      if (!url.startsWith("data:") && !url.startsWith("blob:") &&
          !url.startsWith("about:")) {
        await route.abort();
        return;
      }

      await route.continue();
    });

    // 4. Render HTML
    await page.setContent(html, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    // 5. Đợi font và hình ảnh tải xong
    await page.evaluate(async () => {
      if ("fonts" in document) {
        await document.fonts.ready;
      }

      const images = Array.from(document.images);

      await Promise.all(
        images.map((image) => {
          if (image.complete) return Promise.resolve();

          return new Promise<void>((resolve) => {
            image.addEventListener("load", () => resolve(), { once: true });
            image.addEventListener("error", () => resolve(), { once: true });
          });
        })
      );
    });

    // 6. Chuyển sang chế độ in
    await page.emulateMedia({ media: "print" });

    // 7. Xuất PDF A4
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: false,
      displayHeaderFooter: false,
      margin: {
        top: "10mm",
        right: "10mm",
        bottom: "10mm",
        left: "10mm",
      },
    });

    // 8. Đóng Chromium
    await browser.close();
    browser = undefined;

    // 9. Trả file PDF
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}.pdf"`,
        "Content-Length": String(pdfBuffer.byteLength),
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[EXPORT PDF ERROR]", error);

    if (browser) {
      await browser.close().catch(() => undefined);
    }

    const message =
      error instanceof Error ? error.message : "Lỗi không xác định";

    return NextResponse.json(
      {
        success: false,
        message: "Không thể xuất PDF.",
        detail: message,
      },
      { status: 500 }
    );
  }
}

// API kiểm tra trạng thái
export async function GET() {
  return NextResponse.json({
    success: true,
    message: "PDF Export API is running.",
  });
}
