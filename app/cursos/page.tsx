"use client"

import dynamic from 'next/dynamic'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  GraduationCap,
  Plus,
  Edit,
  Trash2,
  Users,
  AlertTriangle,
} from "lucide-react"
import { useCursos, useDocentes, useDatabase } from "@/hooks/useDatabase"
import { toast } from "@/hooks/use-toast"
import { useState } from "react"
import { cn } from "@/lib/utils"

// ... (El resto del archivo se mantiene igual que en la respuesta anterior, pero asegúrate de que esté completo)

const DynamicCursosPage = dynamic(() => Promise.resolve(CursosPageComponent), { ssr: false });
export default function CursosPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-cyan-100 p-6">
            <div className="max-w-7xl mx-auto">
                <DynamicCursosPage />
            </div>
        </div>
    );
}