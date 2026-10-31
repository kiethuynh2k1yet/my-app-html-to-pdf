"use client";

import styled from "styled-components";

export const ExportContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;

  @media (max-width: 600px) {
    justify-content: stretch;
  }
`;

export const ExportButton = styled.button`
  min-width: 150px;
  padding: 12px 22px;

  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  border: none;
  border-radius: 8px;

  background: #2563eb;
  color: #ffffff;

  font-size: 14px;
  font-weight: 700;

  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: #1d4ed8;
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  @media (max-width: 600px) {
    width: 100%;
  }
`;