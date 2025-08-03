import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sistema de Horarios Docentes",
  description: "Sistema de gestión de horarios para docentes y cursos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <div className="flex h-screen bg-gray-100">
          <Sidebar />
          <main className="flex-1 overflow-y-auto">
            <div className="p-6">
              {children}
            </div>
            <footer className="bg-white border-t border-gray-200 py-4 px-6 mt-auto">
              <div className="text-center text-sm text-gray-600">
                <p className="font-medium">Aplicación creada por Luis Baudilio Luna</p>
                <p className="text-xs mt-1">Tel. (829) 475-4755</p>
              </div>
            </footer>
          </main>
        </div>
        <Toaster />
      </body>
    </html>
  );
}