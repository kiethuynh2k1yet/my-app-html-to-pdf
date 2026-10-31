"use client";

import {
  ChangeEvent,
  InputHTMLAttributes,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Container,
  Header,
  Title,
  UploadArea,
  UploadText,
  UploadActions,
  UploadButton,
  FileInfo,
  FileName,
  RemoveButton,
  PreviewContainer,
  PreviewTitle,
  PreviewFrame,
  ErrorMessage,
  LoadingMessage,
  PreviewDescription,
  RawHTML,
} from "./styles";

interface PreviewSize {
  width: number;
  height: number;
}

interface ImportHTMLProps {
  html: string;
  fileName: string;
  onImport: (html: string, fileName: string) => void;
  onRemove: () => void;
  onRenderedHTML: (html: string) => void;
  onPreviewSize?: (size: PreviewSize) => void;
}

const MAX_TOTAL_SIZE = 50 * 1024 * 1024;
const MIN_PREVIEW_HEIGHT = 500;
const MAX_PREVIEW_HEIGHT = 100000;

export default function ImportHTML({
  html,
  fileName,
  onImport,
  onRemove,
  onRenderedHTML,
  onPreviewSize,
}: ImportHTMLProps) {
  const htmlInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const previewFrameRef = useRef<HTMLIFrameElement>(null);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [previewHeight, setPreviewHeight] = useState(800);

  /*
   * Gửi kích thước thực tế của Preview iframe lên component cha.
   */
  const sendPreviewSize = useCallback(() => {
    const iframe = previewFrameRef.current;

    if (!iframe) return;

    const width = iframe.clientWidth;
    const height = iframe.clientHeight;

    if (width <= 0 || height <= 0) return;

    onPreviewSize?.({
      width,
      height,
    });

    console.log("[PREVIEW SIZE]", {
      width,
      height,
    });
  }, [onPreviewSize]);

  /*
   * Theo dõi kích thước iframe.
   */
  useEffect(() => {
    const iframe = previewFrameRef.current;

    if (!iframe || !html) return;

    const observer = new ResizeObserver(() => {
      sendPreviewSize();
    });

    observer.observe(iframe);

    window.addEventListener("resize", sendPreviewSize);

    sendPreviewSize();

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", sendPreviewSize);
    };
  }, [html, previewHeight, sendPreviewSize]);

  /*
   * Nhận chiều cao từ iframe Preview.
   */
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.source !== previewFrameRef.current?.contentWindow) {
        return;
      }

      const data = event.data;

      if (data?.type !== "HTML_PREVIEW_HEIGHT") {
        return;
      }

      const height = Number(data.height);

      if (!Number.isFinite(height)) return;

      setPreviewHeight(
        Math.max(
          MIN_PREVIEW_HEIGHT,
          Math.min(height + 30, MAX_PREVIEW_HEIGHT),
        ),
      );
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  /*
   * Import một file HTML.
   */
  const handleHTMLFile = async (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setError("");
    setLoading(true);

    try {
      if (!isHTMLFile(file)) {
        throw new Error("Vui lòng chọn file .html hoặc .htm.");
      }

      if (file.size > MAX_TOTAL_SIZE) {
        throw new Error("File HTML không được vượt quá 50 MB.");
      }

      const content = await file.text();

      const result = await makeSelfContainedHTML(
        content,
        file,
        [file],
      );

      onRenderedHTML("");
      onImport(result, removeExtension(file.name));

      setPreviewHeight(800);
    } catch (err) {
      console.error("[IMPORT HTML ERROR]", err);

      setError(
        err instanceof Error
          ? err.message
          : "Không thể đọc file HTML.",
      );
    } finally {
      setLoading(false);
      event.target.value = "";
    }
  };

  /*
   * Import toàn bộ thư mục.
   */
  const handleFolder = async (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(event.target.files ?? []);

    if (!files.length) return;

    setError("");
    setLoading(true);

    try {
      const totalSize = files.reduce(
        (total, file) => total + file.size,
        0,
      );

      if (totalSize > MAX_TOTAL_SIZE) {
        throw new Error(
          "Tổng dung lượng thư mục không được vượt quá 50 MB.",
        );
      }

      const htmlFiles = files.filter(isHTMLFile);

      if (!htmlFiles.length) {
        throw new Error("Không tìm thấy file HTML trong thư mục.");
      }

      const htmlFile =
        htmlFiles.find((file) => {
          const name = getRelativePath(file)
            .split("/")
            .pop()
            ?.toLowerCase();

          return name === "index.html";
        }) ?? htmlFiles[0];

      const content = await htmlFile.text();

      const result = await makeSelfContainedHTML(
        content,
        htmlFile,
        files,
      );

      const outputName = removeExtension(
        getRelativePath(htmlFile).split("/").pop() ??
          htmlFile.name,
      );

      onRenderedHTML("");
      onImport(result, outputName);

      setPreviewHeight(800);
    } catch (err) {
      console.error("[IMPORT FOLDER ERROR]", err);

      setError(
        err instanceof Error
          ? err.message
          : "Không thể đọc thư mục.",
      );
    } finally {
      setLoading(false);
      event.target.value = "";
    }
  };

  const handleChooseHTML = () => {
    htmlInputRef.current?.click();
  };

  const handleChooseFolder = () => {
    folderInputRef.current?.click();
  };

  const handleRemove = () => {
    if (htmlInputRef.current) {
      htmlInputRef.current.value = "";
    }

    if (folderInputRef.current) {
      folderInputRef.current.value = "";
    }

    setError("");
    setPreviewHeight(800);

    onRenderedHTML("");
    onRemove();

    onPreviewSize?.({
      width: 794,
      height: 800,
    });
  };

  /*
   * Lấy DOM thực tế đã render trong iframe.
   */
  const handlePreviewLoad = async () => {
    const iframe = previewFrameRef.current;
    const doc = iframe?.contentDocument;

    if (!doc) {
      setError("Không thể đọc nội dung Preview HTML.");
      return;
    }

    try {
      setError("");

      // Chờ font tải xong.
      if (doc.fonts) {
        await doc.fonts.ready;
      }

      // Chờ hình ảnh tải xong.
      await Promise.all(
        Array.from(doc.images).map(async (img) => {
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

          if (typeof img.decode === "function") {
            await img.decode().catch(() => undefined);
          }
        }),
      );

      // Chờ trình duyệt cập nhật layout.
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => resolve());
        });
      });

      // Đo kích thước sau khi Preview render hoàn tất.
      sendPreviewSize();

      /*
       * Clone DOM đã render.
       * Không sửa trực tiếp iframe Preview.
       */
      const clonedDocument = doc.documentElement.cloneNode(
        true,
      ) as HTMLElement;

      /*
       * Loại bỏ script đo chiều cao.
       * Giữ lại CSS gốc của tài liệu.
       */
      clonedDocument
        .querySelector("#preview-height-script")
        ?.remove();

      /*
       * Đồng bộ trạng thái input.
       */
      const originalInputs = Array.from(
        doc.querySelectorAll("input"),
      );

      const clonedInputs = Array.from(
        clonedDocument.querySelectorAll("input"),
      );

      originalInputs.forEach((input, index) => {
        const cloned = clonedInputs[index];

        if (!cloned) return;

        if (
          input.type === "checkbox" ||
          input.type === "radio"
        ) {
          cloned.checked = input.checked;

          if (input.checked) {
            cloned.setAttribute("checked", "");
          } else {
            cloned.removeAttribute("checked");
          }
        } else {
          cloned.setAttribute("value", input.value);
        }
      });

      /*
       * Đồng bộ textarea.
       */
      const originalTextareas = Array.from(
        doc.querySelectorAll("textarea"),
      );

      const clonedTextareas = Array.from(
        clonedDocument.querySelectorAll("textarea"),
      );

      originalTextareas.forEach((textarea, index) => {
        const cloned = clonedTextareas[index];

        if (cloned) {
          cloned.textContent = textarea.value;
        }
      });

      /*
       * Đồng bộ select.
       */
      const originalSelects = Array.from(
        doc.querySelectorAll("select"),
      );

      const clonedSelects = Array.from(
        clonedDocument.querySelectorAll("select"),
      );

      originalSelects.forEach((select, index) => {
        const cloned = clonedSelects[index];

        if (!cloned) return;

        Array.from(select.options).forEach(
          (option, optionIndex) => {
            const clonedOption = cloned.options[optionIndex];

            if (!clonedOption) return;

            clonedOption.selected = option.selected;

            if (option.selected) {
              clonedOption.setAttribute("selected", "");
            } else {
              clonedOption.removeAttribute("selected");
            }
          },
        );
      });

      /*
       * Đồng bộ canvas thành ảnh.
       */
      const originalCanvases = Array.from(
        doc.querySelectorAll("canvas"),
      );

      const clonedCanvases = Array.from(
        clonedDocument.querySelectorAll("canvas"),
      );

      originalCanvases.forEach((canvas, index) => {
        const clonedCanvas = clonedCanvases[index];

        if (!clonedCanvas) return;

        try {
          const image = doc.createElement("img");

          image.src = canvas.toDataURL("image/png");
          image.width = canvas.width;
          image.height = canvas.height;

          image.style.cssText = canvas.style.cssText;
          image.className = canvas.className;

          clonedCanvas.replaceWith(image);
        } catch (error) {
          console.warn(
            "Không thể chuyển canvas thành ảnh:",
            error,
          );
        }
      });

      /*
       * Đóng gói thành HTML hoàn chỉnh.
       */
      const renderedHTML =
        "<!DOCTYPE html>\n" + clonedDocument.outerHTML;

      onRenderedHTML(renderedHTML);

      // Gửi lại kích thước sau khi DOM đã được xử lý.
      sendPreviewSize();
    } catch (err) {
      console.error("[CAPTURE PREVIEW ERROR]", err);

      setError(
        "Không thể lấy nội dung HTML đã render. Vui lòng tải lại file.",
      );

      onRenderedHTML("");
    }
  };

  const previewHTML = addHeightScript(html);

  return (
    <Container>
      <Header>
        <Title>Import HTML</Title>
      </Header>

      {!html ? (
        <>
          <UploadArea>
            <UploadText>
              <strong>Import HTML + CSS + ảnh + font</strong>

              <span>
                Chọn file HTML nếu tài nguyên đã được nhúng trong HTML.
              </span>

              <span>
                Hoặc chọn toàn bộ thư mục để lấy CSS, ảnh và font đi kèm.
              </span>

              <span>Dung lượng tối đa: 50 MB.</span>
            </UploadText>

            <UploadActions>
              <UploadButton
                type="button"
                onClick={handleChooseHTML}
                disabled={loading}
              >
                Chọn file HTML
              </UploadButton>

              <UploadButton
                type="button"
                $secondary
                onClick={handleChooseFolder}
                disabled={loading}
              >
                Chọn thư mục
              </UploadButton>
            </UploadActions>

            <input
              ref={htmlInputRef}
              type="file"
              accept=".html,.htm,text/html"
              onChange={handleHTMLFile}
              hidden
            />

            <input
              ref={folderInputRef}
              type="file"
              multiple
              {...({
                webkitdirectory: "",
                directory: "",
              } as InputHTMLAttributes<HTMLInputElement>)}
              onChange={handleFolder}
              hidden
            />
          </UploadArea>

          {loading && (
            <LoadingMessage>
              Đang đọc HTML, CSS, hình ảnh và font...
            </LoadingMessage>
          )}

          {error && <ErrorMessage>{error}</ErrorMessage>}
        </>
      ) : (
        <>
          <FileInfo>
            <FileName title={fileName}>
              {fileName}
            </FileName>

            <RemoveButton
              type="button"
              onClick={handleRemove}
            >
              Xóa file
            </RemoveButton>
          </FileInfo>

          {error && <ErrorMessage>{error}</ErrorMessage>}

          <PreviewContainer>
            <PreviewTitle>
              <span>01</span>
              HTML đã import (Raw HTML)
            </PreviewTitle>

            <RawHTML>
              <code>{html}</code>
            </RawHTML>
          </PreviewContainer>

          <PreviewContainer>
            <PreviewTitle>
              <span>02</span>
              Preview HTML
            </PreviewTitle>

            <PreviewDescription>
              Bản xem trước nội dung HTML đã import.
            </PreviewDescription>

            <PreviewFrame
              ref={previewFrameRef}
              title="HTML Preview"
              srcDoc={previewHTML}
              onLoad={handlePreviewLoad}
              style={{
                height: `${previewHeight}px`,
              }}
              scrolling="no"
            />
          </PreviewContainer>
        </>
      )}
    </Container>
  );
}

