"use client"

import type React from "react"
import { useState } from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Plus,
  Edit,
  Trash2,
  Users,
  Mail,
  Phone,
  BookOpen,
  GraduationCap,
  Search,
  AlertCircle,
  AlertTriangle,
  Clock,
  Info,
  CheckCircle,
  Eye,
  EyeOff,
  ArrowUpDown,
} from "lucide-react"
import { useDocentes, useAsignaturas, useCursos, useDatabase, useNiveles } from "@/hooks/useDatabase"
import type { DocenteDB } from "@/lib/database"
import { toast } from "@/hooks/use-toast"

const especialidadesComunes = [
  "Educación Básica",
  "Matemáticas",
  "Lengua Española",
  "Ciencias Naturales",
  "Ciencias Sociales",
  "Educación Física",
  "Educación Artística",
  "Inglés",
  "Francés",
  "Informática",
  "Orientación y Psicología",
  "Biblioteca",
]

// FUNCIÓN DE ORDENAMIENTO AUTOMÁTICO DE CURSOS
const ordenarCursosAutomaticamente = (cursos: any[]) => {
  return cursos.sort((a, b) => {
    // Primero ordenar por nivel (primario antes que secundario)
    if (a.nivel !== b.nivel) {
      return a.nivel === "primario" ? -1 : 1
    }

    // Luego ordenar por grado (1°, 2°, 3°, etc.)
    const gradoA = Number.parseInt(a.grado?.replace("°", "") || "0")
    const gradoB = Number.parseInt(b.grado?.replace("°", "") || "0")

    if (gradoA !== gradoB) {
      return gradoA - gradoB
    }

    // Finalmente ordenar por sección (A, B, C, etc.)
    return (a.seccion || "").localeCompare(b.seccion || "")
  })
}

// FUNCIÓN DE ORDENAMIENTO DE DOCENTES POR CURSO ASIGNADO
const ordenarDocentesPorCurso = (docentes: any[], cursos: any[]) => {
  // Crear un mapa de orden de cursos
  const cursosOrdenados = ordenarCursosAutomaticamente(cursos)
  const ordenCursos = new Map()
  cursosOrdenados.forEach((curso, index) => {
    ordenCursos.set(curso.id, index)
  })

  return docentes.sort((a, b) => {
    // Primero los docentes titulares
    if (a.tipo !== b.tipo) {
      return a.tipo === "titular" ? -1 : 1
    }

    // Si ambos son titulares, ordenar por el curso que tienen asignado
    if (a.tipo === "titular" && b.tipo === "titular") {
      const cursoA = a.cursosAsignados?.[0]?.cursoId
      const cursoB = b.cursosAsignados?.[0]?.cursoId

      const ordenA = ordenCursos.get(cursoA) ?? 999
      const ordenB = ordenCursos.get(cursoB) ?? 999

      if (ordenA !== ordenB) {
        return ordenA - ordenB
      }
    }

    // Si son de área o no tienen curso específico, ordenar alfabéticamente
    return `${a.nombre} ${a.apellido}`.localeCompare(`${b.nombre} ${b.apellido}`)
  })
}

