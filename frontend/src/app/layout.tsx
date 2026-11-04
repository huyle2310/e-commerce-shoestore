import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ClientLayout from "./ClientLayout";

const inter = Inter({ subsets: ["latin", "vietnamese"] });

export const metadata: Metadata = {
  title: "Vanguard Shoe Store",
  description: "Khám phá bộ sưu tập giày thể thao chính hãng, đa dạng mẫu mã và phong cách tại Vanguard. Trải nghiệm mua sắm an toàn, giao hàng nhanh chóng.",
  keywords: ["giày thể thao", "sneaker", "Vanguard", "giày chính hãng", "thời trang nam nữ"],
  icons: {
    icon: '/favicon.png',
  },
  openGraph: {
    title: "Vanguard - Thời Trang Giày Thể Thao Cao Cấp",
    description: "Khám phá bộ sưu tập giày thể thao chính hãng, đa dạng mẫu mã và phong cách tại Vanguard.",
    type: "website",
    locale: "vi_VN",
    url: "https://vanguard.vn",
    siteName: "Vanguard Shoes Shop",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className={`${inter.className} bg-[#F8F9FA] text-[#111827] antialiased selection:bg-[#F97316] selection:text-white min-h-screen`}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
