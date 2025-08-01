"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  BarChart3,
  Users,
  BookOpen,
  GraduationCap,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Eye,
  TrendingUp,
  AlertCircle,
  Info,
} from "lucide-react"
import { useDocentes, useAsignaturas, useCursos, useDatabase } from "@/hooks/useDatabase"
import Link from "next/link"

export default function ReportesPage() {
  const { isInitialized } = useDatabase()
  const { docentes, loading: loadingDocentes } = useDocentes()
  const { asignaturas, loading: loadingAsignaturas } = useAsignaturas()
  const { cursos, loading: loadingCursos } = useCursos()
  const [filtroNivel, setFiltroNivel] = useState("todos")

  const loading = loadingDocentes || loadingAsignaturas || loadingCursos

  if (!isInitialized || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-cyan-100 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando reportes...</p>
        </div>
      </div>
    )
  }

  // Función para calcular asignaturas faltantes por grado
  const calcularAsignaturasFaltantesPorGrado = () => {
    const reportePorGrado = {}

    cursos.forEach((curso) => {
      const claveGrado = `${curso.nivel}-${curso.grado}`

      if (!reportePorGrado[claveGrado]) {
        reportePorGrado[claveGrado] = {
          nivel: curso.nivel,
          grado: curso.grado,
          cursos: [],
          asignaturasDisponibles: [],
          asignaturasAsignadas: new Set(),
          asignaturasFaltantes: [],
          totalHorasDisponibles: 0,
          totalHorasAsignadas: 0,
        }
      }

      reportePorGrado[claveGrado].cursos.push(curso)

      const asignaturasDelGrado = asignaturas.filter((asig) => {
        const horasSemanales = asig.horasPorNivel?.[curso.nivel]?.[curso.grado] || 0
        return horasSemanales > 0
      })

      reportePorGrado[claveGrado].asignaturasDisponibles = asignaturasDelGrado
      reportePorGrado[claveGrado].totalHorasDisponibles = asignaturasDelGrado.reduce((total, asig) => {
        return total + (asig.horasPorNivel?.[curso.nivel]?.[curso.grado] || 0)
      }, 0)

      const docentesDelCurso = docentes.filter((docente) =>
        docente.cursosAsignados?.some((ca) => ca.cursoId === curso.id),
      )

      docentesDelCurso.forEach((docente) => {
        const cursoAsignado = docente.cursosAsignados.find((ca) => ca.cursoId === curso.id)
        if (cursoAsignado?.asignaturas) {
          cursoAsignado.asignaturas.forEach((asigId) => {
            reportePorGrado[claveGrado].asignaturasAsignadas.add(asigId)
            const asignatura = asignaturas.find((a) => a.id === asigId)
            if (asignatura) {
              const horasSemanales = asignatura.horasPorNivel?.[curso.nivel]?.[curso.grado] || 0
              reportePorGrado[claveGrado].totalHorasAsignadas += horasSemanales
            }
          })
        }
      })
    })

    Object.keys(reportePorGrado).forEach((claveGrado) => {
      const reporte = reportePorGrado[claveGrado]
      reporte.asignaturasFaltantes = reporte.asignaturasDisponibles.filter(
        (asig) => !reporte.asignaturasAsignadas.has(asig.id),
      )
    })

    return Object.values(reportePorGrado)
  }

  const calcularEstadisticasGenerales = () => {
    const cursosConProblemas = cursos.filter((curso) => {
      const docentesDelCurso = docentes.filter((docente) =>
        docente.cursosAsignados?.some((ca) => ca.cursoId === curso.id),
      )
      return docentesDelCurso.length === 0
    })

    const docentesSinAsignaciones = docentes.filter(
      (docente) => !docente.cursosAsignados || docente.cursosAsignados.length === 0,
    )

    const asignaturasNoAsignadas = asignaturas.filter((asignatura) => {
      return !docentes.some((docente) => docente.cursosAsignados?.some((ca) => ca.asignaturas?.includes(asignatura.id)))
    })

    return {
      totalCursos: cursos.length,
      totalDocentes: docentes.length,
      totalAsignaturas: asignaturas.length,
      cursosConProblemas: cursosConProblemas,
      docentesSinAsignaciones: docentesSinAsignaciones,
      asignaturasNoAsignadas: asignaturasNoAsignadas,
    }
  }

  const reportePorGrado = calcularAsignaturasFaltantesPorGrado()
  const estadisticasGenerales = calcularEstadisticasGenerales()

  const reporteFiltrado =
    filtroNivel === "todos" ? reportePorGrado : reportePorGrado.filter((r) => r.nivel === filtroNivel)

  const reporteOrdenado = reporteFiltrado.sort((a, b) => {
    if (a.nivel !== b.nivel) {
      return a.nivel === "primario" ? -1 : 1
    }
    const gradoA = Number.parseInt(a.grado.replace("°", ""))
    const gradoB = Number.parseInt(b.grado.replace("°", ""))
    return gradoA - gradoB
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-cyan-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <BarChart3 className="h-8 w-8 text-indigo-600" />
            <h1 className="text-3xl font-bold text-gray-900">Reportes y Análisis</h1>
          </div>
          <p className="text-gray-600">
            Análisis detallado de asignaciones, asignaturas faltantes por grado y estadísticas del sistema
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/90 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Cursos con Problemas</p>
                  <p className="text-3xl font-bold text-red-600">{estadisticasGenerales.cursosConProblemas.length}</p>
                  <p className="text-xs text-gray-500">de {estadisticasGenerales.totalCursos} total</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600 opacity-80" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/90 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Docentes Sin Asignar</p>
                  <p className="text-3xl font-bold text-amber-600">
                    {estadisticasGenerales.docentesSinAsignaciones.length}
                  </p>
                  <p className="text-xs text-gray-500">de {estadisticasGenerales.totalDocentes} total</p>
                </div>
                <Users className="h-8 w-8 text-amber-600 opacity-80" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/90 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Asignaturas No Asignadas</p>
                  <p className="text-3xl font-bold text-orange-600">
                    {estadisticasGenerales.asignaturasNoAsignadas.length}
                  </p>
                  <p className="text-xs text-gray-500">de {estadisticasGenerales.totalAsignaturas} total</p>
                </div>
                <BookOpen className="h-8 w-8 text-orange-600 opacity-80" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/90 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Eficiencia General</p>
                  <p className="text-3xl font-bold text-green-600">
                    {estadisticasGenerales.totalCursos > 0
                      ? Math.round(
                          ((estadisticasGenerales.totalCursos - estadisticasGenerales.cursosConProblemas.length) /
                            estadisticasGenerales.totalCursos) *
                            100,
                        )
                      : 100}
                    %
                  </p>
                  <p className="text-xs text-gray-500">cursos completos</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600 opacity-80" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-white/90 backdrop-blur-sm mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Filtros de Reporte</h3>
                <p className="text-sm text-gray-600">Filtra el análisis por nivel educativo</p>
              </div>
              <Select value={filtroNivel} onValueChange={setFiltroNivel}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrar por nivel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los niveles</SelectItem>
                  <SelectItem value="primario">Nivel Primario</SelectItem>
                  <SelectItem value="secundario">Nivel Secundario</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="asignaturas-faltantes" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="asignaturas-faltantes">Asignaturas Faltantes</TabsTrigger>
            <TabsTrigger value="cursos-problemas">Cursos con Problemas</TabsTrigger>
            <TabsTrigger value="docentes-disponibles">Docentes Disponibles</TabsTrigger>
            <TabsTrigger value="resumen-general">Resumen General</TabsTrigger>
          </TabsList>

          <TabsContent value="asignaturas-faltantes" className="space-y-6">
            <Card className="bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-6 w-6 text-indigo-600" />
                  Asignaturas Faltantes por Grado
                </CardTitle>
                <CardDescription>
                  Análisis detallado de qué asignaturas necesitan docentes en cada grado
                </CardDescription>
              </CardHeader>
              <CardContent>
                {reporteOrdenado.every((r) => r.asignaturasFaltantes.length === 0) ? (
                  <div className="text-center py-12">
                    <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">¡Excelente!</h3>
                    <p className="text-gray-500">No hay asignaturas faltantes en ningún grado</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {reporteOrdenado.map((reporte) => (
                      <Card key={`${reporte.nivel}-${reporte.grado}`} className="border-2">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg flex items-center gap-2">
                              <span className="text-2xl">{reporte.nivel === "primario" ? "🎒" : "🎓"}</span>
                              {reporte.grado} {reporte.nivel === "primario" ? "Primario" : "Secundario"}
                            </CardTitle>
                            <Badge variant={reporte.asignaturasFaltantes.length > 0 ? "destructive" : "default"}>
                              {reporte.cursos.length} curso{reporte.cursos.length !== 1 ? "s" : ""}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="text-center p-2 bg-gray-50 rounded">
                              <div className="font-bold text-gray-900">{reporte.asignaturasDisponibles.length}</div>
                              <div className="text-gray-600">Asignaturas Total</div>
                            </div>
                            <div className="text-center p-2 bg-gray-50 rounded">
                              <div className="font-bold text-gray-900">{reporte.asignaturasAsignadas.size}</div>
                              <div className="text-gray-600">Asignadas</div>
                            </div>
                          </div>

                          {reporte.asignaturasFaltantes.length > 0 ? (
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 text-red-600" />
                                <span className="font-medium text-red-800">
                                  Faltan {reporte.asignaturasFaltantes.length} asignaturas:
                                </span>
                              </div>
                              <div className="space-y-2 max-h-40 overflow-y-auto">
                                {reporte.asignaturasFaltantes.map((asignatura) => (
                                  <div
                                    key={asignatura.id}
                                    className="flex items-center justify-between p-2 bg-red-50 border border-red-200 rounded"
                                  >
                                    <div className="flex items-center gap-2">
                                      <div
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: asignatura.color }}
                                      />
                                      <span className="text-sm font-medium text-red-800">{asignatura.nombre}</span>
                                    </div>
                                    <Badge variant="outline" className="text-xs">
                                      {asignatura.horasPorNivel?.[reporte.nivel]?.[reporte.grado] || 0}h/sem
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                              <div className="pt-2 border-t">
                                <Link href="/docentes">
                                  <Button size="sm" className="w-full bg-red-600 hover:bg-red-700">
                                    <Users className="h-3 w-3 mr-1" />
                                    Asignar Docentes
                                  </Button>
                                </Link>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-4">
                              <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                              <p className="text-sm text-green-700 font-medium">¡Todas las asignaturas asignadas!</p>
                            </div>
                          )}

                          <div className="pt-2 border-t">
                            <p className="text-xs text-gray-600 mb-2">Cursos en este grado:</p>
                            <div className="flex flex-wrap gap-1">
                              {reporte.cursos.map((curso) => (
                                <Badge key={curso.id} variant="outline" className="text-xs">
                                  {curso.nombre}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cursos-problemas" className="space-y-6">
            <Card className="bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                  Cursos con Problemas
                </CardTitle>
                <CardDescription>
                  Cursos que necesitan atención inmediata por falta de docentes o asignaciones incompletas
                </CardDescription>
              </CardHeader>
              <CardContent>
                {estadisticasGenerales.cursosConProblemas.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">¡Perfecto!</h3>
                    <p className="text-gray-500">Todos los cursos tienen docentes asignados</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {estadisticasGenerales.cursosConProblemas.map((curso) => (
                      <Alert key={curso.id} variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          <div className="flex items-center justify-between">
                            <div>
                              <strong>{curso.nombre}</strong> - {curso.nivel} {curso.grado} Sección {curso.seccion}
                              <br />
                              <span className="text-sm">Sin docentes asignados</span>
                            </div>
                            <div className="flex gap-2">
                              <Link href="/docentes">
                                <Button size="sm" variant="outline" className="bg-transparent">
                                  <Users className="h-3 w-3 mr-1" />
                                  Asignar Docente
                                </Button>
                              </Link>
                              <Link href="/cursos">
                                <Button size="sm" variant="outline" className="bg-transparent">
                                  <Eye className="h-3 w-3 mr-1" />
                                  Ver Curso
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="docentes-disponibles" className="space-y-6">
            <Card className="bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-6 w-6 text-amber-600" />
                  Docentes Disponibles
                </CardTitle>
                <CardDescription>Docentes que no tienen asignaciones y están disponibles para asignar</CardDescription>
              </CardHeader>
              <CardContent>
                {estadisticasGenerales.docentesSinAsignaciones.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Todos los docentes asignados</h3>
                    <p className="text-gray-500">No hay docentes disponibles sin asignaciones</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {estadisticasGenerales.docentesSinAsignaciones.map((docente) => (
                      <Card key={docente.id} className="border-amber-200 bg-amber-50">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                              <Users className="h-5 w-5 text-amber-600" />
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">
                                {docente.nombre} {docente.apellido}
                              </h4>
                              <p className="text-sm text-gray-600">{docente.especialidad}</p>
                            </div>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Tipo:</span>
                              <Badge variant="outline">{docente.tipo === "titular" ? "Titular" : "Área"}</Badge>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Nivel:</span>
                              <Badge variant="outline">
                                {docente.nivel === "primario"
                                  ? "Primario"
                                  : docente.nivel === "secundario"
                                  ? "Secundario"
                                  : "Ambos"}
                              </Badge>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Horas disponibles:</span>
                              <Badge variant="outline">{docente.horasDisponibles}h</Badge>
                            </div>
                          </div>
                          <div className="mt-3 pt-3 border-t border-amber-200">
                            <Link href="/docentes">
                              <Button size="sm" className="w-full bg-amber-600 hover:bg-amber-700">
                                <Users className="h-3 w-3 mr-1" />
                                Asignar a Curso
                              </Button>
                            </Link>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="resumen-general" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/90 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-6 w-6 text-indigo-600" />
                    Resumen Ejecutivo
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-indigo-50 rounded-lg">
                      <div className="text-2xl font-bold text-indigo-600">{estadisticasGenerales.totalCursos}</div>
                      <div className="text-sm text-indigo-800">Cursos Totales</div>
                    </div>
                    <div className="text-center p-4 bg-emerald-50 rounded-lg">
                      <div className="text-2xl font-bold text-emerald-600">{estadisticasGenerales.totalDocentes}</div>
                      <div className="text-sm text-emerald-800">Docentes Totales</div>
                    </div>
                    <div className="text-center p-4 bg-amber-50 rounded-lg">
                      <div className="text-2xl font-bold text-amber-600">
                        {estadisticasGenerales.totalAsignaturas}
                      </div>
                      <div className="text-sm text-amber-800">Asignaturas Totales</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {estadisticasGenerales.totalCursos > 0
                          ? Math.round(
                              ((estadisticasGenerales.totalCursos - estadisticasGenerales.cursosConProblemas.length) /
                                estadisticasGenerales.totalCursos) *
                                100,
                            )
                          : 100}
                        %
                      </div>
                      <div className="text-sm text-purple-800">Eficiencia</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900">Estado del Sistema:</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm text-gray-600">Cursos Completos</span>
                        <Badge variant="default">
                          {estadisticasGenerales.totalCursos - estadisticasGenerales.cursosConProblemas.length}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm text-gray-600">Cursos con Problemas</span>
                        <Badge variant="destructive">{estadisticasGenerales.cursosConProblemas.length}</Badge>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm text-gray-600">Docentes Disponibles</span>
                        <Badge variant="secondary">{estadisticasGenerales.docentesSinAsignaciones.length}</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/90 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                    Recomendaciones
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {estadisticasGenerales.cursosConProblemas.length > 0 && (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Prioridad Alta:</strong> Hay {estadisticasGenerales.cursosConProblemas.length}{" "}
                          curso(s) sin docentes asignados.
                          <Link href="/docentes" className="ml-2 text-indigo-600 hover:underline">
                            Asignar docentes →
                          </Link>
                        </AlertDescription>
                      </Alert>
                    )}

                    {estadisticasGenerales.docentesSinAsignaciones.length > 0 && (
                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Oportunidad:</strong> Hay {estadisticasGenerales.docentesSinAsignaciones.length}{" "}
                          docente(s) disponible(s) para asignar.
                          <Link href="/docentes" className="ml-2 text-indigo-600 hover:underline">
                            Ver docentes →
                          </Link>
                        </AlertDescription>
                      </Alert>
                    )}

                    {estadisticasGenerales.asignaturasNoAsignadas.length > 0 && (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Atención:</strong> Hay {estadisticasGenerales.asignaturasNoAsignadas.length}{" "}
                          asignatura(s) sin asignar a ningún docente.
                          <Link href="/asignaturas" className="ml-2 text-indigo-600 hover:underline">
                            Ver asignaturas →
                          </Link>
                        </AlertDescription>
                      </Alert>
                    )}

                    {estadisticasGenerales.cursosConProblemas.length === 0 &&
                      estadisticasGenerales.docentesSinAsignaciones.length === 0 && (
                        <Alert>
                          <CheckCircle className="h-4 w-4" />
                          <AlertDescription>
                            <strong>¡Excelente!</strong> El sistema está completamente configurado. Puedes proceder a
                            generar los horarios.
                            <Link href="/generar" className="ml-2 text-indigo-600 hover:underline">
                              Generar horarios →
                            </Link>
                          </AlertDescription>
                        </Alert>
                      )}
                  </div>

                  <div className="pt-4 border-t">
                    <h4 className="font-medium text-gray-900 mb-3">Acciones Rápidas:</h4>
                    <div className="space-y-2">
                      <Link href="/docentes">
                        <Button variant="outline" className="w-full justify-start bg-transparent">
                          <Users className="h-4 w-4 mr-2" />
                          Gestionar Docentes
                        </Button>
                      </Link>
                      <Link href="/cursos">
                        <Button variant="outline" className="w-full justify-start bg-transparent">
                          <GraduationCap className="h-4 w-4 mr-2" />
                          Gestionar Cursos
                        </Button>
                      </Link>
                      <Link href="/generar">
                        <Button variant="outline" className="w-full justify-start bg-transparent">
                          <Clock className="h-4 w-4 mr-2" />
                          Generar Horarios
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}