/* =========================================================
   FILE HELPERS
========================================================= */

function isHTMLFile(file: File): boolean {
  return /\.html?$/i.test(file.name);
}

function removeExtension(fileName: string): string {
  return fileName.replace(/\.html?$/i, "");
}

function getRelativePath(file: File): string {
  const path =
    (
      file as File & {
        webkitRelativePath?: string;
      }
    ).webkitRelativePath || file.name;

  return path.replace(/\\/g, "/");
}

/* =========================================================
   SELF CONTAINED HTML
========================================================= */

async function makeSelfContainedHTML(
  html: string,
  htmlFile: File,
  files: File[],
): Promise<string> {
  const fileMap = new Map<string, File>();

  for (const file of files) {
    const relativePath = normalizePath(getRelativePath(file));

    fileMap.set(relativePath, file);
    fileMap.set(normalizePath(file.name), file);
  }

  const htmlPath = normalizePath(getRelativePath(htmlFile));
  const htmlDirectory = getDirectory(htmlPath);

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  if (!doc.head.querySelector("meta[charset]")) {
    const meta = doc.createElement("meta");
    meta.setAttribute("charset", "UTF-8");
    doc.head.prepend(meta);
  }

  doc.querySelectorAll("base").forEach((element) => {
    element.remove();
  });

  // Nhúng CSS external.
  const styleLinks = Array.from(
    doc.querySelectorAll('link[rel~="stylesheet"][href]'),
  );

  for (const link of styleLinks) {
    const href = link.getAttribute("href");

    if (!href) continue;

    const resourceFile = findResourceFile(
      href,
      htmlDirectory,
      fileMap,
    );

    if (!resourceFile) continue;

    const cssText = await resourceFile.text();

    const processedCSS = await processCSS(
      cssText,
      getRelativePath(resourceFile),
      fileMap,
    );

    const style = doc.createElement("style");
    style.textContent = processedCSS;

    link.replaceWith(style);
  }

  // Xử lý CSS inline.
  const styles = Array.from(doc.querySelectorAll("style"));

  for (const style of styles) {
    if (!style.textContent) continue;

    style.textContent = await processCSS(
      style.textContent,
      htmlPath,
      fileMap,
    );
  }

  // Nhúng ảnh.
  const images = Array.from(
    doc.querySelectorAll("img[src]"),
  );

  for (const image of images) {
    const src = image.getAttribute("src");

    if (!src) continue;

    const file = findResourceFile(
      src,
      htmlDirectory,
      fileMap,
    );

    if (!file) continue;

    image.setAttribute("src", await fileToDataURL(file));
  }

  // Nhúng video, audio và source.
  const mediaElements = Array.from(
    doc.querySelectorAll(
      "video[src], audio[src], source[src]",
    ),
  );

  for (const element of mediaElements) {
    const src = element.getAttribute("src");

    if (!src) continue;

    const file = findResourceFile(
      src,
      htmlDirectory,
      fileMap,
    );

    if (!file) continue;

    element.setAttribute("src", await fileToDataURL(file));
  }

  // Nhúng SVG images.
  const svgImages = Array.from(
    doc.querySelectorAll("image[href], image[xlink\\:href]"),
  );

  for (const image of svgImages) {
    const attribute = image.hasAttribute("href")
      ? "href"
      : "xlink:href";

    const src = image.getAttribute(attribute);

    if (!src) continue;

    const file = findResourceFile(
      src,
      htmlDirectory,
      fileMap,
    );

    if (!file) continue;

    image.setAttribute(attribute, await fileToDataURL(file));
  }

  // Nhúng font.
  const fontLinks = Array.from(
    doc.querySelectorAll("link[href]"),
  );

  for (const link of fontLinks) {
    const href = link.getAttribute("href");

    if (!href) continue;

    const file = findResourceFile(
      href,
      htmlDirectory,
      fileMap,
    );

    if (!file) continue;

    if (/\.(woff2?|ttf|otf|eot)$/i.test(file.name)) {
      link.setAttribute("href", await fileToDataURL(file));
    }
  }

  return "<!DOCTYPE html>\n" + doc.documentElement.outerHTML;
}

