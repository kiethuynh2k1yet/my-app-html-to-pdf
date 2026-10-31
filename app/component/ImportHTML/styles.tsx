"use client";

import styled from "styled-components";

export const ImportContainer = styled.section`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

export const UploadArea = styled.label`
  width: 100%;
  min-height: 150px;
  padding: 28px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 10px;

  border: 2px dashed #cbd5e1;
  border-radius: 12px;
  background: #f8fafc;

  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: #2563eb;
    background: #eff6ff;
  }
`;

export const UploadIcon = styled.div`
  font-size: 32px;
`;

export const UploadTitle = styled.span`
  color: #1e293b;
  font-size: 16px;
  font-weight: 700;
`;

export const UploadDescription = styled.span`
  color: #64748b;
  font-size: 13px;
`;

export const FileInput = styled.input`
  display: none;
`;

export const FileInfo = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;

  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #ffffff;
`;

export const FileName = styled.span`
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  color: #334155;
  font-size: 14px;
  font-weight: 600;
`;

export const RemoveButton = styled.button`
  flex-shrink: 0;
  border: none;
  background: transparent;
  color: #dc2626;
  font-size: 13px;
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
`;

export const PreviewHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

export const PreviewTitle = styled.h2`
  margin: 0;
  color: #1e293b;
  font-size: 16px;
  font-weight: 700;
`;

export const PreviewContainer = styled.div`
  width: 100%;
  height: 700px;
  overflow: auto;

  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #e2e8f0;
`;

export const PreviewFrame = styled.iframe`
  display: block;
  width: 100%;
  height: 100%;
  border: none;
  background: #ffffff;
`;

export const EmptyPreview = styled.div`
  width: 100%;
  height: 100%;
  min-height: 300px;

  display: flex;
  align-items: center;
  justify-content: center;

  color: #94a3b8;
  font-size: 14px;
  text-align: center;
`;