export default function DocentesPage() {
  const { isInitialized } = useDatabase()
  const { docentes, loading: loadingDocentes, saveDocente, deleteDocente } = useDocentes()
  const { asignaturas, loading: loadingAsignaturas } = useAsignaturas()
  const { cursos, loading: loadingCursos } = useCursos()
  const { niveles } = useNiveles()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingDocente, setEditingDocente] = useState<DocenteDB | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterTipo, setFilterTipo] = useState<"todos" | "titular" | "area">("todos")
  const [filterNivel, setFilterNivel] = useState<"todos" | "primario" | "secundario" | "ambos">("todos")

  const loading = loadingDocentes || loadingAsignaturas || loadingCursos

  if (!isInitialized || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-cyan-100 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando docentes...</p>
        </div>
      </div>
    )
  }

  // Datos seguros
  const safeDocentes = docentes || []
  const safeAsignaturas = asignaturas || []
  const safeCursos = cursos || []

  // APLICAR ORDENAMIENTO AUTOMÁTICO A LOS DOCENTES
  const docentesOrdenados = ordenarDocentesPorCurso(safeDocentes, safeCursos)

  const filteredDocentes = docentesOrdenados.filter((docente) => {
    if (!docente) return false

    const matchesSearch =
      docente.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      docente.apellido?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      docente.especialidad?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      docente.cedula?.includes(searchTerm)

    const matchesTipo = filterTipo === "todos" || docente.tipo === filterTipo
    const matchesNivel = filterNivel === "todos" || docente.nivel === filterNivel

    return matchesSearch && matchesTipo && matchesNivel
  })

  const docentesTitulares = docentesOrdenados.filter((d) => d && d.tipo === "titular")
  const docentesArea = docentesOrdenados.filter((d) => d && d.tipo === "area")

  const handleAdd = () => {
    setEditingDocente(null)
    setIsDialogOpen(true)
  }

  const handleEdit = (docente: DocenteDB) => {
    setEditingDocente(docente)
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm("¿Estás seguro de que deseas eliminar este docente?")) {
      try {
        await deleteDocente(id)
        toast({
          title: "Docente eliminado",
          description: "El docente ha sido eliminado correctamente",
        })
      } catch (error) {
        console.error("Error deleting docente:", error)
        toast({
          title: "Error",
          description: "No se pudo eliminar el docente",
          variant: "destructive",
        })
      }
    }
  }

  // Calcular estadísticas de carga horaria
  const getDocenteStats = (docente: DocenteDB) => {
    if (!docente || !docente.cursosAsignados) {
      return { horasAsignadas: 0, cursosCount: 0, asignaturasCount: 0 }
    }

    const horasAsignadas = docente.cursosAsignados.reduce((total, curso) => total + (curso.horasAsignadas || 0), 0)
    const cursosCount = docente.cursosAsignados.length
    const asignaturasCount = new Set(docente.cursosAsignados.flatMap((curso) => curso.asignaturas || [])).size

    return { horasAsignadas, cursosCount, asignaturasCount }
  }

  // Función para obtener estadísticas de cursos
  const getCursoStats = (curso: any) => {
    if (!curso) {
      return {
        horasAsignadas: 0,
        horasDisponibles: 40,
        horasRestantes: 40,
        porcentajeAsignado: 0,
        excedeLimite: false,
      }
    }

    const horasAsignadas = safeDocentes.reduce((total, docente) => {
      if (!docente || !docente.cursosAsignados) return total
      const asignacionCurso = docente.cursosAsignados.find((c) => c.cursoId === curso.id)
      return total + (asignacionCurso?.horasAsignadas || 0)
    }, 0)

    const horasDisponibles = curso.horasSemanales || 40
    const porcentajeAsignado = horasDisponibles > 0 ? (horasAsignadas / horasDisponibles) * 100 : 0

    return {
      horasAsignadas,
      horasDisponibles,
      horasRestantes: horasDisponibles - horasAsignadas,
      porcentajeAsignado,
      excedeLimite: horasAsignadas > horasDisponibles,
    }
  }

  // Función para detectar conflictos de asignación
  const detectarConflictos = () => {
    const conflictosArray: Array<{
      tipo: "docente_multiple" | "curso_excedido" | "asignatura_duplicada"
      mensaje: string
      severidad: "warning" | "error"
      detalles: any
    }> = []

    // Detectar cursos que exceden las 40 horas
    safeCursos.forEach((curso) => {
      if (!curso) return
      const stats = getCursoStats(curso)
      if (stats.excedeLimite) {
        conflictosArray.push({
          tipo: "curso_excedido",
          mensaje: `El curso ${curso.nombre} excede las horas semanales permitidas`,
          severidad: "error",
          detalles: {
            curso: curso.nombre,
            horasAsignadas: stats.horasAsignadas,
            horasPermitidas: stats.horasDisponibles,
            exceso: stats.horasAsignadas - stats.horasDisponibles,
          },
        })
      }
    })

    return conflictosArray
  }

  const conflictos = detectarConflictos()

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-cyan-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Users className="h-8 w-8 text-indigo-600" />
                <h1 className="text-3xl font-bold text-gray-900">Gestión de Docentes</h1>
                <Badge variant="outline" className="flex items-center gap-1">
                  <ArrowUpDown className="h-3 w-3" />
                  Ordenamiento por Curso
                </Badge>
              </div>
              <p className="text-gray-600">
                Docentes organizados automáticamente: Titulares por curso asignado, luego docentes de área
              </p>
            </div>
            <Button onClick={handleAdd} className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="h-4 w-4 mr-2" />
              Agregar Docente
            </Button>
          </div>
        </div>

        {/* Información sobre el ordenamiento de docentes */}
        <Alert className="mb-6">
          <ArrowUpDown className="h-4 w-4" />
          <AlertDescription>
            <strong>👨‍🏫 Ordenamiento Automático de Docentes:</strong>
            <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <strong>🎯 Docentes Titulares:</strong> Ordenados según el curso que tienen asignado (1°A, 1°B, 2°A,
                etc.)
              </div>
              <div>
                <strong>📚 Docentes de Área:</strong> Ordenados alfabéticamente después de los titulares
              </div>
            </div>
          </AlertDescription>
        </Alert>

        {/* Información sobre tipos de docentes - ACTUALIZADA */}
        <Alert className="mb-6">
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Sistema Flexible de Asignaciones:</strong>
            <ul className="mt-2 space-y-1 text-sm">
              <li>
                • <strong>Sin Límites:</strong> Los docentes pueden tener múltiples asignaturas por curso y tantos
                cursos como sea necesario.
              </li>
              <li>
                • <strong>Docentes Titulares:</strong> Pueden ser responsables de un curso específico e impartir
                múltiples asignaturas.
              </li>
              <li>
                • <strong>Docentes de Área:</strong> Especialistas que pueden impartir múltiples asignaturas en
                múltiples cursos.
              </li>
            </ul>
          </AlertDescription>
        </Alert>

        {/* Alertas de conflictos */}
        {conflictos.length > 0 && (
          <div className="mb-6 space-y-3">
            {conflictos.slice(0, 3).map((conflicto, index) => (
              <Alert key={index} variant={conflicto.severidad === "error" ? "destructive" : "default"}>
                {conflicto.severidad === "error" ? (
                  <AlertTriangle className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <AlertDescription>
                  <strong>{conflicto.severidad === "error" ? "Error:" : "Advertencia:"}</strong> {conflicto.mensaje}
                  {conflicto.detalles && (
                    <div className="mt-2 text-sm">
                      {conflicto.tipo === "curso_excedido" && (
                        <span>
                          Horas asignadas: {conflicto.detalles.horasAsignadas}h / Permitidas:{" "}
                          {conflicto.detalles.horasPermitidas}h (Exceso: {conflicto.detalles.exceso}h)
                        </span>
                      )}
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            ))}
            {conflictos.length > 3 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Y {conflictos.length - 3} conflictos adicionales. Revisa las asignaciones para más detalles.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/90 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Docentes Titulares</p>
                  <p className="text-3xl font-bold text-indigo-600">{docentesTitulares.length}</p>
                  <p className="text-xs text-gray-500">Ordenados por curso</p>
                </div>
                <GraduationCap className="h-12 w-12 text-indigo-600 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Docentes de Área</p>
                  <p className="text-3xl font-bold text-emerald-600">{docentesArea.length}</p>
                  <p className="text-xs text-gray-500">Orden alfabético</p>
                </div>
                <BookOpen className="h-12 w-12 text-emerald-600 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Conflictos</p>
                  <p className={`text-3xl font-bold ${conflictos.length > 0 ? "text-red-600" : "text-green-600"}`}>
                    {conflictos.length}
                  </p>
                  <p className="text-xs text-gray-500">Detectados automáticamente</p>
                </div>
                {conflictos.length > 0 ? (
                  <AlertTriangle className="h-12 w-12 text-red-600 opacity-80" />
                ) : (
                  <Clock className="h-12 w-12 text-green-600 opacity-80" />
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Horas Totales</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {safeDocentes.reduce((total, d) => total + (d?.horasDisponibles || 0), 0)}
                  </p>
                  <p className="text-xs text-gray-500">Capacidad total</p>
                </div>
                <Badge className="h-12 w-12 text-purple-600 opacity-80 bg-transparent border-0">
                  <span className="text-2xl">⏰</span>
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-white/90 backdrop-blur-sm mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Buscar por nombre, cédula o especialidad..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={filterTipo} onValueChange={(value: any) => setFilterTipo(value)}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filtrar por tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los tipos</SelectItem>
                  <SelectItem value="titular">Docentes Titulares</SelectItem>
                  <SelectItem value="area">Docentes de Área</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterNivel} onValueChange={(value: any) => setFilterNivel(value)}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filtrar por nivel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los niveles</SelectItem>
                  <SelectItem value="primario">Nivel Primario</SelectItem>
                  <SelectItem value="secundario">Nivel Secundario</SelectItem>
                  <SelectItem value="ambos">Ambos Niveles</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Docentes Tabs */}
        <Tabs defaultValue="todos" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="todos">Todos ({safeDocentes.length})</TabsTrigger>
            <TabsTrigger value="titulares">Titulares ({docentesTitulares.length})</TabsTrigger>
            <TabsTrigger value="area">De Área ({docentesArea.length})</TabsTrigger>
            <TabsTrigger value="niveles">Por Niveles</TabsTrigger>
          </TabsList>

          <TabsContent value="todos" className="space-y-6">
            <DocentesList
              docentes={filteredDocentes}
              asignaturas={safeAsignaturas}
              cursos={safeCursos}
              getDocenteStats={getDocenteStats}
              getCursoStats={getCursoStats}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </TabsContent>

          <TabsContent value="titulares" className="space-y-6">
            <DocentesList
              docentes={filteredDocentes.filter((d) => d && d.tipo === "titular")}
              asignaturas={safeAsignaturas}
              cursos={safeCursos}
              getDocenteStats={getDocenteStats}
              getCursoStats={getCursoStats}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </TabsContent>

          <TabsContent value="area" className="space-y-6">
            <DocentesList
              docentes={filteredDocentes.filter((d) => d && d.tipo === "area")}
              asignaturas={safeAsignaturas}
              cursos={safeCursos}
              getDocenteStats={getDocenteStats}
              getCursoStats={getCursoStats}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </TabsContent>

          <TabsContent value="niveles" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/90 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-2xl">🎒</span>
                    Nivel Primario
                  </CardTitle>
                  <CardDescription>Docentes que enseñan de 1° a 6° grado primario</CardDescription>
                </CardHeader>
                <CardContent>
                  <DocentesList
                    docentes={filteredDocentes.filter((d) => d && (d.nivel === "primario" || d.nivel === "ambos"))}
                    asignaturas={safeAsignaturas}
                    cursos={safeCursos}
                    getDocenteStats={getDocenteStats}
                    getCursoStats={getCursoStats}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    compact={true}
                  />
                </CardContent>
              </Card>

              <Card className="bg-white/90 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-2xl">🎓</span>
                    Nivel Secundario
                  </CardTitle>
                  <CardDescription>Docentes que enseñan de 1° a 6° grado secundario</CardDescription>
                </CardHeader>
                <CardContent>
                  <DocentesList
                    docentes={filteredDocentes.filter((d) => d && (d.nivel === "secundario" || d.nivel === "ambos"))}
                    asignaturas={safeAsignaturas}
                    cursos={safeCursos}
                    getDocenteStats={getDocenteStats}
                    getCursoStats={getCursoStats}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    compact={true}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingDocente ? "Editar Docente" : "Agregar Docente"}</DialogTitle>
              <DialogDescription>
                {editingDocente ? "Modifica la información del docente" : "Ingresa la información del nuevo docente"}
              </DialogDescription>
            </DialogHeader>
            <DocenteForm
              docente={editingDocente}
              asignaturas={safeAsignaturas}
              cursos={safeCursos}
              niveles={niveles}
              getCursoStats={getCursoStats}
              onSave={async (docente) => {
                try {
                  console.log("Guardando docente con asignaciones:", docente.cursosAsignados?.length || 0)
                  await saveDocente(docente)
                  setIsDialogOpen(false)
                  toast({
                    title: editingDocente ? "Docente actualizado" : "Docente agregado",
                    description: "Los cambios se han guardado correctamente",
                  })
                } catch (error) {
                  console.error("Error saving docente:", error)
                  toast({
                    title: "Error",
                    description: "No se pudo guardar el docente",
                    variant: "destructive",
                  })
                }
              }}
              onCancel={() => setIsDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

function DocentesList({
  docentes,
  asignaturas,
  cursos,
  getDocenteStats,
  getCursoStats,
  onEdit,
  onDelete,
  compact = false,
}: {
  docentes: DocenteDB[]
  asignaturas: any[]
  cursos: any[]
  getDocenteStats: (docente: DocenteDB) => { horasAsignadas: number; cursosCount: number; asignaturasCount: number }
  getCursoStats: (curso: any) => any
  onEdit: (docente: DocenteDB) => void
  onDelete: (id: string) => void
  compact?: boolean
}) {
  const [expandedDocentes, setExpandedDocentes] = useState<Set<string>>(new Set())

  const toggleExpanded = (docenteId: string) => {
    const newExpanded = new Set(expandedDocentes)
    if (newExpanded.has(docenteId)) {
      newExpanded.delete(docenteId)
    } else {
      newExpanded.add(docenteId)
    }
    setExpandedDocentes(newExpanded)
  }

  if (!docentes || docentes.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No hay docentes</h3>
        <p className="text-gray-500">No se encontraron docentes con los filtros aplicados</p>
      </div>
    )
  }

  return (
    <div className={`grid grid-cols-1 ${compact ? "gap-3" : "md:grid-cols-2 lg:grid-cols-3 gap-6"}`}>
      {docentes.map((docente, index) => {
        if (!docente || !docente.id) return null

        const stats = getDocenteStats(docente)
        const cargaHoraria = docente.horasDisponibles > 0 ? (stats.horasAsignadas / docente.horasDisponibles) * 100 : 0
        const isExpanded = expandedDocentes.has(docente.id)

        // Obtener el curso asignado para mostrar el orden
        const cursoAsignado = docente.cursosAsignados?.[0]
        const curso = cursos.find((c) => c.id === cursoAsignado?.cursoId)

        return (
          <Card key={docente.id} className="border-2 hover:shadow-md transition-shadow border-gray-200">
            <CardContent className={compact ? "p-4" : "p-6"}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary" className="text-xs font-mono">
                      #{(index + 1).toString().padStart(2, "0")}
                    </Badge>
                    <h3 className={`font-semibold ${compact ? "text-base" : "text-lg"} text-gray-900`}>
                      {docente.nombre?.toUpperCase()} {docente.apellido?.toUpperCase()}
                    </h3>
                  </div>
                  <div className="flex gap-2 mt-1 flex-wrap">
                    <Badge variant={docente.tipo === "titular" ? "default" : "secondary"}>
                      {docente.tipo === "titular" ? "Titular" : "Área"}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {docente.nivel === "ambos"
                        ? "Primario/Secundario"
                        : docente.nivel === "primario"
                          ? "Primario"
                          : "Secundario"}
                    </Badge>
                    {curso && docente.tipo === "titular" && (
                      <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                        📚 {curso.nombre}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => onEdit(docente)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => onDelete(docente.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {!compact && (
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Cédula:</span>
                    <span>{docente.cedula}</span>
                  </div>
                  {docente.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span>{docente.email}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    <span>{docente.telefono}</span>
                  </div>
                </div>
              )}

              {/* Carga Horaria */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Carga Horaria</span>
                  <span className="text-sm text-gray-600">
                    {stats.horasAsignadas}/{docente.horasDisponibles}h
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      cargaHoraria >= 100 ? "bg-red-500" : cargaHoraria >= 80 ? "bg-yellow-500" : "bg-green-500"
                    }`}
                    style={{ width: `${Math.min(cargaHoraria, 100)}%` }}
                  />
                </div>
                <div className="text-xs text-gray-500 mt-1">{cargaHoraria.toFixed(1)}% de capacidad</div>
              </div>

              <div className="space-y-2">
                <div>
                  <p className="text-sm font-medium text-gray-700">Especialidad:</p>
                  <Badge variant="secondary" className="mt-1">
                    {docente.especialidad}
                  </Badge>
                </div>

                {/* Estadísticas de asignación */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-blue-50 p-2 rounded">
                    <div className="text-lg font-bold text-blue-600">{stats.cursosCount}</div>
                    <div className="text-xs text-blue-600">Cursos</div>
                  </div>
                  <div className="bg-green-50 p-2 rounded">
                    <div className="text-lg font-bold text-green-600">{stats.asignaturasCount}</div>
                    <div className="text-xs text-green-600">Asignaturas</div>
                  </div>
                  <div className="bg-purple-50 p-2 rounded">
                    <div className="text-lg font-bold text-purple-600">{stats.horasAsignadas}</div>
                    <div className="text-xs text-purple-600">Horas</div>
                  </div>
                </div>

                {/* Mostrar cursos asignados con TODAS las asignaturas */}
                {docente.cursosAsignados && docente.cursosAsignados.length > 0 ? (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-gray-700">
                        Asignaciones ({docente.cursosAsignados.length}):
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleExpanded(docente.id)}
                        className="h-6 px-2 text-xs"
                      >
                        {isExpanded ? (
                          <>
                            <EyeOff className="h-3 w-3 mr-1" />
                            Ocultar
                          </>
                        ) : (
                          <>
                            <Eye className="h-3 w-3 mr-1" />
                            Ver Todo
                          </>
                        )}
                      </Button>
                    </div>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {docente.cursosAsignados.map((cursoAsignado, index) => {
                        const curso = cursos.find((c) => c && c.id === cursoAsignado.cursoId)
                        const asignaturasInfo = (cursoAsignado.asignaturas || []).map((asigId) => {
                          const asig = asignaturas.find((a) => a && a.id === asigId)
                          return {
                            id: asigId,
                            codigo: asig?.codigo || asigId,
                            nombre: asig?.nombre || asigId,
                            color: asig?.color || "#3B82F6",
                          }
                        })

                        return (
                          <div
                            key={`${cursoAsignado.cursoId}-${index}`}
                            className="text-xs p-3 rounded border bg-gray-50 border-gray-200"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="font-medium text-sm">{curso?.nombre || "Curso no encontrado"}</div>
                              <Badge variant="outline" className="text-xs">
                                {cursoAsignado.horasAsignadas || 0}h
                              </Badge>
                            </div>

                            {/* Mostrar TODAS las asignaturas */}
                            {asignaturasInfo.length > 0 && (
                              <div className="text-xs text-gray-600">
                                <span className="font-medium mb-2 block">Asignaturas ({asignaturasInfo.length}):</span>
                                <div className="grid grid-cols-1 gap-1">
                                  {(isExpanded ? asignaturasInfo : asignaturasInfo.slice(0, 3)).map((asig, idx) => (
                                    <div
                                      key={asig.id}
                                      className="flex items-center gap-2 bg-white px-2 py-1 rounded border"
                                    >
                                      <div
                                        className="w-2 h-2 rounded-full flex-shrink-0"
                                        style={{ backgroundColor: asig.color }}
                                      />
                                      <span className="font-medium">{asig.codigo}</span>
                                      <span className="text-gray-500 text-xs truncate">{asig.nombre}</span>
                                    </div>
                                  ))}
                                  {!isExpanded && asignaturasInfo.length > 3 && (
                                    <div className="text-center text-gray-500 text-xs py-1">
                                      +{asignaturasInfo.length - 3} asignaturas más
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                      <span className="text-sm text-amber-800 font-medium">Sin asignaciones</span>
                    </div>
                    <p className="text-xs text-amber-700 mt-1">
                      Este docente no está asignado a ningún curso. Edítalo para asignarlo.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

function DocenteForm({
  docente,
  asignaturas,
  cursos,
  niveles,
  getCursoStats,
  onSave,
  onCancel,
}: {
  docente: DocenteDB | null
  asignaturas: any[]
  cursos: any[]
  niveles: any[]
  getCursoStats: (curso: any) => any
  onSave: (docente: DocenteDB) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState<Partial<DocenteDB>>({
    nombre: docente?.nombre || "",
    apellido: docente?.apellido || "",
    cedula: docente?.cedula || "",
    especialidad: docente?.especialidad || especialidadesComunes[0],
    email: docente?.email || "",
    telefono: docente?.telefono || "",
    tipo: docente?.tipo || "titular",
    nivel: docente?.nivel || "primario",
    horasDisponibles: docente?.horasDisponibles || 40,
    cursosAsignados: docente?.cursosAsignados ? JSON.parse(JSON.stringify(docente.cursosAsignados)) : [],
    restricciones: docente?.restricciones || [],
  })

  const [restriccionesInput, setRestriccionesInput] = useState(docente?.restricciones?.join(", ") || "")
  const [customEspecialidad, setCustomEspecialidad] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validaciones básicas
    if (!formData.nombre?.trim() || !formData.apellido?.trim() || !formData.cedula?.trim()) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos obligatorios",
        variant: "destructive",
      })
      return
    }

    const id = docente?.id || Date.now().toString()
    const finalEspecialidad = customEspecialidad.trim() || formData.especialidad || "Sin especialidad"

    const docenteToSave = {
      ...formData,
      id,
      especialidad: finalEspecialidad,
      restricciones: restriccionesInput
        .split(",")
        .map((r) => r.trim())
        .filter(Boolean),
      cursosAsignados: formData.cursosAsignados || [],
    } as DocenteDB

    console.log("Guardando docente con", docenteToSave.cursosAsignados.length, "asignaciones")
    onSave(docenteToSave)
  }

  // Filtrar cursos por nivel del docente Y APLICAR ORDENAMIENTO
  const cursosDisponibles = ordenarCursosAutomaticamente(
    (cursos || []).filter((curso) => {
      if (!curso) return false
      return formData.nivel === "ambos" || curso.nivel === formData.nivel
    }),
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Información sobre ordenamiento */}
      <Alert>
        <ArrowUpDown className="h-4 w-4" />
        <AlertDescription>
          <strong>📋 Ordenamiento Automático:</strong> Los cursos disponibles están ordenados automáticamente (1°A, 1°B,
          2°A, etc.)
        </AlertDescription>
      </Alert>

      {/* Información Personal */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Información Personal</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="nombre">Nombre *</Label>
            <Input
              id="nombre"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="apellido">Apellido *</Label>
            <Input
              id="apellido"
              value={formData.apellido}
              onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="cedula">Cédula *</Label>
            <Input
              id="cedula"
              value={formData.cedula}
              onChange={(e) => setFormData({ ...formData, cedula: e.target.value })}
              placeholder="000-0000000-0"
              required
            />
          </div>
          <div>
            <Label htmlFor="telefono">Teléfono *</Label>
            <Input
              id="telefono"
              value={formData.telefono}
              onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
              placeholder="(809) 555-0123"
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor="email">Email (opcional)</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="ejemplo@correo.com"
          />
        </div>
      </div>

      {/* Información Profesional */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Información Profesional</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="tipo">Tipo de Docente</Label>
            <Select
              value={formData.tipo || "titular"}
              onValueChange={(value: "titular" | "area") => setFormData({ ...formData, tipo: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="titular">Docente Titular</SelectItem>
                <SelectItem value="area">Docente de Área</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="nivel">Nivel Educativo</Label>
            <Select
              value={formData.nivel || "primario"}
              onValueChange={(value: "primario" | "secundario" | "ambos") => setFormData({ ...formData, nivel: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="primario">Nivel Primario</SelectItem>
                <SelectItem value="secundario">Nivel Secundario</SelectItem>
                <SelectItem value="ambos">Ambos Niveles</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="especialidad">Especialidad</Label>
            <div className="space-y-2">
              <Select
                value={
                  especialidadesComunes.includes(formData.especialidad || "")
                    ? formData.especialidad || especialidadesComunes[0]
                    : "custom"
                }
                onValueChange={(value) => {
                  if (value !== "custom") {
                    setFormData({ ...formData, especialidad: value })
                    setCustomEspecialidad("")
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar especialidad" />
                </SelectTrigger>
                <SelectContent>
                  {especialidadesComunes.map((esp) => (
                    <SelectItem key={esp} value={esp}>
                      {esp}
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">Otra especialidad...</SelectItem>
                </SelectContent>
              </Select>
              {(!especialidadesComunes.includes(formData.especialidad || "") || customEspecialidad) && (
                <Input
                  placeholder="Escribir especialidad personalizada"
                  value={customEspecialidad || formData.especialidad}
                  onChange={(e) => {
                    setCustomEspecialidad(e.target.value)
                    setFormData({ ...formData, especialidad: e.target.value })
                  }}
                />
              )}
            </div>
          </div>
          <div>
            <Label htmlFor="horas">Horas Disponibles</Label>
            <Input
              id="horas"
              type="number"
              value={formData.horasDisponibles}
              onChange={(e) => setFormData({ ...formData, horasDisponibles: Number.parseInt(e.target.value) || 40 })}
              min="1"
              max="40"
              required
            />
          </div>
        </div>
      </div>

      {/* Asignaciones por curso - SIN LÍMITES */}
      <div className="space-y-4">
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-indigo-600" />
            Asignaciones por Curso - SIN LÍMITES
          </h3>
          <p className="text-sm text-indigo-700 mt-1">
            Los docentes pueden tener múltiples asignaturas por curso y tantos cursos como sea necesario.
          </p>
        </div>

        {/* Agregar nueva asignación */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3">Agregar Nueva Asignación</h4>
          <AsignacionForm
            nivel={formData.nivel || "primario"}
            tipoDocente={formData.tipo || "titular"}
            cursos={cursosDisponibles}
            asignaturas={asignaturas}
            getCursoStats={getCursoStats}
            cursosAsignadosActuales={formData.cursosAsignados || []}
            onAdd={(nuevaAsignacion) => {
              try {
                console.log("Agregando nueva asignación:", nuevaAsignacion)

                const currentCursos = formData.cursosAsignados
                  ? JSON.parse(JSON.stringify(formData.cursosAsignados))
                  : []
                const existingIndex = currentCursos.findIndex((c) => c.cursoId === nuevaAsignacion.cursoId)

                let updatedCursos: any[]

                if (existingIndex > -1) {
                  // Si el curso ya existe, AGREGAR las asignaturas (no reemplazar)
                  updatedCursos = [...currentCursos]
                  const existingAsignaturas = updatedCursos[existingIndex].asignaturas || []
                  const newAsignaturas = [...existingAsignaturas, ...nuevaAsignacion.asignaturas]
                  // Eliminar duplicados
                  const uniqueAsignaturas = [...new Set(newAsignaturas)]

                  updatedCursos[existingIndex] = {
                    ...updatedCursos[existingIndex],
                    asignaturas: uniqueAsignaturas,
                    horasAsignadas: (updatedCursos[existingIndex].horasAsignadas || 0) + nuevaAsignacion.horasAsignadas,
                  }
                  console.log("Agregando asignaturas al curso existente")
                } else {
                  // Si el curso no existe, agrega la nueva asignación
                  updatedCursos = [
                    ...currentCursos,
                    {
                      cursoId: nuevaAsignacion.cursoId,
                      asignaturas: [...nuevaAsignacion.asignaturas],
                      horasAsignadas: nuevaAsignacion.horasAsignadas,
                    },
                  ]
                  console.log("Agregando nuevo curso")
                }

                console.log("Asignaciones después de agregar:", updatedCursos.length)

                setFormData((prevData) => ({
                  ...prevData,
                  cursosAsignados: updatedCursos,
                }))

                toast({
                  title: "Asignación agregada",
                  description: `Se agregaron ${nuevaAsignacion.asignaturas.length} asignaturas (${nuevaAsignacion.horasAsignadas}h)`,
                })
              } catch (error) {
                console.error("Error al agregar asignación:", error)
                toast({
                  title: "Error",
                  description: "No se pudo agregar la asignación",
                  variant: "destructive",
                })
              }
            }}
          />
        </div>

        {/* Listado de asignaciones actuales */}
        {formData.cursosAsignados && formData.cursosAsignados.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Asignaciones Actuales ({formData.cursosAsignados.length})</h4>
            <div className="space-y-3">
              {formData.cursosAsignados.map((cursoAsignado, index) => {
                if (!cursoAsignado || !cursoAsignado.cursoId) return null

                const curso = cursos.find((c) => c && c.id === cursoAsignado.cursoId)
                const asignaturasInfo = (cursoAsignado.asignaturas || []).map((asigId) => {
                  const asig = asignaturas.find((a) => a && a.id === asigId)
                  return {
                    id: asigId,
                    codigo: asig?.codigo || asigId,
                    nombre: asig?.nombre || asigId,
                    color: asig?.color || "#3B82F6",
                  }
                })

                return (
                  <div
                    key={`${cursoAsignado.cursoId}-${index}`}
                    className="p-4 rounded-lg border border-gray-200 bg-gray-50"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-medium text-base">{curso?.nombre || "Curso no encontrado"}</p>
                        <p className="text-sm text-gray-600">
                          {cursoAsignado.asignaturas?.length || 0} asignaturas - {cursoAsignado.horasAsignadas || 0}h
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const updatedCursos = formData.cursosAsignados?.filter((c, i) => i !== index)
                          setFormData({ ...formData, cursosAsignados: updatedCursos })
                          console.log("Eliminando asignación, quedan:", updatedCursos?.length || 0)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Mostrar todas las asignaturas */}
                    {asignaturasInfo.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {asignaturasInfo.map((asig) => (
                          <div key={asig.id} className="flex items-center gap-2 bg-white px-3 py-2 rounded border">
                            <div
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: asig.color }}
                            />
                            <span className="font-medium text-sm">{asig.codigo}</span>
                            <span className="text-xs text-gray-500 truncate">{asig.nombre}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Resumen de horas */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <h5 className="font-medium text-green-900 mb-2">Resumen de Carga Horaria</h5>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">
                    {formData.cursosAsignados.reduce((total, c) => total + (c.horasAsignadas || 0), 0)}h
                  </div>
                  <div className="text-green-700">Horas Asignadas</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">{formData.horasDisponibles || 40}h</div>
                  <div className="text-blue-700">Horas Disponibles</div>
                </div>
                <div className="text-center">
                  <div
                    className={`text-lg font-bold ${
                      (formData.horasDisponibles || 40) -
                        formData.cursosAsignados.reduce((total, c) => total + (c.horasAsignadas || 0), 0) <
                      0
                        ? "text-red-600"
                        : "text-green-600"
                    }`}
                  >
                    {(formData.horasDisponibles || 40) -
                      formData.cursosAsignados.reduce((total, c) => total + (c.horasAsignadas || 0), 0)}
                    h
                  </div>
                  <div className="text-gray-700">Restantes</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Restricciones */}
      <div className="space-y-4">
        <Label htmlFor="restricciones">Restricciones (separadas por coma)</Label>
        <Input
          id="restricciones"
          value={restriccionesInput}
          onChange={(e) => setRestriccionesInput(e.target.value)}
          placeholder="Ej: No lunes, Solo mañana"
        />
        <p className="text-xs text-gray-500">
          Añade restricciones para este docente. Ej: "No lunes", "Solo mañana", "No más de 2 cursos"
        </p>
      </div>

      {/* Botones */}
      <div className="flex justify-end gap-4">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">{docente ? "Guardar Cambios" : "Agregar Docente"}</Button>
      </div>
    </form>
  )
}

function AsignacionForm({
  nivel,
  tipoDocente,
  cursos,
  asignaturas,
  getCursoStats,
  cursosAsignadosActuales = [],
  onAdd,
}: {
  nivel: string
  tipoDocente: string
  cursos: any[]
  asignaturas: any[]
  getCursoStats: (curso: any) => any
  cursosAsignadosActuales?: any[]
  onAdd: (asignacion: { cursoId: string; asignaturas: string[]; horasAsignadas: number }) => void
}) {
  const [selectedCurso, setSelectedCurso] = useState("")
  const [selectedAsignaturas, setSelectedAsignaturas] = useState<string[]>([])

  // Filtrar cursos por nivel de forma segura Y APLICAR ORDENAMIENTO
  const cursosCompatibles = ordenarCursosAutomaticamente(
    (cursos || []).filter((curso) => {
      if (!curso) return false
      return nivel === "ambos" || curso.nivel === nivel
    }),
  )

  const curso = cursosCompatibles.find((c) => c && c.id === selectedCurso)

  // Calcular horas automáticamente
  const calcularHoras = () => {
    if (!curso || !selectedAsignaturas.length || !asignaturas) return 0

    return selectedAsignaturas.reduce((total, asignaturaId) => {
      const asignatura = asignaturas.find((a) => a && a.id === asignaturaId)
      if (!asignatura || !asignatura.horasPorNivel) return total

      const horasAsignatura = asignatura.horasPorNivel[curso.nivel]?.[curso.grado] || 0
      return total + horasAsignatura
    }, 0)
  }

  const horasCalculadas = calcularHoras()

  // Filtrar asignaturas disponibles - SIN RESTRICCIONES
  const getAsignaturasDisponibles = () => {
    if (!selectedCurso || !curso || !asignaturas) {
      return []
    }

    const asignaturasCompatibles = asignaturas.filter((asignatura) => {
      if (!asignatura) return false

      // Solo verificar si la asignatura tiene horas para este grado
      if (!asignatura.horasPorNivel || !asignatura.horasPorNivel[curso.nivel]) {
        return false
      }

      const horasGrado = asignatura.horasPorNivel[curso.nivel][curso.grado] || 0
      return horasGrado > 0
    })

    return asignaturasCompatibles
  }

  const asignaturasDisponibles = getAsignaturasDisponibles()

  const handleAdd = () => {
    if (!selectedCurso || selectedAsignaturas.length === 0) {
      toast({
        title: "Error",
        description: "Selecciona un curso y al menos una asignatura",
        variant: "destructive",
      })
      return
    }

    try {
      console.log("AsignacionForm - Agregando asignación con", selectedAsignaturas.length, "asignaturas")

      onAdd({
        cursoId: selectedCurso,
        asignaturas: [...selectedAsignaturas],
        horasAsignadas: horasCalculadas,
      })

      // Limpiar formulario
      setSelectedCurso("")
      setSelectedAsignaturas([])
    } catch (error) {
      console.error("Error al agregar asignación:", error)
      toast({
        title: "Error",
        description: "No se pudo agregar la asignación",
        variant: "destructive",
      })
    }
  }

  const toggleAsignatura = (asignaturaId: string) => {
    setSelectedAsignaturas((prev) => {
      if (prev.includes(asignaturaId)) {
        return prev.filter((id) => id !== asignaturaId)
      } else {
        return [...prev, asignaturaId]
      }
    })
  }

  // Función para seleccionar todas las asignaturas
  const selectAllAsignaturas = () => {
    const allIds = asignaturasDisponibles.map((a) => a.id)
    setSelectedAsignaturas([...allIds])
  }

  // Función para deseleccionar todas las asignaturas
  const clearAllAsignaturas = () => {
    setSelectedAsignaturas([])
  }

  return (
    <div className="space-y-4">
      {/* Información sobre el tipo de docente - ACTUALIZADA */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <h4 className="font-medium text-blue-900 mb-1">
          {tipoDocente === "titular" ? "Docente Titular" : "Docente de Área"} - SIN LÍMITES
        </h4>
        <p className="text-sm text-blue-700">
          Puede impartir múltiples asignaturas por curso y tener tantos cursos como sea necesario.
        </p>
      </div>

      {/* Selección de Curso */}
      <div>
        <Label>Seleccionar Curso (ordenados automáticamente)</Label>
        <Select
          value={selectedCurso}
          onValueChange={(value) => {
            setSelectedCurso(value)
            setSelectedAsignaturas([])
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar curso" />
          </SelectTrigger>
          <SelectContent>
            {cursosCompatibles.length === 0 ? (
              <SelectItem value="" disabled>
                No hay cursos disponibles para el nivel {nivel}
              </SelectItem>
            ) : (
              cursosCompatibles.map((curso, index) => {
                if (!curso || !curso.id) return null
                return (
                  <SelectItem key={curso.id} value={curso.id}>
                    #{(index + 1).toString().padStart(2, "0")} - {curso.nombre} - {curso.grado} {curso.seccion} (
                    {curso.nivel})
                  </SelectItem>
                )
              })
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Información del curso seleccionado */}
      {selectedCurso && curso && (
        <div className="p-3 rounded-lg border border-blue-200 bg-blue-50">
          <h4 className="font-medium text-sm mb-2">Curso seleccionado:</h4>
          <div className="text-sm">
            <p>
              <strong>Nombre:</strong> {curso.nombre}
            </p>
            <p>
              <strong>Nivel:</strong> {curso.nivel}
            </p>
            <p>
              <strong>Grado:</strong> {curso.grado}
            </p>
            <p>
              <strong>Sección:</strong> {curso.seccion}
            </p>
          </div>
        </div>
      )}

      {/* Selección de Asignaturas - SIN LÍMITES */}
      {selectedCurso && (
        <div>
          <Label className="text-sm font-medium">
            Asignaturas Disponibles ({asignaturasDisponibles.length}) - SELECCIÓN MÚLTIPLE SIN LÍMITES
            <span className="text-xs text-gray-500 ml-2">(Puedes seleccionar todas las asignaturas que necesites)</span>
          </Label>
          {asignaturasDisponibles.length > 0 && (
            <div className="flex justify-between items-center mb-2">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={selectAllAsignaturas}
                  disabled={selectedAsignaturas.length === asignaturasDisponibles.length}
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Todas
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={clearAllAsignaturas}
                  disabled={selectedAsignaturas.length === 0}
                >
                  Limpiar
                </Button>
              </div>
            </div>
          )}

          {asignaturasDisponibles.length > 0 ? (
            <div className="mt-2 space-y-2 max-h-60 overflow-y-auto border rounded p-3">
              {asignaturasDisponibles.map((asignatura) => {
                if (!asignatura || !asignatura.id) return null

                const horasAsignatura = asignatura.horasPorNivel?.[curso.nivel]?.[curso.grado] || 0

                return (
                  <label
                    key={asignatura.id}
                    className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedAsignaturas.includes(asignatura.id)}
                      onChange={() => toggleAsignatura(asignatura.id)}
                      className="rounded"
                    />
                    <div className="flex items-center gap-2 flex-1">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: asignatura.color || "#3B82F6" }}
                      />
                      <span className="text-sm font-medium">{asignatura.nombre}</span>
                      <Badge variant="outline" className="text-xs">
                        {asignatura.codigo}
                      </Badge>
                      <Badge variant={asignatura.tipo === "basica" ? "default" : "secondary"} className="text-xs">
                        {asignatura.tipo === "basica" ? "Básica" : "Área"}
                      </Badge>
                      <Badge variant="secondary" className="text-xs ml-auto">
                        {horasAsignatura}h/sem
                      </Badge>
                    </div>
                  </label>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-4 bg-amber-50 border border-amber-200 rounded mt-2">
              <AlertCircle className="h-8 w-8 text-amber-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-amber-800">No hay asignaturas compatibles</p>
              <p className="text-xs text-amber-600 mt-1">
                No hay asignaturas que tengan horas asignadas para el grado {curso.grado} en nivel {curso.nivel}.
                Verifica la configuración de asignaturas.
              </p>
            </div>
          )}

          {selectedAsignaturas.length > 0 && (
            <div className="flex justify-between items-center mt-2 text-sm">
              <span className="text-gray-500">Seleccionadas: {selectedAsignaturas.length}</span>
              <span className="font-medium text-indigo-600">Total horas: {horasCalculadas}h semanales</span>
            </div>
          )}
        </div>
      )}

      {/* Resumen y botón */}
      {selectedCurso && selectedAsignaturas.length > 0 && (
        <>
          <div className="border rounded-lg p-4 border-indigo-200 bg-indigo-50">
            <h4 className="font-medium mb-2 text-indigo-900">Resumen de la Asignación</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-indigo-700">Curso:</span>
                <span className="font-medium text-indigo-900">{curso?.nombre}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-indigo-700">Tipo de docente:</span>
                <span className="font-medium text-indigo-900">{tipoDocente === "titular" ? "Titular" : "De Área"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-indigo-700">Asignaturas:</span>
                <span className="font-medium text-indigo-900">{selectedAsignaturas.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-indigo-700">Horas semanales:</span>
                <span className="font-medium text-indigo-900">{horasCalculadas}h</span>
              </div>
            </div>
          </div>

          <Button type="button" onClick={handleAdd} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Agregar Asignación ({selectedAsignaturas.length} asignaturas - {horasCalculadas}h)
          </Button>
        </>
      )}
    </div>
  )
}
