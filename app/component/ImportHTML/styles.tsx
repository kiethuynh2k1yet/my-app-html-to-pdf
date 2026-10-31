
import styled from "styled-components";

export const Container = styled.section`
  display: flex;
  flex-direction: column;
  gap: 16px;

  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
`;

export const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
`;

export const Title = styled.h2`
  margin: 0;
  color: #111827;
  font-size: 19px;
  font-weight: 700;
`;

export const UploadArea = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  width: 100%;
  max-width: 100%;
  min-width: 0;
  min-height: 240px;
  box-sizing: border-box;

  gap: 22px;
  padding: 32px;

  border: 2px dashed #cbd5e1;
  border-radius: 14px;
  background: #f8fafc;

  transition: all 0.2s ease;

  &:hover {
    border-color: #60a5fa;
    background: #f1f5f9;
  }

  @media (max-width: 600px) {
    padding: 20px 12px;
  }
`;

export const UploadText = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 9px;

  text-align: center;

  strong {
    color: #111827;
    font-size: 17px;
    font-weight: 700;
  }

  span {
    color: #64748b;
    font-size: 13px;
    line-height: 1.6;
  }
`;

export const UploadActions = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 12px;
`;

export const UploadButton = styled.button<{
  $secondary?: boolean;
}>`
  display: inline-flex;
  align-items: center;
  justify-content: center;

  min-width: 145px;
  padding: 11px 18px;

  border: 1px solid
    ${({ $secondary }) =>
      $secondary ? "#cbd5e1" : "#2563eb"};

  border-radius: 8px;

  background: ${({ $secondary }) =>
    $secondary ? "#ffffff" : "#2563eb"};

  color: ${({ $secondary }) =>
    $secondary ? "#334155" : "#ffffff"};

  font-size: 14px;
  font-weight: 600;

  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: ${({ $secondary }) =>
      $secondary ? "#f1f5f9" : "#1d4ed8"};

    border-color: ${({ $secondary }) =>
      $secondary ? "#94a3b8" : "#1d4ed8"};

    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`;

export const FileInfo = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;

  width: 100%;
  min-width: 0;
  max-width: 100%;

  box-sizing: border-box;
  padding: 13px 16px;

  border: 1px solid #e2e8f0;
  border-radius: 9px;

  background: #f8fafc;

  @media (max-width: 600px) {
    gap: 8px;
    padding: 10px;
  }
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
  white-space: nowrap;

  padding: 8px 14px;

  border: 1px solid #fecaca;
  border-radius: 7px;

  background: #ffffff;
  color: #dc2626;

  font-size: 13px;
  font-weight: 600;

  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #fef2f2;
    border-color: #f87171;
  }
`;

export const PreviewContainer = styled.section`
  width: 100%;
  margin-top: 8px;

  border: 1px solid #e2e8f0;
  border-radius: 12px;

  overflow: hidden;
  background: #ffffff;

  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
`;

export const PreviewTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;

  min-height: 48px;
  padding: 0 16px;

  border-bottom: 1px solid #e2e8f0;

  background: #f8fafc;
  color: #1e293b;

  font-size: 14px;
  font-weight: 700;

  span {
    display: inline-flex;
    align-items: center;
    justify-content: center;

    width: 25px;
    height: 25px;

    border-radius: 6px;

    background: #dbeafe;
    color: #1d4ed8;

    font-size: 11px;
    font-weight: 700;
  }
`;

export const PreviewDescription = styled.p`
  margin: 0;
  padding: 10px 16px;

  border-bottom: 1px solid #e2e8f0;

  color: #64748b;
  background: #ffffff;

  font-size: 12px;
  line-height: 1.5;
`;

export const PreviewFrame = styled.iframe`
  display: block;

  width: 100%;
  min-height: 500px;

  border: 0;
  outline: none;

  background: #ffffff;

  overflow: hidden;
`;

export const ErrorMessage = styled.div`
  display: flex;
  align-items: flex-start;

  padding: 12px 14px;

  border: 1px solid #fecaca;
  border-radius: 8px;

  background: #fef2f2;
  color: #b91c1c;

  font-size: 13px;
  line-height: 1.6;
`;

export const LoadingMessage = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;

  padding: 12px 14px;

  border: 1px solid #bfdbfe;
  border-radius: 8px;

  background: #eff6ff;
  color: #1d4ed8;

  font-size: 13px;
  line-height: 1.5;

  &::before {
    content: "";

    width: 15px;
    height: 15px;

    flex-shrink: 0;

    border: 2px solid #bfdbfe;
    border-top-color: #2563eb;
    border-radius: 50%;

    animation: loading-spin 0.7s linear infinite;
  }

  @keyframes loading-spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

export const RawHTML = styled.pre`
  width: 100%;
  max-width: 100%;
  max-height: 500px;
  min-height: 300px;

  box-sizing: border-box;
  margin: 0;
  padding: 16px;

  overflow: auto;
  white-space: pre;
  overflow-wrap: normal;

  background: #0f172a;
  color: #e2e8f0;

  font-family: Consolas, monospace;
  font-size: 13px;
  line-height: 1.6;

  code {
    font: inherit;
  }
`;