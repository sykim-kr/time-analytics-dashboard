import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "시간 기반 분석 | Mixpanel Analytics",
  description: "시간 기반 분석 프레임워크 대시보드",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className="dark">
      <body>{children}</body>
    </html>
  );
}
