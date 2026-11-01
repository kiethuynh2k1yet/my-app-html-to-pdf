"use client";

import { useState } from "react";

import {
  Container,
  DownloadIcon,
  ExportButton,
  Message,
  MessageIcon,
  Spinner,
} from "./styles";

interface ExportPDFProps {
  html: string;
  fileName: string;
  previewFrame: HTMLIFrameElement | null;
  previewSize: {
    width: number;
    height: number;
  };
}

const MAX_CANVAS_DIMENSION = 32767;
const MAX_CANVAS_PIXELS = 40_000_000;
const MAX_PDF_PAGE_HEIGHT = 18_000;

/* =========================================
   WAIT FOR PREVIEW ASSETS
========================================= */

async function waitForPreviewAssets(doc: Document): Promise<void> {
  // Wait for images.
  await Promise.all(
    Array.from(doc.images).map(async (image) => {
      if (!image.complete) {
        await new Promise<void>((resolve) => {
          image.addEventListener("load", () => resolve(), {
            once: true,
          });

          image.addEventListener("error", () => resolve(), {
            once: true,
          });
        });
      }

      if (image.complete && image.naturalWidth > 0) {
        try {
          await image.decode();
        } catch {
          // Ignore image decode errors.
        }
      }
    }),
  );

  // Wait for fonts.
  try {
    await doc.fonts.ready;
  } catch (error) {
    console.warn("[PDF] Font loading warning:", error);
  }
}

/* =========================================
   GET CONTENT HEIGHT
========================================= */

/**
 * Calculate the actual content height.
 * Avoid using body.scrollHeight directly because
 * it can include the iframe's empty viewport area.
 */
function getContentHeight(doc: Document): number {
  const body = doc.body;
  const html = doc.documentElement;
  const win = doc.defaultView;

  if (!body || !html || !win) {
    return 0;
  }

  const htmlRect = html.getBoundingClientRect();
  const bodyRect = body.getBoundingClientRect();
  const contentTop = Math.min(bodyRect.top, htmlRect.top);
  let maxBottom = contentTop;

  // Measure all elements inside body.
  const elements = Array.from(body.querySelectorAll("*"));

  elements.forEach((element) => {
    const style = win.getComputedStyle(element);

    // Ignore fixed elements because they are not part
    // of the normal document flow.
    if (style.position === "fixed") {
      return;
    }

    const rect = element.getBoundingClientRect();

    maxBottom = Math.max(maxBottom, rect.bottom);
  });

  return Math.max(1, Math.ceil(maxBottom - contentTop));
}

function getDocumentBackgroundColor(doc: Document): string {
  const win = doc.defaultView;

  if (!win) {
    return "#ffffff";
  }

  const backgrounds = [
    win.getComputedStyle(doc.body).backgroundColor,
    win.getComputedStyle(doc.documentElement).backgroundColor,
  ];

  return (
    backgrounds.find(
      (color) =>
        color !== "transparent" &&
        color !== "rgba(0, 0, 0, 0)",
    ) ?? "#ffffff"
  );
}

async function getPreviewFontEmbedCSS(
  doc: Document,
  getFontEmbedCSS: (
    node: HTMLElement,
    options: { preferredFontFormat: string },
  ) => Promise<string>,
): Promise<string> {
  const links = Array.from(
    doc.querySelectorAll<HTMLLinkElement>(
      'link[rel~="stylesheet"][href]',
    ),
  ).filter((link) => new URL(link.href).hostname === "fonts.googleapis.com");

  const fontStyles: string[] = [];

  for (const link of links) {
    const response = await fetch(link.href);

    if (!response.ok) {
      throw new Error(
        `Không thể tải CSS font để xuất PDF (HTTP ${response.status}).`,
      );
    }

    fontStyles.push(await response.text());
  }

  const css = fontStyles.filter((style) =>
    /@font-face\b/i.test(style),
  );

  if (!css.length) {
    return "";
  }

  const style = document.createElement("style");
  style.textContent = css.join("\n");
  document.head.appendChild(style);

  const fontProbe = document.createElement("div");
  fontProbe.style.cssText =
    "position:fixed;visibility:hidden;pointer-events:none;";

  try {
    const fontFaces = Array.from(style.sheet?.cssRules ?? []).filter(
      (rule): rule is CSSFontFaceRule =>
        rule instanceof CSSFontFaceRule,
    );
    const fontFamilies = new Set(
      fontFaces.map((fontFace) => fontFace.style.fontFamily),
    );

    fontFamilies.forEach((family) => {
      const sample = document.createElement("span");
      sample.style.fontFamily = family;
      fontProbe.appendChild(sample);
    });

    document.body.appendChild(fontProbe);

    const embeddedFonts = await getFontEmbedCSS(fontProbe, {
      preferredFontFormat: "woff2",
    });

    if (!embeddedFonts) {
      throw new Error("Không thể nhúng font vào ảnh PDF.");
    }

    return embeddedFonts;
  } finally {
    fontProbe.remove();
    style.remove();
  }
}

