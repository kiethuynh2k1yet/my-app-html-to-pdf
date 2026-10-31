"use client";

import styled from "styled-components";

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
`;

export const ExportButton = styled.button`
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

export const DownloadIcon = styled.span`
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

export const Spinner = styled.span`
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

export const Message = styled.div<{ $type: "error" | "success" }>`
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

export const MessageIcon = styled.span`
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