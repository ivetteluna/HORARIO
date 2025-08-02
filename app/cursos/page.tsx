"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { GraduationCap, Plus, Edit, Trash2, Users } from "lucide-react"
import { useCursos, useDocentes, useDatabase } from "@/hooks/useDatabase"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

export default function CursosPage() {
  const { isInitialized } = useDatabase()
  const { cursos, loading, saveCurso, deleteCurso } = useCursos()
  const { docentes } = useDocentes()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCurso, setEditingCurso] = useState(null)

  const [formData, setFormData] = useState({
    nivel: "",
    grado: "",
    seccion: "",
    estudiantesMatriculados: "",
    docenteTitular: "", // Campo añadido
  })
  
  // ... (El resto de la lógica se mantiene igual)

  const handleSubmit = async (e) => {
    e.preventDefault()
    // ...
    const nombreDelCurso = `${formData.grado} ${formData.seccion} ${formData.nivel.charAt(0).toUpperCase() + formData.nivel.slice(1)}`
    
    const cursoData = {
      id: editingCurso?.id || Date.now().toString(),
      nombre: nombreDelCurso,
      nivel: formData.nivel,
      grado: formData.grado,
      seccion: formData.seccion,
      estudiantesMatriculados: parseInt(formData.estudiantesMatriculados) || 0,
      docenteTitular: formData.docenteTitular, // Guardar el ID del docente
      // ...
    }
    await saveCurso(cursoData)
    // ...
  }
  
  const handleEdit = (curso) => {
    setEditingCurso(curso);
    setFormData({
      nivel: curso.nivel,
      grado: curso.grado,
      seccion: curso.seccion,
      estudiantesMatriculados: curso.estudiantesMatriculados.toString(),
      docenteTitular: curso.docenteTitular || "",
    });
    setIsDialogOpen(true);
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-cyan-100 p-6">
        <div className="max-w-7xl mx-auto">
            {/* ... */}
            <DialogContent className="sm:max-w-[500px]">
                {/* ... */}
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    {/* ... campos de nivel, grado, seccion, etc ... */}
                    <div className="space-y-2">
                        <Label htmlFor="docenteTitular">Docente Titular (Encargado)</Label>
                        <Select value={formData.docenteTitular} onValueChange={(value) => setFormData({ ...formData, docenteTitular: value })}>
                            <SelectTrigger>
                                <SelectValue placeholder="Asignar un docente titular" />
                            </SelectTrigger>
                            <SelectContent>
                                {docentes.filter(d => d.tipo === 'titular').map(docente => (
                                    <SelectItem key={docente.id} value={docente.id}>
                                        {docente.nombre} {docente.apellido}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    {/* ... */}
                </form>
            </DialogContent>
            {/* ... */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cursos.map((curso) => {
                    const docenteTitular = docentes.find(d => d.id === curso.docenteTitular)
                    return (
                        <Card key={curso.id} className={cn(
                            "hover:shadow-lg transition-shadow",
                             curso.nivel === "primario" ? "bg-green-100 border-green-600" : "bg-blue-100 border-blue-600",
                        )}>
                            <CardHeader>
                                <CardTitle>{curso.nombre}</CardTitle>
                                <CardDescription>{curso.estudiantesMatriculados} estudiantes</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {docenteTitular && <p className="text-sm font-medium">Titular: {docenteTitular.nombre} {docenteTitular.apellido}</p>}
                            </CardContent>
                        </Card>
                    )
                })}
            </div>
        </div>
    </div>
  )
}