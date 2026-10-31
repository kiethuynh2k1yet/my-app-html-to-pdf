
"use client";

import { useState } from "react";
import styled from "styled-components";

interface ExportPDFProps {
  html: string;
  fileName?: string;
}

interface ApiError {
  success?: boolean;
  message?: string;
  detail?: string;
}

export default function ExportPDF({
  html,
  fileName = "my-document",
}: ExportPDFProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleExport = async () => {
    if (loading) return;
 
    setError("");
    setSuccess("");

    if (!html || !html.trim()) {
      setError("Vui lòng nhập hoặc tải lên nội dung HTML trước khi xuất PDF.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/export-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          html,
          fileName,
        }),
      });

      // Xử lý lỗi từ API
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

      // Kiểm tra kiểu dữ liệu trả về
      const contentType = response.headers.get("content-type") || "";

      if (!contentType.includes("application/pdf")) {
        throw new Error("API không trả về file PDF hợp lệ.");
      }

      // Nhận file PDF
      const blob = await response.blob();

      if (blob.size === 0) {
        throw new Error("File PDF được tạo nhưng không có dữ liệu.");
      }

      // Tạo đường dẫn tải file
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = url;
      link.download = `${fileName.replace(/[^a-zA-Z0-9_-]/g, "_") || "document"}.pdf`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      // Giải phóng bộ nhớ
      window.setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 1000);

      setSuccess("Xuất PDF thành công!");
    } catch (err) {
      console.error("[EXPORT PDF ERROR]", err);

      setError(
        err instanceof Error
          ? err.message
          : "Đã xảy ra lỗi không xác định khi xuất PDF."
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
        disabled={loading || !html?.trim()}
      >
        {loading ? (
          <>
            <Spinner />
            <span>Đang xuất PDF...</span>
          </>
        ) : (
          <>
            <DownloadIcon />
            <span>Xuất PDF</span>
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

// ==============================
// STYLED COMPONENTS
// ==============================

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
`;

const ExportButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;

  min-width: 150px;
  padding: 12px 22px;

  border: none;
  border-radius: 8px;

  background: #2563eb;
  color: #ffffff;

  font-size: 14px;
  font-weight: 600;

  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: #1d4ed8;
    transform: translateY(-1px);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    background: #94a3b8;
    cursor: not-allowed;
    opacity: 0.7;
  }
`;

const DownloadIcon = styled.span`
  position: relative;
  display: inline-block;

  width: 17px;
  height: 17px;

  &::before {
    content: "";
    position: absolute;
    left: 7px;
    top: 0;

    width: 3px;
    height: 11px;

    background: currentColor;
    border-radius: 2px;
  }

  &::after {
    content: "";
    position: absolute;
    left: 3px;
    top: 5px;

    width: 9px;
    height: 9px;

    border-right: 2px solid currentColor;
    border-bottom: 2px solid currentColor;

    transform: rotate(45deg);
  }
`;

const Spinner = styled.span`
  width: 16px;
  height: 16px;

  border: 2px solid rgba(255, 255, 255, 0.35);
  border-top-color: #ffffff;
  border-radius: 50%;

  animation: spin 0.7s linear infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const Message = styled.div<{ $type: "error" | "success" }>`
  display: flex;
  align-items: flex-start;
  gap: 8px;

  padding: 10px 12px;
  border-radius: 7px;

  font-size: 13px;
  line-height: 1.5;

  color: ${({ $type }) =>
    $type === "error" ? "#b91c1c" : "#15803d"};

  background: ${({ $type }) =>
    $type === "error" ? "#fef2f2" : "#f0fdf4"};

  border: 1px solid
    ${({ $type }) =>
      $type === "error" ? "#fecaca" : "#bbf7d0"};
`;

const MessageIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;

  flex-shrink: 0;

  width: 18px;
  height: 18px;

  border: 1px solid currentColor;
  border-radius: 50%;

  font-size: 11px;
  font-weight: 700;
`;
