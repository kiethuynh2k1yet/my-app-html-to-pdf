
"use client";

import { useState, useCallback } from "react";

import ImportHTML from "../ImportHTML/page";
import ExportPDF from "../ExportPDF/page";
import GlobalStyles from "@/app/GlobalStyles";

import {
  PageContainer,
  ContentContainer,
  Header,
  Heading,
  Description,
  MainCard,
  Toolbar,
  StatusText,
  Footer,
} from "./styles";

interface PreviewSize {
  width: number;
  height: number;
}

export default function HTMLToPDF() {
  const [html, setHtml] = useState("");
  const [renderedHTML, setRenderedHTML] = useState("");
  const [fileName, setFileName] = useState("");

  // Kích thước thực tế của Preview iframe
  const [previewSize, setPreviewSize] = useState<PreviewSize>({
    width: 794,
    height: 1123,
  });

  const handleImport = (
    content: string,
    name: string,
  ) => {
    setHtml(content);
    setRenderedHTML("");
    setFileName(name);

    setPreviewSize({
      width: 794,
      height: 800,
    });
  };

  const handleRemove = () => {
    setHtml("");
    setRenderedHTML("");
    setFileName("");

    setPreviewSize({
      width: 794,
      height: 1123,
    });
  };

  // Chỉ cập nhật state khi kích thước thực sự thay đổi
  const handlePreviewSize = useCallback(
    (size: PreviewSize) => {
      if (size.width <= 0 || size.height <= 0) return;

      setPreviewSize((previous) => {
        if (
          previous.width === size.width &&
          previous.height === size.height
        ) {
          return previous;
        }

        return size;
      });
    },
    [],
  );

  return (
    <>
      <GlobalStyles />

      <PageContainer>
        <ContentContainer>
          <Header>
            <Heading>HTML to PDF Converter</Heading>

            <Description>
              Import file HTML, xem trước toàn bộ nội dung
              và xuất thành PDF với kích thước linh hoạt
              theo Preview.
            </Description>
          </Header>

          <MainCard>
            <ImportHTML
              html={html}
              fileName={fileName}
              onImport={handleImport}
              onRemove={handleRemove}
              onRenderedHTML={setRenderedHTML}
              onPreviewSize={handlePreviewSize}
            />

            <Toolbar>
              <StatusText>
                {!html
                  ? "Chưa có file HTML"
                  : renderedHTML
                    ? `Đã sẵn sàng xuất PDF: ${fileName}`
                    : "Đang chuẩn bị nội dung Preview..."}
              </StatusText>

              <ExportPDF
                html={renderedHTML}
                fileName={fileName || "export"}
                previewSize={previewSize}
              />
            </Toolbar>
          </MainCard>

          <Footer>
            HTML to PDF · Powered by Next.js,
            Styled Components and Playwright
          </Footer>
        </ContentContainer>
      </PageContainer>
    </>
  );
}
