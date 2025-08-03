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

// ... (Código del componente principal de la página se mantiene igual)

function DocenteForm({ docente, cursos, asignaturas, configuracionHorario, onSave, onCancel }: any) {
    const [formData, setFormData] = useState<Partial<DocenteDB>>({
        nombre: docente?.nombre || "",
        apellido: docente?.apellido || "",
        cedula: docente?.cedula || "",
        especialidad: docente?.especialidad || "",
        email: docente?.email || "",
        telefono: docente?.telefono || "",
        tipo: docente?.tipo || "titular",
        nivel: docente?.nivel || "primario",
        horasDisponibles: docente?.horasDisponibles || 40,
        cursosAsignados: docente?.cursosAsignados ? JSON.parse(JSON.stringify(docente.cursosAsignados)) : [],
        restricciones: docente?.restricciones ? JSON.parse(JSON.stringify(docente.restricciones)) : [],
    });
    // ... (El resto de la lógica del formulario se mantiene igual)

    return (
        <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="space-y-6">
            {/* ... (Sección de Información Personal) ... */}
            
            <div className="space-y-4">
                <h3 className="text-lg font-medium">Información Profesional</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                        <Label>Tipo de Docente</Label>
                        <Select value={formData.tipo} onValueChange={v => setFormData(f => ({...f, tipo: v}))}>
                            <SelectTrigger><SelectValue/></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="titular">Titular (Un solo curso)</SelectItem>
                                <SelectItem value="titular_con_adicionales">Titular con Asignaturas Adicionales</SelectItem>
                                <SelectItem value="rotacion">Docente de Rotación (Área)</SelectItem>
                            </SelectContent>
                        </Select>
                     </div>
                     <div>
                        <Label>Nivel</Label>
                        <Select value={formData.nivel} onValueChange={v => setFormData(f => ({...f, nivel: v}))}>
                            <SelectTrigger><SelectValue/></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="primario">Primario</SelectItem>
                                <SelectItem value="secundario">Secundario</SelectItem>
                                <SelectItem value="ambos">Ambos</SelectItem>
                            </SelectContent>
                        </Select>
                     </div>
                </div>
            </div>
            
            {/* ... (Resto del formulario: Restricciones, Asignaciones, etc.) ... */}

            <div className="flex justify-end gap-4 border-t pt-4">
                <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
                <Button type="submit">{docente ? "Guardar Cambios" : "Agregar Docente"}</Button>
            </div>
        </form>
    );
}
// ... (El resto del archivo se mantiene igual)