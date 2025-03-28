import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/ui/Navbar";
import { AuthProvider } from "@/lib/AuthContext";

const geist = Geist({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Учет рабочего времени",
  description: "Приложение для учета рабочего времени сотрудников",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className={`${geist.className} bg-white text-gray-900`}>
        <AuthProvider>
          <Navbar />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 bg-white">
            {children}
          </main>
          <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-10 text-center text-gray-500 text-sm border-t border-gray-200 bg-white">
            <p>© {new Date().getFullYear()} Система учета рабочего времени</p>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
