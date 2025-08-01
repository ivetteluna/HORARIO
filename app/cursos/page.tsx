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

export default function CursosPage() {
  const { isInitialized } = useDatabase()
  const { cursos, loading, addCurso, updateCurso, deleteCurso } = useCursos()
  const { docentes } = useDocentes()
  const { asignaturas } = useAsignaturas()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCurso, setEditingCurso] = useState(null)

  // Form state
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

  // FUNCIÓN PARA ORDENAR CURSOS AUTOMÁTICAMENTE
  const ordenarCursosAutomaticamente = (cursos) => {
    return cursos.sort((a, b) => {
      // 1. Primero por nivel (primario antes que secundario)
      if (a.nivel !== b.nivel) {
        return a.nivel === "primario" ? -1 : 1
      }

      // 2. Luego por grado (1°, 2°, 3°, etc.)
      const gradoA = Number.parseInt(a.grado?.replace("°", "") || "0")
      const gradoB = Number.parseInt(b.grado?.replace("°", "") || "0")
      if (gradoA !== gradoB) {
        return gradoA - gradoB
      }

      // 3. Finalmente por sección (A, B, C, etc.)
      return (a.seccion || "").localeCompare(b.seccion || "")
    })
  }

  // Aplicar ordenamiento automático
  const cursosOrdenados = ordenarCursosAutomaticamente([...cursos])

  // Calcular estadísticas de horas para cada curso
  const calcularEstadisticasHoras = (curso) => {
    const docentesDelCurso = docentes.filter((docente) =>
      docente.cursosAsignados?.some((ca) => ca.cursoId === curso.id),
    )

    let horasAsignadas = 0
    let horasPermitidas = 0
    const asignaturasAsignadas = new Set()

    docentesDelCurso.forEach((docente) => {
      const cursoAsignado = docente.cursosAsignados.find((ca) => ca.cursoId === curso.id)
      if (cursoAsignado?.asignaturas) {
        cursoAsignado.asignaturas.forEach((asigId) => {
          asignaturasAsignadas.add(asigId)
          const asignatura = asignaturas.find((a) => a.id === asigId)
          if (asignatura) {
            const horasSemanales = asignatura.horasPorNivel?.[curso.nivel]?.[curso.grado] || 0
            horasAsignadas += horasSemanales
          }
        })
      }
    })

    // Calcular horas permitidas (todas las asignaturas disponibles para este curso)
    asignaturas.forEach((asignatura) => {
      const horasSemanales = asignatura.horasPorNivel?.[curso.nivel]?.[curso.grado] || 0
      if (horasSemanales > 0) {
        horasPermitidas += horasSemanales
      }
    })

    // Calcular asignaturas faltantes por asignar
    const asignaturasDisponiblesParaGrado = asignaturas.filter((asig) => {
      const horasSemanales = asig.horasPorNivel?.[curso.nivel]?.[curso.grado] || 0
      return horasSemanales > 0
    })

    const asignaturasFaltantes = asignaturasDisponiblesParaGrado.filter((asig) => !asignaturasAsignadas.has(asig.id))

    const horasFaltantes = Math.max(0, horasPermitidas - horasAsignadas)
    const horasDisponibles = Math.max(0, 40 - horasAsignadas)
    const excedeLimite = horasAsignadas > 40

    return {
      horasAsignadas,
      horasPermitidas,
      horasFaltantes,
      horasDisponibles,
      excedeLimite,
      asignaturasAsignadas: asignaturasAsignadas.size,
      totalAsignaturasDisponibles: asignaturas.filter((a) => {
        const horas = a.horasPorNivel?.[curso.nivel]?.[curso.grado] || 0
        return horas > 0
      }).length,
      asignaturasDisponiblesParaGrado,
      asignaturasFaltantes,
    }
  }

  const resetForm = () => {
    setFormData({
      nivel: "",
      grado: "",
      seccion: "",
      estudiantesMatriculados: "",
    })
    setEditingCurso(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.nivel || !formData.grado || !formData.seccion) {
      toast({
        title: "Error de Validación",
        description: "Por favor, completa los campos Nivel, Grado y Sección.",
        variant: "destructive",
      })
      return
    }

    const nombreDelCurso = `${formData.grado} ${formData.seccion} ${formData.nivel.charAt(0).toUpperCase() + formData.nivel.slice(1)}`

    const cursoExistente = cursos.find(
      (c) => c.nombre === nombreDelCurso && (!editingCurso || c.id !== editingCurso.id),
    )

    if (cursoExistente) {
      toast({
        title: "Curso Duplicado",
        description: "Ya existe un curso con el mismo Nivel, Grado y Sección.",
        variant: "destructive",
      })
      return
    }

    try {
      const cursoData = {
        ...formData,
        nombre: nombreDelCurso,
        aula: "",
        estudiantesMatriculados: Number.parseInt(formData.estudiantesMatriculados) || 0,
        asignaturas: editingCurso ? editingCurso.asignaturas : [],
        horasSemanales: editingCurso ? editingCurso.horasSemanales : 0,
      }

      if (editingCurso) {
        await updateCurso(editingCurso.id, cursoData)
        toast({
          title: "Curso actualizado",
          description: `El curso ${nombreDelCurso} ha sido actualizado exitosamente.`,
        })
      } else {
        await addCurso(cursoData)
        toast({
          title: "Curso creado",
          description: `El curso ${nombreDelCurso} ha sido creado exitosamente.`,
        })
      }

      setIsDialogOpen(false)
      resetForm()
    } catch (error) {
      console.error("Error saving curso:", error)
      toast({
        title: "Error al Guardar",
        description: "No se pudo guardar el curso en la base de datos.",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (curso) => {
    setEditingCurso(curso)
    setFormData({
      nivel: curso.nivel,
      grado: curso.grado,
      seccion: curso.seccion,
      estudiantesMatriculados: curso.estudiantesMatriculados?.toString() || "",
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (curso) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar el curso ${curso.nombre}?`)) {
      try {
        await deleteCurso(curso.id)
        toast({
          title: "Curso eliminado",
          description: `El curso ${curso.nombre} ha sido eliminado`,
        })
      } catch (error) {
        console.error("Error deleting curso:", error)
        toast({
          title: "Error",
          description: "No se pudo eliminar el curso",
          variant: "destructive",
        })
      }
    }
  }

  const cursosConProblemas = cursosOrdenados.filter((curso) => {
    const stats = calcularEstadisticasHoras(curso)
    return stats.excedeLimite || stats.horasFaltantes > 0
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-cyan-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <GraduationCap className="h-8 w-8 text-indigo-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Gestión de Cursos</h1>
                <p className="text-gray-600">Organización automática por nivel, grado y sección</p>
              </div>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm} className="bg-indigo-600 hover:bg-indigo-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Curso
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>{editingCurso ? "Editar Curso" : "Crear Nuevo Curso"}</DialogTitle>
                  <DialogDescription>
                    {editingCurso
                      ? "Modifica los datos del curso existente"
                      : "Completa la información para crear un nuevo curso"}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nivel">Nivel *</Label>
                      <Select value={formData.nivel} onValueChange={(value) => setFormData({ ...formData, nivel: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar nivel" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="primario">Primario</SelectItem>
                          <SelectItem value="secundario">Secundario</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="grado">Grado *</Label>
                      <Select value={formData.grado} onValueChange={(value) => setFormData({ ...formData, grado: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar grado" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1°">1°</SelectItem>
                          <SelectItem value="2°">2°</SelectItem>
                          <SelectItem value="3°">3°</SelectItem>
                          <SelectItem value="4°">4°</SelectItem>
                          <SelectItem value="5°">5°</SelectItem>
                          <SelectItem value="6°">6°</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="seccion">Sección *</Label>
                      <Select value={formData.seccion} onValueChange={(value) => setFormData({ ...formData, seccion: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar sección" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="A">A</SelectItem>
                          <SelectItem value="B">B</SelectItem>
                          <SelectItem value="C">C</SelectItem>
                          <SelectItem value="D">D</SelectItem>
                          <SelectItem value="E">E</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="estudiantesMatriculados">Estudiantes</Label>
                      <Input
                        id="estudiantesMatriculados"
                        type="number"
                        placeholder="Número de estudiantes"
                        value={formData.estudiantesMatriculados}
                        onChange={(e) => setFormData({ ...formData, estudiantesMatriculados: e.target.value })}
                      />
                    </div>
                  </div>
                  <DialogFooter className="pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                      {editingCurso ? "Actualizar" : "Crear"} Curso
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Alert className="mb-6">
          <ArrowUpDown className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <div>
                <strong>📋 Ordenamiento Automático Activo:</strong> Los cursos se organizan automáticamente por nivel
                (Primario → Secundario), luego por grado (1° → 6°) y finalmente por sección (A → C).
              </div>
              <Badge variant="outline" className="ml-4">
                <Hash className="h-3 w-3 mr-1" />
                {cursosOrdenados.length} cursos ordenados
              </Badge>
            </div>
          </AlertDescription>
        </Alert>

        {cursosConProblemas.length > 0 && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>⚠️ Cursos con problemas de horas ({cursosConProblemas.length}):</strong>
              <div className="mt-2 space-y-1">
                {cursosConProblemas.slice(0, 3).map((curso) => {
                  const stats = calcularEstadisticasHoras(curso)
                  return (
                    <div key={curso.id} className="text-sm">
                      • <strong>{curso.nombre}</strong>:
                      {stats.excedeLimite && ` Excede límite (${stats.horasAsignadas}h/40h)`}
                      {stats.horasFaltantes > 0 && ` Faltan ${stats.horasFaltantes}h por asignar`}
                    </div>
                  )
                })}
                {cursosConProblemas.length > 3 && (
                  <div className="text-sm">... y {cursosConProblemas.length - 3} más</div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/90 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Cursos</p>
                  <p className="text-3xl font-bold text-indigo-600">{cursosOrdenados.length}</p>
                </div>
                <GraduationCap className="h-8 w-8 text-indigo-600 opacity-80" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/90 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Primaria</p>
                  <p className="text-3xl font-bold text-emerald-600">
                    {cursosOrdenados.filter((c) => c.nivel === "primario").length}
                  </p>
                </div>
                <BookOpen className="h-8 w-8 text-emerald-600 opacity-80" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/90 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Secundaria</p>
                  <p className="text-3xl font-bold text-amber-600">
                    {cursosOrdenados.filter((c) => c.nivel === "secundario").length}
                  </p>
                </div>
                <Users className="h-8 w-8 text-amber-600 opacity-80" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/90 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Con Problemas</p>
                  <p className="text-3xl font-bold text-red-600">{cursosConProblemas.length}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600 opacity-80" />
              </div>
            </CardContent>
          </Card>
        </div>

        {cursosOrdenados.length === 0 ? (
          <Card className="bg-white/90 backdrop-blur-sm">
            <CardContent className="p-12 text-center">
              <GraduationCap className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No hay cursos registrados</h3>
              <p className="text-gray-500 mb-6">Comienza creando tu primer curso para organizar el horario escolar</p>
              <Button onClick={() => setIsDialogOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
                <Plus className="h-4 w-4 mr-2" />
                Crear Primer Curso
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cursosOrdenados.map((curso, index) => {
              const stats = calcularEstadisticasHoras(curso)
              const docenteTitular = docentes.find((docente) =>
                docente.cursosAsignados?.some((ca) => ca.cursoId === curso.id && docente.tipo === "titular"),
              )

              return (
                <Card key={curso.id} className="bg-white/90 backdrop-blur-sm hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          #{(index + 1).toString().padStart(2, "0")}
                        </Badge>
                        <CardTitle className="text-lg">{curso.nombre}</CardTitle>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(curso)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(curso)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <CardDescription className="flex items-center gap-2">
                      <span className="capitalize">{curso.nivel}</span>
                      <span>•</span>
                      <span>{curso.grado}</span>
                      <span>•</span>
                      <span>Sección {curso.seccion}</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {curso.estudiantesMatriculados > 0 && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Users className="h-4 w-4" />
                        <span>{curso.estudiantesMatriculados} estudiantes</span>
                      </div>
                    )}

                    {docenteTitular ? (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-green-800">Docente Titular</span>
                        </div>
                        <p className="text-sm text-green-700">
                          {docenteTitular.nombre} {docenteTitular.apellido}
                        </p>
                      </div>
                    ) : (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <AlertCircle className="h-4 w-4 text-amber-600" />
                          <span className="text-sm font-medium text-amber-800">Sin Docente Titular</span>
                        </div>
                        <p className="text-xs text-amber-700">Asigna un docente titular a este curso</p>
                      </div>
                    )}

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Horas asignadas:</span>
                        <span className={`font-medium ${stats.excedeLimite ? "text-red-600" : "text-gray-900"}`}>
                          {stats.horasAsignadas}h / 40h
                        </span>
                      </div>

                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            stats.excedeLimite
                              ? "bg-red-500"
                              : stats.horasAsignadas > 30
                              ? "bg-amber-500"
                              : "bg-green-500"
                          }`}
                          style={{ width: `${Math.min((stats.horasAsignadas / 40) * 100, 100)}%` }}
                        ></div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>
                          Asignaturas: {stats.asignaturasAsignadas}/{stats.totalAsignaturasDisponibles}
                        </span>
                        {stats.excedeLimite ? (
                          <span className="text-red-600 font-medium">Excede {stats.horasAsignadas - 40}h</span>
                        ) : stats.horasFaltantes > 0 ? (
                          <span className="text-amber-600">Faltan {stats.horasFaltantes}h</span>
                        ) : (
                          <span className="text-green-600">Completo</span>
                        )}
                      </div>
                    </div>

                    {stats.asignaturasFaltantes && stats.asignaturasFaltantes.length > 0 && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="h-4 w-4 text-amber-600" />
                          <span className="text-sm font-medium text-amber-800">
                            Asignaturas Faltantes ({stats.asignaturasFaltantes.length})
                          </span>
                        </div>
                        <div className="space-y-1">
                          {stats.asignaturasFaltantes.slice(0, 3).map((asignatura) => (
                            <div key={asignatura.id} className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: asignatura.color }} />
                                <span className="text-amber-700">{asignatura.nombre}</span>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {asignatura.horasPorNivel?.[curso.nivel]?.[curso.grado] || 0}h/sem
                              </Badge>
                            </div>
                          ))}
                          {stats.asignaturasFaltantes.length > 3 && (
                            <div className="text-xs text-amber-600 text-center pt-1">
                              +{stats.asignaturasFaltantes.length - 3} asignaturas más
                            </div>
                          )}
                        </div>
                        <div className="mt-2 pt-2 border-t border-amber-200">
                          <Link href="/docentes">
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full text-amber-700 border-amber-300 hover:bg-amber-100 bg-transparent"
                            >
                              <Users className="h-3 w-3 mr-1" />
                              Asignar Docentes
                            </Button>
                          </Link>
                        </div>
                      </div>
                    )}

                    {stats.excedeLimite && (
                      <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                          Este curso excede las 40 horas semanales permitidas
                        </AlertDescription>
                      </Alert>
                    )}
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