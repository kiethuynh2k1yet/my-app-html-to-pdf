
import { NextRequest, NextResponse } from "next/server";
import { chromium, Browser } from "playwright";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_HTML_SIZE = 10 * 1024 * 1024;

const DEFAULT_WIDTH = 794;
const DEFAULT_HEIGHT = 1123;

const MAX_VIEWPORT_WIDTH = 10000;
const MAX_VIEWPORT_HEIGHT = 10000;

// 96 CSS pixels = 1 inch = 25.4 mm
const pxToMm = (px: number) => (px * 25.4) / 96;

export async function POST(request: NextRequest) {
  let browser: Browser | null = null;

  try {
    console.log("[PDF] Receiving request...");

    // Đọc request body duy nhất một lần.
    const body = await request.json();

    const html = body?.html;
    const fileName = body?.fileName || "export";

    const previewWidth = Number(body?.previewWidth);
    const previewHeight = Number(body?.previewHeight);

    // Kiểm tra HTML.
    if (!html || typeof html !== "string") {
      return NextResponse.json(
        { message: "HTML không hợp lệ hoặc đang bị trống." },
        { status: 400 },
      );
    }

    // Kiểm tra dung lượng HTML.
    if (Buffer.byteLength(html, "utf8") > MAX_HTML_SIZE) {
      return NextResponse.json(
        { message: "Dung lượng HTML vượt quá 10MB." },
        { status: 413 },
      );
    }

    // Lấy kích thước Preview từ frontend.
    const viewportWidth = Math.min(
      MAX_VIEWPORT_WIDTH,
      Math.max(
        1,
        Number.isFinite(previewWidth)
          ? Math.ceil(previewWidth)
          : DEFAULT_WIDTH,
      ),
    );

    const viewportHeight = Math.min(
      MAX_VIEWPORT_HEIGHT,
      Math.max(
        1,
        Number.isFinite(previewHeight)
          ? Math.ceil(previewHeight)
          : DEFAULT_HEIGHT,
      ),
    );

    console.log("[PDF] Preview viewport:", {
      width: viewportWidth,
      height: viewportHeight,
    });

    // Khởi chạy Chromium.
    console.log("[PDF] Starting Chromium...");

    browser = await chromium.launch({
      headless: true,
      timeout: 30000,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
    });

    console.log("[PDF] Chromium started successfully!");

    // Tạo page với kích thước giống Preview.
    const page = await browser.newPage({
      viewport: {
        width: viewportWidth,
        height: viewportHeight,
      },
      deviceScaleFactor: 1,
    });

    page.setDefaultTimeout(15000);

    // Theo dõi lỗi JavaScript.
    page.on("pageerror", (error) => {
      console.error("[PDF] Page error:", error.message);
    });

    page.on("console", (message) => {
      if (message.type() === "error") {
        console.error("[PDF] Browser console:", message.text());
      }
    });

    // Chặn truy cập file local và javascript URL.
    await page.route("**/*", async (route) => {
      const url = route.request().url();

      if (
        url.startsWith("file:") ||
        url.startsWith("javascript:")
      ) {
        await route.abort();
        return;
      }

      await route.continue();
    });

    // Giữ chế độ CSS giống Preview.
    await page.emulateMedia({
      media: "screen",
    });

    // Render HTML và chờ tài nguyên tải xong.
    console.log("[PDF] Setting HTML content...");

    await page.setContent(html, {
      waitUntil: "load",
      timeout: 30000,
    });

    console.log("[PDF] HTML loaded.");

    // Chờ JavaScript có thời gian thực thi.
    await page.waitForTimeout(500);

    // Chờ font tải xong.
    console.log("[PDF] Waiting for fonts...");

    await page.evaluate(async () => {
      await Promise.race([
        document.fonts.ready,
        new Promise<void>((resolve) =>
          setTimeout(resolve, 10000),
        ),
      ]);
    });

    // Chờ hình ảnh tải và giải mã.
    console.log("[PDF] Waiting for images...");

    await page.evaluate(async () => {
      const images = Array.from(document.images);

      await Promise.race([
        Promise.all(
          images.map(async (img) => {
            if (!img.complete) {
              await new Promise<void>((resolve) => {
                img.addEventListener("load", () => resolve(), {
                  once: true,
                });

                img.addEventListener("error", () => resolve(), {
                  once: true,
                });
              });
            }

            if (img.decode) {
              try {
                await img.decode();
              } catch {
                // Bỏ qua ảnh không giải mã được.
              }
            }
          }),
        ),
        new Promise<void>((resolve) =>
          setTimeout(resolve, 10000),
        ),
      ]);
    });

    // Chờ layout và JavaScript cập nhật DOM hoàn tất.
    await page.evaluate(
      () =>
        new Promise<void>((resolve) => {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => resolve());
          });
        }),
    );

    console.log("[PDF] Measuring content dimensions...");

    // Đo kích thước toàn bộ nội dung HTML.
    const dimensions = await page.evaluate(() => {
      const htmlElement = document.documentElement;
      const bodyElement = document.body;

      const width = Math.ceil(
        Math.max(
          htmlElement.scrollWidth,
          htmlElement.offsetWidth,
          htmlElement.clientWidth,
          bodyElement?.scrollWidth || 0,
          bodyElement?.offsetWidth || 0,
          bodyElement?.clientWidth || 0,
        ),
      );

      const height = Math.ceil(
        Math.max(
          htmlElement.scrollHeight,
          htmlElement.offsetHeight,
          htmlElement.clientHeight,
          bodyElement?.scrollHeight || 0,
          bodyElement?.offsetHeight || 0,
          bodyElement?.clientHeight || 0,
        ),
      );

      return {
        width: Math.max(width, 1),
        height: Math.max(height, 1),
      };
    });

    console.log("[PDF] Content dimensions:", dimensions);

    // Cộng thêm 10px chiều rộng.
    const pdfWidth = pxToMm(dimensions.width);
    const pdfHeight = pxToMm(dimensions.height);

    console.log("[PDF] Custom PDF dimensions:", {
      width: `${pdfWidth.toFixed(2)}mm`,
      height: `${pdfHeight.toFixed(2)}mm`,
    });

    // Giữ màu sắc và CSS gần với Preview.
    await page.addStyleTag({
      content: `
        *,
        *::before,
        *::after {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
        }

        img,
        svg,
        canvas,
        video {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        @page {
          size: ${pdfWidth}mm ${pdfHeight}mm;
          margin: 0;
        }
      `,
    });

    // Chờ CSS và layout cập nhật.
    await page.evaluate(
      () =>
        new Promise<void>((resolve) => {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => resolve());
          });
        }),
    );

    console.log("[PDF] Generating PDF...");

    // Xuất PDF theo kích thước nội dung thực tế.
    const pdfBuffer = await page.pdf({
      width: `${pdfWidth}mm`,
      height: `${pdfHeight}mm`,
      printBackground: true,
      preferCSSPageSize: false,
      displayHeaderFooter: false,
      margin: {
        top: "0mm",
        right: "0mm",
        bottom: "0mm",
        left: "0mm",
      },
      scale: 1,
    });

    console.log("[PDF] PDF generated successfully!");

    // Làm sạch tên file.
    const safeFileName = String(fileName)
      .replace(/\.pdf$/i, "")
      .replace(/[<>:"/\\|?*\x00-\x1F]/g, "_")
      .trim() || "export";

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${safeFileName}.pdf"`,
        "Content-Length": String(pdfBuffer.length),
      },
    });
  } catch (error) {
    console.error("[PDF] Export error:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Không thể xuất PDF.";

    return NextResponse.json(
      {
        message: "Xuất PDF thất bại.",
        detail: message,
      },
      { status: 500 },
    );
  } finally {
    if (browser) {
      console.log("[PDF] Closing Chromium...");

      try {
        await browser.close();
      } catch (error) {
        console.error("[PDF] Browser close error:", error);
      }
    }
  }
}
