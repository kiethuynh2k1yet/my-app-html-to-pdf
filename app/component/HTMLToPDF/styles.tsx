"use client";

import styled from "styled-components";

export const PageContainer = styled.main`
  min-height: 100vh;
  padding: 40px 24px;
  background: #f1f5f9;

  @media (max-width: 600px) {
    padding: 24px 12px;
  }
`;

export const ContentContainer = styled.div`
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
`;

export const Header = styled.header`
  margin-bottom: 28px;
`;

export const Heading = styled.h1`
  margin: 0 0 8px;
  color: #0f172a;
  font-size: 28px;
  font-weight: 800;
  letter-spacing: -0.5px;

  @media (max-width: 600px) {
    font-size: 23px;
  }
`;

export const Description = styled.p`
  margin: 0;
  color: #64748b;
  font-size: 14px;
  line-height: 1.6;
`;

export const MainCard = styled.section`
  display: flex;
  flex-direction: column;
  gap: 24px;

  padding: 24px;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  background: #ffffff;
  box-shadow: 0 4px 20px rgba(15, 23, 42, 0.04);

  @media (max-width: 600px) {
    padding: 16px;
  }
`;

export const Toolbar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;

  padding-top: 20px;
  border-top: 1px solid #e2e8f0;

  @media (max-width: 600px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

export const StatusText = styled.span`
  color: #64748b;
  font-size: 13px;
`;

export const Footer = styled.footer`
  margin-top: 24px;
  color: #94a3b8;
  font-size: 12px;
  text-align: center;
`;