function getContentWidth(
  doc: Document,
  fallbackWidth: number,
): number {
  const body = doc.body;
  const html = doc.documentElement;
  const win = doc.defaultView;

  if (!body || !html || !win) {
    return Math.max(1, fallbackWidth);
  }

  const bodyRect = body.getBoundingClientRect();
  const htmlRect = html.getBoundingClientRect();
  const originLeft = Math.min(bodyRect.left, htmlRect.left);
  let maxRight = Math.max(bodyRect.right, htmlRect.right);

  Array.from(body.querySelectorAll("*")).forEach((element) => {
    const style = win.getComputedStyle(element);

    if (style.position === "fixed") {
      return;
    }

    const rect = element.getBoundingClientRect();
    const marginRight =
      element.parentElement === body
        ? Number.parseFloat(style.marginRight) || 0
        : 0;

    maxRight = Math.max(maxRight, rect.right + marginRight);
  });

  const bodyStyle = win.getComputedStyle(body);
  const paddingRight =
    Number.parseFloat(bodyStyle.paddingRight) || 0;
  const marginRight =
    Number.parseFloat(bodyStyle.marginRight) || 0;

  return Math.max(
    1,
    Math.ceil(
      Math.max(
        fallbackWidth,
        html.scrollWidth,
        body.scrollWidth,
        maxRight - originLeft + paddingRight + marginRight,
      ),
    ),
  );
}

