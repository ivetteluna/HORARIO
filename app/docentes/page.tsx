"use client"

import dynamic from 'next/dynamic'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Plus,
  Edit,
  Trash2,
  Users,
  Mail,
  Phone,
  X,
  Eye,
  EyeOff
} from "lucide-react"
import { useDocentes, useAsignaturas, useCursos, useDatabase, useConfiguracion } from "@/hooks/useDatabase"
import type { DocenteDB } from "@/lib/database"
import { toast } from "@/hooks/use-toast"
import { useState } from "react"

const especialidadesComunes = [
  "Educación Básica", "Matemáticas", "Lengua Española", "Ciencias Naturales",
  "Ciencias Sociales", "Educación Física", "Educación Artística", "Inglés",
  "Francés", "Informática", "Orientación y Psicología", "Biblioteca",
];

// ... (El resto de la página se mantiene igual que en la respuesta anterior, pero asegúrate de que esté completo)

const DynamicDocentesPage = dynamic(() => Promise.resolve(DocentesPageComponent), { ssr: false });
export default function DocentesPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-cyan-100 p-6">
            <div className="max-w-7xl mx-auto">
                <DynamicDocentesPage />
            </div>
        </div>
    );
}