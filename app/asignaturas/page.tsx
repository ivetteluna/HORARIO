"use client"

import dynamic from 'next/dynamic'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Plus, Edit, Trash2, BookOpen } from "lucide-react"
import { useAsignaturas, useDatabase } from "@/hooks/useDatabase"
import { useNiveles } from "@/hooks/useNiveles"
import type { AsignaturaDB } from "@/lib/database"
import { toast } from "@/hooks/use-toast"
import { useState } from "react"

// ... (El resto del archivo se mantiene igual que en la respuesta anterior, pero asegúrate de que esté completo)

const DynamicAsignaturasPage = dynamic(() => Promise.resolve(AsignaturasPageComponent), { ssr: false });
export default function AsignaturasPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-cyan-100 p-6">
            <div className="max-w-7xl mx-auto">
                <DynamicAsignaturasPage />
            </div>
        </div>
    );
}