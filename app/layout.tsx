"use client"

import type React from "react"
import { Inter } from "next/font/google"
import "./globals.css"
import { Sidebar } from "@/components/sidebar"
import { Toaster } from "@/components/ui/toaster"
import { useDatabase } from "@/hooks/useDatabase"

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isInitialized } = useDatabase();

  if (!isInitialized) {
    return (
      <html lang="es">
        <body className={inter.className}>
          <div className="flex h-screen items-center justify-center bg-gray-100">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Inicializando sistema...</p>
            </div>
          </div>
        </body>
      </html>
    )
  }

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
  )
}