"use client";

import { useState } from "react";

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

export default function HTMLToPDF() {
  const [html, setHtml] = useState("");
  const [fileName, setFileName] = useState("");

  const handleImport = (
    content: string,
    name: string,
  ) => {
    setHtml(content);
    setFileName(name);
  };

  const handleRemove = () => {
    setHtml("");
    setFileName("");
  };

  return (
    <>
      <GlobalStyles />
      <PageContainer>
        <ContentContainer>
          <Header>
            <Heading>HTML to PDF Converter</Heading>

            <Description>
              Import file HTML, xem trước nội dung và xuất thành PDF
              khổ A4 bằng Chromium.
            </Description>
          </Header>

          <MainCard>
            <ImportHTML
              html={html}
              fileName={fileName}
              onImport={handleImport}
              onRemove={handleRemove}
            />

            <Toolbar>
              <StatusText>
                {html
                  ? `Đã tải: ${fileName}`
                  : "Chưa có file HTML"}
              </StatusText>

              <ExportPDF
                html={html}
                fileName={fileName || "export.html"}
              />
            </Toolbar>
          </MainCard>

          <Footer>
            HTML to PDF · Powered by Next.js, Styled Components
            and Playwright
          </Footer>
        </ContentContainer>
      </PageContainer>
    </>
  );
}