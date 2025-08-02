"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  GraduationCap,
  Plus,
  Edit,
  Trash2,
  Users,
  BookOpen,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  ArrowUpDown,
  Hash,
} from "lucide-react"
import { useCursos, useDocentes, useAsignaturas, useDatabase } from "@/hooks/useDatabase"
import { toast } from "@/hooks/use-toast"
import Link from "next/link"
import { cn } from "@/lib/utils"

export default function CursosPage() {
  const { isInitialized } = useDatabase()
  const { cursos, loading, saveCurso, deleteCurso } = useCursos()
  const { docentes } = useDocentes()
  const { asignaturas } = useAsignaturas()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCurso, setEditingCurso] = useState(null)

  const [formData, setFormData] = useState({
    nivel: "",
    grado: "",
    seccion: "",
    estudiantesMatriculados: "",
  })

  if (!isInitialized || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-cyan-100 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando cursos...</p>
        </div>
      </div>
    )
  }

  const ordenarCursosAutomaticamente = (cursos) => {
    return cursos.sort((a, b) => {
      if (a.nivel !== b.nivel) return a.nivel === "primario" ? -1 : 1
      const gradoA = parseInt(a.grado?.replace("°", "") || "0")
      const gradoB = parseInt(b.grado?.replace("°", "") || "0")
      if (gradoA !== gradoB) return gradoA - gradoB
      return (a.seccion || "").localeCompare(b.seccion || "")
    })
  }

  const cursosOrdenados = ordenarCursosAutomaticamente([...cursos])

  const calcularEstadisticasHoras = (curso) => {
    const docentesDelCurso = docentes.filter((docente) =>
      docente.cursosAsignados?.some((ca) => ca.cursoId === curso.id),
    )
    let horasAsignadas = 0
    const asignaturasAsignadas = new Set()
    docentesDelCurso.forEach((docente) => {
      const cursoAsignado = docente.cursosAsignados.find((ca) => ca.cursoId === curso.id)
      cursoAsignado?.asignaturas.forEach((asigId) => {
        asignaturasAsignadas.add(asigId)
        const asignatura = asignaturas.find((a) => a.id === asigId)
        if (asignatura) {
          horasAsignadas += asignatura.horasPorNivel?.[curso.nivel]?.[curso.grado] || 0
        }
      })
    })
    return { horasAsignadas, excedeLimite: horasAsignadas > 40 }
  }

  const resetForm = () => {
    setFormData({ nivel: "", grado: "", seccion: "", estudiantesMatriculados: "" })
    setEditingCurso(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.nivel || !formData.grado || !formData.seccion) {
      toast({ title: "Error", description: "Completa todos los campos obligatorios.", variant: "destructive" })
      return
    }
    const nombreDelCurso = `${formData.grado} ${formData.seccion} ${formData.nivel.charAt(0).toUpperCase() + formData.nivel.slice(1)}`
    if (cursos.find((c) => c.nombre === nombreDelCurso && c.id !== editingCurso?.id)) {
      toast({ title: "Error", description: "Ya existe un curso con esa configuración.", variant: "destructive" })
      return
    }
    const cursoData = {
      id: editingCurso?.id || Date.now().toString(),
      nombre: nombreDelCurso,
      ...formData,
      estudiantesMatriculados: parseInt(formData.estudiantesMatriculados) || 0,
      asignaturas: editingCurso?.asignaturas || [],
      horasSemanales: editingCurso?.horasSemanales || 40,
    }
    await saveCurso(cursoData)
    toast({ title: "Éxito", description: `Curso ${editingCurso ? "actualizado" : "creado"}.` })
    setIsDialogOpen(false)
    resetForm()
  }

  const handleEdit = (curso) => {
    setEditingCurso(curso)
    setFormData({
      nivel: curso.nivel,
      grado: curso.grado,
      seccion: curso.seccion,
      estudiantesMatriculados: curso.estudiantesMatriculados.toString(),
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (curso) => {
    if (confirm(`¿Eliminar el curso ${curso.nombre}?`)) {
      await deleteCurso(curso.id)
      toast({ title: "Eliminado", description: `Curso ${curso.nombre} eliminado.` })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-cyan-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <GraduationCap className="h-8 w-8 text-indigo-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestión de Cursos</h1>
              <p className="text-gray-600">Organización automática por nivel, grado y sección</p>
            </div>
          </div>
          <Button onClick={() => { resetForm(); setIsDialogOpen(true); }} className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Curso
          </Button>
        </div>

        {/* DIALOGO */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingCurso ? "Editar Curso" : "Crear Nuevo Curso"}</DialogTitle>
              <DialogDescription>Completa la información para {editingCurso ? "actualizar el" : "crear un nuevo"} curso.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nivel">Nivel *</Label>
                  <Select value={formData.nivel} onValueChange={(value) => setFormData({ ...formData, nivel: value })}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar nivel" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="primario">Primario</SelectItem>
                      <SelectItem value="secundario">Secundario</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="grado">Grado *</Label>
                  <Select value={formData.grado} onValueChange={(value) => setFormData({ ...formData, grado: value })}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar grado" /></SelectTrigger>
                    <SelectContent>
                      {["1°", "2°", "3°", "4°", "5°", "6°"].map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="seccion">Sección *</Label>
                  <Select value={formData.seccion} onValueChange={(value) => setFormData({ ...formData, seccion: value })}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar sección" /></SelectTrigger>
                    <SelectContent>
                      {["A", "B", "C", "D", "E"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estudiantes">Estudiantes</Label>
                  <Input id="estudiantes" type="number" value={formData.estudiantesMatriculados} onChange={(e) => setFormData({ ...formData, estudiantesMatriculados: e.target.value })} />
                </div>
              </div>
              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">{editingCurso ? "Actualizar" : "Crear"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {cursosOrdenados.length === 0 ? (
          <Card className="text-center p-12">
             <GraduationCap className="h-16 w-16 text-gray-400 mx-auto mb-4" />
             <h3 className="text-xl font-semibold">No hay cursos registrados</h3>
             <p className="text-gray-500 mb-6">Crea tu primer curso para empezar.</p>
             <Button onClick={() => { resetForm(); setIsDialogOpen(true); }} className="bg-indigo-600 hover:bg-indigo-700">
               <Plus className="h-4 w-4 mr-2" />
               Crear Curso
             </Button>
           </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cursosOrdenados.map((curso, index) => {
              const { horasAsignadas, excedeLimite } = calcularEstadisticasHoras(curso);
              return (
                <Card key={curso.id} className={cn(
                  "hover:shadow-lg transition-shadow",
                  curso.nivel === "primario" ? "bg-green-50 border-green-600" : "bg-blue-50 border-blue-600",
                )}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{curso.nombre}</CardTitle>
                      <div>
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(curso)}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(curso)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                    <CardDescription>
                      {curso.estudiantesMatriculados} estudiantes
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm">
                      <p>Horas asignadas: <span className={cn(excedeLimite ? "text-red-500" : "text-black")}>{horasAsignadas} / 40</span></p>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}