/* =========================================================
   IFRAME HEIGHT SCRIPT
========================================================= */

function addHeightScript(html: string): string {
  if (!html) return "";

  const script = `
    (() => {
      const sendHeight = () => {
        const body = document.body;
        const root = document.documentElement;

        const height = Math.max(
          body?.scrollHeight || 0,
          body?.offsetHeight || 0,
          root?.scrollHeight || 0,
          root?.offsetHeight || 0,
          root?.clientHeight || 0
        );

        window.parent.postMessage({
          type: "HTML_PREVIEW_HEIGHT",
          height
        }, "*");
      };

      window.addEventListener("load", () => {
        sendHeight();
        setTimeout(sendHeight, 100);
        setTimeout(sendHeight, 500);
        setTimeout(sendHeight, 1000);
      });

      if (document.fonts) {
        document.fonts.ready.then(sendHeight);
      }

      if (window.ResizeObserver) {
        const observer = new ResizeObserver(sendHeight);
        observer.observe(document.documentElement);

        if (document.body) {
          observer.observe(document.body);
        }
      }

      if (window.MutationObserver) {
        const observer = new MutationObserver(sendHeight);

        observer.observe(document.documentElement, {
          childList: true,
          subtree: true,
          attributes: true,
        });
      }
    })();
  `;

  const scriptTag = `
    <script id="preview-height-script">
      ${script}
    </script>
  `;

  if (/<\/body>/i.test(html)) {
    return html.replace(
      /<\/body>/i,
      `${scriptTag}</body>`,
    );
  }

  return `${html}${scriptTag}`;
}

