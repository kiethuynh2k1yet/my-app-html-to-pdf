
"use client";

import { useState } from "react";

import {
  Container,
  ExportButton,
  Spinner,
  Message,
  MessageIcon,
} from "./styles";

interface PreviewSize {
  width: number;
  height: number;
}

interface ExportPDFProps {
  html: string;
  fileName?: string;
  previewSize: PreviewSize;
}

interface ApiError {
  success?: boolean;
  message?: string;
  detail?: string;
}

export default function ExportPDF({
  html,
  fileName = "my-document",
  previewSize,
}: ExportPDFProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleExport = async () => {
    if (loading) return;

    setError("");
    setSuccess("");

    if (!html.trim()) {
      setError(
        "Preview chưa sẵn sàng. Vui lòng chờ nội dung được render.",
      );
      return;
    }

    if (
      !Number.isFinite(previewSize.width) ||
      !Number.isFinite(previewSize.height) ||
      previewSize.width <= 0 ||
      previewSize.height <= 0
    ) {
      setError("Không lấy được kích thước Preview hợp lệ.");
      return;
    }

    try {
      setLoading(true);

      console.log("[EXPORT PDF] Preview size:", previewSize);

      const response = await fetch("/api/export-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          html,
          fileName,
          previewWidth: previewSize.width,
          previewHeight: previewSize.height,
        }),
      });

      if (!response.ok) {
        let message = "Không thể xuất PDF.";

        try {
          const data: ApiError = await response.json();

          message =
            data.detail ||
            data.message ||
            message;
        } catch {
          message = `Lỗi máy chủ: ${response.status} ${response.statusText}`;
        }

        throw new Error(message);
      }

      const contentType =
        response.headers.get("content-type") || "";

      if (!contentType.includes("application/pdf")) {
        throw new Error("API không trả về file PDF hợp lệ.");
      }

      const blob = await response.blob();

      if (blob.size === 0) {
        throw new Error("File PDF không có dữ liệu.");
      }

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = url;

      link.download = `${
        fileName.replace(/[^a-zA-Z0-9_-]/g, "_") ||
        "document"
      }.pdf`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 1000);

      setSuccess("Xuất PDF thành công!");
    } catch (err) {
      console.error("[EXPORT PDF ERROR]", err);

      setError(
        err instanceof Error
          ? err.message
          : "Đã xảy ra lỗi khi xuất PDF.",
      );
    } finally {
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
            <Spinner />
            <span>Đang xuất PDF...</span>
          </>
        ) : (
          <span>Xuất PDF</span>
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
