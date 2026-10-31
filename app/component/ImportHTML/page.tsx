"use client";

import { ChangeEvent } from "react";

import {
  ImportContainer,
  UploadArea,
  UploadIcon,
  UploadTitle,
  UploadDescription,
  FileInput,
  FileInfo,
  FileName,
  RemoveButton,
  PreviewHeader,
  PreviewTitle,
  PreviewContainer,
  PreviewFrame,
  EmptyPreview,
} from "./styles";

type ImportHTMLProps = {
  html: string;
  fileName: string;
  onImport: (html: string, fileName: string) => void;
  onRemove: () => void;
};

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export default function ImportHTML({
  html,
  fileName,
  onImport,
  onRemove,
}: ImportHTMLProps) {
  const handleFileChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".html") &&
        !file.name.toLowerCase().endsWith(".htm")) {
      alert("Vui lòng chọn file HTML (.html hoặc .htm).");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      alert("File không được vượt quá 10MB.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result;

      if (typeof result !== "string") {
        alert("Không thể đọc nội dung file.");
        return;
      }

      onImport(result, file.name);
    };

    reader.onerror = () => {
      alert("Đã xảy ra lỗi khi đọc file HTML.");
    };

    reader.readAsText(file, "UTF-8");

    // Cho phép chọn lại chính file vừa chọn.
    event.target.value = "";
  };

  return (
    <ImportContainer>
      <UploadArea>
        <FileInput
          type="file"
          accept=".html,.htm,text/html"
          onChange={handleFileChange}
        />

        <UploadIcon>📄</UploadIcon>

        <UploadTitle>
          Chọn file HTML để tải lên
        </UploadTitle>

        <UploadDescription>
          Hỗ trợ .html và .htm — tối đa 10MB
        </UploadDescription>
      </UploadArea>

      {html && (
        <FileInfo>
          <FileName title={fileName}>
            📄 {fileName}
          </FileName>

          <RemoveButton
            type="button"
            onClick={onRemove}
          >
            Xóa file
          </RemoveButton>
        </FileInfo>
      )}

      <PreviewHeader>
        <PreviewTitle>
          Xem trước nội dung HTML
        </PreviewTitle>
      </PreviewHeader>

      <PreviewContainer>
        {html ? (
          <PreviewFrame
            title="HTML Preview"
            sandbox=""
            srcDoc={html}
          />
        ) : (
          <EmptyPreview>
            Chưa có file HTML. Vui lòng tải file lên để xem trước.
          </EmptyPreview>
        )}
      </PreviewContainer>
    </ImportContainer>
  );
}