/* =========================================================
   CSS PROCESSOR
========================================================= */

async function processCSS(
  css: string,
  cssFilePath: string,
  fileMap: Map<string, File>,
  depth = 0,
): Promise<string> {
  if (depth > 10) return css;

  let result = css;

  // Xử lý @import.
  const importRegex =
    /@import\s+(?:url\(\s*)?["']?([^"')\s]+)["']?\s*\)?\s*;/gi;

  const imports = [...result.matchAll(importRegex)];

  for (const match of imports) {
    const original = match[0];
    const importPath = match[1];

    const importedFile = findResourceFile(
      importPath,
      getDirectory(cssFilePath),
      fileMap,
    );

    if (!importedFile) continue;

    const importedCSS = await importedFile.text();

    const processed = await processCSS(
      importedCSS,
      getRelativePath(importedFile),
      fileMap,
      depth + 1,
    );

    result = result.replace(original, processed);
  }

  // Xử lý url(...) trong CSS.
  const urlRegex = /url\(\s*(['"]?)(.*?)\1\s*\)/gi;
  const matches = [...result.matchAll(urlRegex)];

  for (const match of matches) {
    const original = match[0];
    const resourcePath = match[2].trim();

    if (
      !resourcePath ||
      /^(data:|https?:|#|blob:|\/\/)/i.test(resourcePath)
    ) {
      continue;
    }

    const file = findResourceFile(
      resourcePath,
      getDirectory(cssFilePath),
      fileMap,
    );

    if (!file) continue;

    const dataURL = await fileToDataURL(file);

    result = result.replace(
      original,
      `url("${dataURL}")`,
    );
  }

  return result;
}

/* =========================================================
   RESOURCE FINDER
========================================================= */

function findResourceFile(
  resourcePath: string,
  currentDirectory: string,
  fileMap: Map<string, File>,
): File | null {
  let cleanPath = resourcePath.trim();

  cleanPath = cleanPath.split("#")[0];
  cleanPath = cleanPath.split("?")[0];

  if (/^(https?:|data:|blob:|\/\/)/i.test(cleanPath)) {
    return null;
  }

  try {
    cleanPath = decodeURIComponent(cleanPath);
  } catch {
    // Giữ nguyên đường dẫn nếu không decode được.
  }

  cleanPath = cleanPath.replace(/\\/g, "/");
  cleanPath = cleanPath.replace(/^\/+/, "");

  const normalized = normalizePath(
    currentDirectory
      ? `${currentDirectory}/${cleanPath}`
      : cleanPath,
  );

  if (fileMap.has(normalized)) {
    return fileMap.get(normalized) ?? null;
  }

  const basename = normalized.split("/").pop();

  if (basename) {
    for (const [path, file] of fileMap.entries()) {
      if (path.endsWith(`/${basename}`) || path === basename) {
        return file;
      }
    }
  }

  return null;
}

/* =========================================================
   PATH
========================================================= */

function normalizePath(path: string): string {
  const parts = path.replace(/\\/g, "/").split("/");
  const result: string[] = [];

  for (const part of parts) {
    if (!part || part === ".") continue;

    if (part === "..") {
      result.pop();
      continue;
    }

    result.push(part);
  }

  return result.join("/");
}

function getDirectory(path: string): string {
  const normalized = normalizePath(path);
  const index = normalized.lastIndexOf("/");

  return index === -1 ? "" : normalized.slice(0, index);
}

/* =========================================================
   DATA URL
========================================================= */

async function fileToDataURL(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  let binary = "";
  const chunkSize = 0x8000;

  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(
      i,
      Math.min(i + chunkSize, bytes.length),
    );

    binary += String.fromCharCode(...chunk);
  }

  return `data:${getMimeType(file.name)};base64,${btoa(binary)}`;
}

/* =========================================================
   MIME TYPE
========================================================= */

function getMimeType(fileName: string): string {
  const extension = fileName.split(".").pop()?.toLowerCase();

  switch (extension) {
    case "css":
      return "text/css";
    case "png":
      return "image/png";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "gif":
      return "image/gif";
    case "svg":
      return "image/svg+xml";
    case "webp":
      return "image/webp";
    case "avif":
      return "image/avif";
    case "ico":
      return "image/x-icon";
    case "woff":
      return "font/woff";
    case "woff2":
      return "font/woff2";
    case "ttf":
      return "font/ttf";
    case "otf":
      return "font/otf";
    case "eot":
      return "application/vnd.ms-fontobject";
    case "mp4":
      return "video/mp4";
    case "webm":
      return "video/webm";
    case "mp3":
      return "audio/mpeg";
    case "wav":
      return "audio/wav";
    default:
      return "application/octet-stream";
  }
}