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

function CursosPageComponent() {
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
    aula: "",
    docenteTitularId: "",
  })

  if (!isInitialized || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando cursos...</p>
        </div>
      </div>
    )
  }

  const ordenarCursosAutomaticamente = (cursos) => {
    return [...cursos].sort((a, b) => {
      if (a.nivel !== b.nivel) return a.nivel === "primario" ? -1 : 1;
      const gradoA = parseInt(a.grado?.replace("°", "") || "0");
      const gradoB = parseInt(b.grado?.replace("°", "") || "0");
      if (gradoA !== gradoB) return gradoA - gradoB;
      return (a.seccion || "").localeCompare(b.seccion || "");
    });
  };
  
  const cursosOrdenados = ordenarCursosAutomaticamente(cursos);

  const handleSubmit = async (e) => {
    e.preventDefault()
    const { nivel, grado, seccion } = formData;
    if (!nivel || !grado || !seccion) {
      toast({ title: "Error", description: "Nivel, Grado y Sección son obligatorios.", variant: "destructive" })
      return
    }

    const nombreDelCurso = `${grado} ${seccion} ${nivel.charAt(0).toUpperCase() + nivel.slice(1)}`
    if (cursos.find((c) => c.nombre === nombreDelCurso && c.id !== editingCurso?.id)) {
      toast({ title: "Error", description: "Ya existe un curso con esa configuración.", variant: "destructive" })
      return
    }
    
    const cursoData = {
      ...editingCurso,
      id: editingCurso?.id || Date.now().toString(),
      nombre: nombreDelCurso,
      ...formData,
      estudiantesMatriculados: parseInt(formData.estudiantesMatriculados) || 0,
    }
    
    await saveCurso(cursoData)
    toast({ title: "Éxito", description: `Curso ${editingCurso ? "actualizado" : "creado"}.` })
    setIsDialogOpen(false)
  }

  const handleEdit = (curso) => {
    setEditingCurso(curso)
    setFormData({
      nivel: curso.nivel,
      grado: curso.grado,
      seccion: curso.seccion,
      estudiantesMatriculados: curso.estudiantesMatriculados.toString(),
      aula: curso.aula || "",
      docenteTitularId: curso.docenteTitularId || "",
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
    <>
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <GraduationCap className="h-8 w-8 text-indigo-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Cursos</h1>
            <p className="text-gray-600">Organización automática por nivel, grado y sección</p>
          </div>
        </div>
        <Button onClick={() => { setEditingCurso(null); setFormData({ nivel: "", grado: "", seccion: "", estudiantesMatriculados: "", aula: "", docenteTitularId: "" }); setIsDialogOpen(true); }} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Curso
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingCurso ? "Editar Curso" : "Crear Nuevo Curso"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Nivel *</Label><Select required value={formData.nivel} onValueChange={(v) => setFormData(f => ({...f, nivel: v}))}><SelectTrigger><SelectValue placeholder="Nivel"/></SelectTrigger><SelectContent><SelectItem value="primario">Primario</SelectItem><SelectItem value="secundario">Secundario</SelectItem></SelectContent></Select></div>
              <div><Label>Grado *</Label><Select required value={formData.grado} onValueChange={(v) => setFormData(f => ({...f, grado: v}))}><SelectTrigger><SelectValue placeholder="Grado"/></SelectTrigger><SelectContent>{["1°","2°","3°","4°","5°","6°"].map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Sección *</Label><Select required value={formData.seccion} onValueChange={(v) => setFormData(f => ({...f, seccion: v}))}><SelectTrigger><SelectValue placeholder="Sección"/></SelectTrigger><SelectContent>{["A","B","C","D","E"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Estudiantes</Label><Input type="number" value={formData.estudiantesMatriculados} onChange={e => setFormData(f => ({...f, estudiantesMatriculados: e.target.value}))}/></div>
            </div>
             <div><Label>Aula</Label><Input value={formData.aula} onChange={e => setFormData(f => ({...f, aula: e.target.value}))}/></div>
            <div>
              <Label>Docente Titular (Encargado)</Label>
              <Select value={formData.docenteTitularId} onValueChange={(v) => setFormData(f => ({...f, docenteTitularId: v}))}>
                <SelectTrigger><SelectValue placeholder="Asignar un docente titular"/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Ninguno</SelectItem>
                  {docentes.filter(d => d.tipo === 'titular' || d.tipo === 'titular_con_adicionales').map(d => <SelectItem key={d.id} value={d.id}>{d.nombre} {d.apellido}</SelectItem>)}
                </SelectContent>
              </Select>
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
           </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cursosOrdenados.map((curso) => {
              const docenteTitular = docentes.find(d => d.id === curso.docenteTitularId);
              return (
                <Card key={curso.id} className={cn(
                  "hover:shadow-lg transition-shadow border-2",
                   curso.nivel === "primario" ? "bg-green-50 border-green-700" : "bg-blue-50 border-blue-700",
                )}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{curso.nombre}</CardTitle>
                      <div>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(curso)}><Edit className="h-4 w-4"/></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(curso)}><Trash2 className="h-4 w-4"/></Button>
                      </div>
                    </div>
                    <CardDescription>{curso.estudiantesMatriculados} estudiantes</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {docenteTitular ? (
                        <div className="text-sm font-medium flex items-center gap-2 p-2 bg-white rounded border">
                            <Users className="h-4 w-4 text-gray-600"/> 
                            <span>Titular: {docenteTitular.nombre} {docenteTitular.apellido}</span>
                        </div>
                    ) : (
                        <div className="text-sm text-amber-800 flex items-center gap-2 p-2 bg-amber-100 rounded border border-amber-300">
                            <AlertTriangle className="h-4 w-4"/> 
                            <span>Sin titular asignado</span>
                        </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
    </>
  );
}

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