async function renderSvgTile(
  svgMarkup: string,
  width: number,
  fullHeight: number,
  top: number,
  height: number,
  scale: number,
  backgroundColor: string,
): Promise<HTMLCanvasElement> {
  const svgDocument = new DOMParser().parseFromString(
    svgMarkup,
    "image/svg+xml",
  );
  const svg = svgDocument.documentElement;
  const foreignObject = svg.querySelector("foreignObject");

  if (svgDocument.querySelector("parsererror") || !foreignObject) {
    throw new Error("Không thể tạo ảnh PDF độ phân giải cao.");
  }

  svg.setAttribute("width", `${width}`);
  svg.setAttribute("height", `${height}`);
  svg.setAttribute("viewBox", `0 ${top} ${width} ${height}`);
  svg.setAttribute("preserveAspectRatio", "none");
  foreignObject.setAttribute("width", `${width}`);
  foreignObject.setAttribute("height", `${fullHeight}`);

  const image = new Image();
  image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
    new XMLSerializer().serializeToString(svg),
  )}`;
  await image.decode();

  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(width * scale);
  canvas.height = Math.ceil(height * scale);

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Không thể tạo Canvas để xuất PDF.");
  }

  context.fillStyle = backgroundColor;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  return canvas;
}

/* =========================================
   EXPORT PDF
========================================= */

export default function ExportPDF({
  html = "",
  fileName = "export",
  previewFrame = null,
  previewSize = { width: 794, height: 1123 },
}: ExportPDFProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleExport = async () => {
    if (loading) return;

    setError("");
    setSuccess("");

    if (!html.trim()) {
      setError("Preview chưa sẵn sàng. Vui lòng chờ nội dung được render.");
      return;
    }

    if (!previewFrame) {
      setError("Không tìm thấy iframe Preview để xuất PDF.");
      return;
    }
    const originalFrameWidth = previewFrame.style.width;
    let exportLayoutStyle: HTMLStyleElement | null = null;
    let viewportMeta: HTMLMetaElement | null = null;
    let originalViewportContent: string | null = null;

    try {
      setLoading(true);

      const previewDocument = previewFrame.contentDocument;

      if (
        !previewDocument?.documentElement ||
        !previewDocument.body
      ) {
        throw new Error("Không thể đọc nội dung iframe Preview.");
      }

      // Wait for images and fonts.
      await waitForPreviewAssets(previewDocument);

      // Include content that overflows the iframe's visible width.
      const previewWidth = getContentWidth(
        previewDocument,
        previewFrame.clientWidth || previewSize.width,
      );

      // Reflow the document to the PDF width before capturing it.
      previewFrame.style.width = `${previewWidth}px`;
      viewportMeta =
        previewDocument.querySelector<HTMLMetaElement>(
          'meta[name="viewport"]',
        );
      originalViewportContent = viewportMeta?.content ?? null;

      if (viewportMeta) {
        viewportMeta.content = `width=${previewWidth}, initial-scale=1`;
      }

      exportLayoutStyle = previewDocument.createElement("style");
      exportLayoutStyle.textContent =
        [
          "#lanes .lc-head > span { white-space: nowrap !important; }",
          ".toolbar .chip { flex: 0 0 auto !important; white-space: nowrap !important; }",
          "nav.toc a { flex: 0 0 auto !important; white-space: nowrap !important; }",
        ].join("\n");
      previewDocument.head.appendChild(exportLayoutStyle);

      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => resolve());
        });
      });

      // Get actual content height instead of iframe height.
      const previewHeight = getContentHeight(previewDocument);

      if (previewWidth <= 0 || previewHeight <= 0) {
        throw new Error("Kích thước nội dung Preview không hợp lệ.");
      }

      if (previewWidth > MAX_PDF_PAGE_HEIGHT) {
        throw new Error(
          "Chiều rộng nội dung vượt giới hạn của một trang PDF.",
        );
      }

      console.log("[PDF] Preview dimensions:", {
        width: previewWidth,
        height: previewHeight,
      });

      // Calculate canvas scale.
      const requestedScale = Math.min(
        3,
        MAX_CANVAS_DIMENSION / previewWidth,
      );

      const scale = Math.min(
        requestedScale,
        MAX_CANVAS_DIMENSION / previewHeight,
        Math.sqrt(
          MAX_CANVAS_PIXELS / (previewWidth * previewHeight),
        ),
      );

      if (!Number.isFinite(scale) || scale <= 0) {
        throw new Error(
          "Không thể xác định độ phân giải phù hợp để xuất PDF.",
        );
      }

      // Import libraries.
      const [{ getFontEmbedCSS, toCanvas, toSvg }, { jsPDF }] =
        await Promise.all([
          import("html-to-image"),
          import("jspdf/dist/jspdf.es.min.js"),
        ]);

      const fontEmbedCSS = await getPreviewFontEmbedCSS(
        previewDocument,
        getFontEmbedCSS,
      );
      const backgroundColor =
        getDocumentBackgroundColor(previewDocument);
      const renderOptions = {
        backgroundColor,
        width: previewWidth,
        height: previewHeight,
        cacheBust: true,
        fontEmbedCSS,
        style: {
          width: `${previewWidth}px`,
          height: `${previewHeight}px`,
          minHeight: `${previewHeight}px`,
          margin: "0",
          overflow: "hidden",
        },
      };

      // Sanitize filename.
      const safeFileName =
        fileName
          .replace(/\.pdf$/i, "")
          .replace(/[<>:"/\\|?*\x00-\x1F]/g, "_")
          .trim() || "export";

      const firstPageHeight = Math.min(
        previewHeight,
        MAX_PDF_PAGE_HEIGHT,
      );
      const pageOrientation =
        previewWidth > firstPageHeight ? "landscape" : "portrait";

      // Keep page dimensions below jsPDF's 14400-point limit.
      const pdf = new jsPDF({
        compress: true,
        format: [previewWidth, firstPageHeight],
        hotfixes: ["px_scaling"],
        orientation: pageOrientation,
        unit: "px",
      });

      if (scale < requestedScale) {
        const svgDataUrl = await toSvg(
          previewDocument.documentElement,
          renderOptions,
        );
        const svgMarkup = decodeURIComponent(
          svgDataUrl.slice(svgDataUrl.indexOf(",") + 1),
        );
        const tileHeight = Math.floor(
          Math.min(
            MAX_CANVAS_DIMENSION / requestedScale,
            MAX_CANVAS_PIXELS /
              (previewWidth * requestedScale * requestedScale),
          ),
        );

        if (tileHeight <= 0) {
          throw new Error("Kích thước nội dung quá lớn để xuất PDF.");
        }

        const pageCount = Math.ceil(
          previewHeight / MAX_PDF_PAGE_HEIGHT,
        );

        for (let pageIndex = 0; pageIndex < pageCount; pageIndex += 1) {
          const pageTop = pageIndex * MAX_PDF_PAGE_HEIGHT;
          const pageHeight = Math.min(
            MAX_PDF_PAGE_HEIGHT,
            previewHeight - pageTop,
          );

          if (pageIndex > 0) {
            pdf.addPage(
              [previewWidth, pageHeight],
              previewWidth > pageHeight ? "landscape" : "portrait",
            );
          }

          for (let pageOffset = 0; pageOffset < pageHeight; pageOffset += tileHeight) {
            const height = Math.min(tileHeight, pageHeight - pageOffset);
            const tile = await renderSvgTile(
              svgMarkup,
              previewWidth,
              previewHeight,
              pageTop + pageOffset,
              height,
              requestedScale,
              backgroundColor,
            );

            pdf.addImage(
              tile,
              "PNG",
              0,
              pageOffset,
              previewWidth,
              height,
              undefined,
              "FAST",
            );

            tile.width = 0;
            tile.height = 0;
          }
        }
      } else {
        const canvas = await toCanvas(
          previewDocument.documentElement,
          {
            ...renderOptions,
            pixelRatio: scale,
          },
        );

        if (!canvas.width || !canvas.height) {
          throw new Error("Không thể tạo Canvas từ Preview.");
        }

        pdf.addImage(
          canvas,
          "PNG",
          0,
          0,
          previewWidth,
          previewHeight,
          undefined,
          "FAST",
        );
      }

      const expectedPageCount = Math.ceil(
        previewHeight / MAX_PDF_PAGE_HEIGHT,
      );

      if (pdf.getNumberOfPages() !== expectedPageCount) {
        throw new Error("Số trang PDF xuất ra không khớp nội dung.");
      }

      const blob = pdf.output("blob");

      if (blob.size === 0) {
        throw new Error("File PDF không có dữ liệu.");
      }

      // Download PDF.
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `${safeFileName}.pdf`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 60000);

      setSuccess("Xuất PDF thành công.");
    } catch (exportError) {
      console.error("[PDF] Export error:", exportError);

      setError(
        exportError instanceof Error
          ? exportError.message
          : "Xuất PDF thất bại.",
      );
    } finally {
      exportLayoutStyle?.remove();

      if (viewportMeta && originalViewportContent !== null) {
        viewportMeta.content = originalViewportContent;
      }

      previewFrame.style.width = originalFrameWidth;
      setLoading(false);
    }
  };

  return (
    <Container>
      <ExportButton
        type="button"
        onClick={handleExport}
        disabled={loading || !html.trim()}
      >
        {loading ? (
          <>
            <Spinner aria-hidden="true" />
            Đang xuất PDF...
          </>
        ) : (
          <>
            <DownloadIcon aria-hidden="true" />
            Xuất PDF
          </>
        )}
      </ExportButton>

      {error && (
        <Message $type="error" role="alert">
          <MessageIcon>!</MessageIcon>
          <span>{error}</span>
        </Message>
      )}

      {success && (
        <Message $type="success" role="status">
          <MessageIcon>✓</MessageIcon>
          <span>{success}</span>
        </Message>
      )}
    </Container>
  );
}