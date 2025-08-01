"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Users, GraduationCap, Clock, Search, Eye, Download, PrinterIcon as Print } from "lucide-react"
import { useDatabase } from "@/hooks/useDatabase"
import Link from "next/link"

export default function HorariosPage() {
  const { isInitialized } = useDatabase()
  const [horariosGenerados, setHorariosGenerados] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterTipo, setFilterTipo] = useState<"todos" | "docente" | "curso">("todos")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isInitialized) {
      loadHorarios()
    }
  }, [isInitialized])

  const loadHorarios = () => {
    try {
      const horariosGuardados = localStorage.getItem("horariosGenerados")
      if (horariosGuardados) {
        const horarios = JSON.parse(horariosGuardados)
        setHorariosGenerados(horarios)
      }
    } catch (error) {
      console.error("Error loading horarios:", error)
    } finally {
      setLoading(false)
    }
  }

  if (!isInitialized || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-cyan-100 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando horarios...</p>
        </div>
      </div>
    )
  }

  const filteredHorarios = horariosGenerados.filter((horario) => {
    const matchesSearch = horario.nombre?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesTipo = filterTipo === "todos" || horario.tipo === filterTipo
    return matchesSearch && matchesTipo
  })

  const horariosDocentes = horariosGenerados.filter((h) => h.tipo === "docente")
  const horariosCursos = horariosGenerados.filter((h) => h.tipo === "curso")

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-cyan-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Calendar className="h-8 w-8 text-indigo-600" />
            <h1 className="text-3xl font-bold text-gray-900">Horarios Generados</h1>
          </div>
          <p className="text-gray-600">Visualiza y gestiona los horarios generados para docentes y cursos</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/90 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Horarios Docentes</p>
                  <p className="text-3xl font-bold text-indigo-600">{horariosDocentes.length}</p>
                </div>
                <Users className="h-12 w-12 text-indigo-600 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Horarios Cursos</p>
                  <p className="text-3xl font-bold text-emerald-600">{horariosCursos.length}</p>
                </div>
                <GraduationCap className="h-12 w-12 text-emerald-600 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Última Generación</p>
                  <p className="text-lg font-bold text-amber-600">
                    {horariosGenerados.length > 0
                      ? new Date(horariosGenerados[0]?.fechaGeneracion).toLocaleDateString()
                      : "Pendiente"}
                  </p>
                </div>
                <Clock className="h-12 w-12 text-amber-600 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Estado</p>
                  <p className="text-lg font-bold text-green-600">
                    {horariosGenerados.length > 0 ? "Generados" : "Sin Generar"}
                  </p>
                </div>
                <Badge className="h-12 w-12 text-green-600 opacity-80 bg-transparent border-0">
                  <span className="text-2xl">📅</span>
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        {horariosGenerados.length > 0 && (
          <Card className="bg-white/90 backdrop-blur-sm mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Buscar horarios..."
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
                    <SelectItem value="todos">Todos los horarios</SelectItem>
                    <SelectItem value="docente">Horarios de Docentes</SelectItem>
                    <SelectItem value="curso">Horarios de Cursos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Horarios List */}
        {horariosGenerados.length === 0 ? (
          <Card className="bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Horarios Disponibles</CardTitle>
              <CardDescription>
                Los horarios generados aparecerán aquí una vez que completes el proceso de generación
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay horarios generados</h3>
                <p className="text-gray-500 mb-6">
                  Genera horarios automáticamente para comenzar a visualizar y gestionar los horarios de docentes y
                  cursos
                </p>
                <div className="flex justify-center gap-4">
                  <Link href="/generar">
                    <Button className="bg-indigo-600 hover:bg-indigo-700">
                      <Calendar className="h-4 w-4 mr-2" />
                      Generar Horarios
                    </Button>
                  </Link>
                  <Link href="/configuracion">
                    <Button variant="outline">
                      <Clock className="h-4 w-4 mr-2" />
                      Configurar Sistema
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredHorarios.map((horario) => (
              <Card key={horario.id} className="bg-white/90 backdrop-blur-sm hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{horario.nombre}</CardTitle>
                    <Badge variant={horario.tipo === "docente" ? "default" : "secondary"}>
                      {horario.tipo === "docente" ? "Docente" : "Curso"}
                    </Badge>
                  </div>
                  <CardDescription>
                    Generado el {new Date(horario.fechaGeneracion).toLocaleDateString("es-ES")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Preview del horario */}
                    <div className="bg-gray-50 rounded-lg p-3">
                      <h4 className="font-medium text-sm mb-2">Vista Previa:</h4>
                      <div className="text-xs space-y-1">
                        {Object.entries(horario.horario)
                          .slice(0, 2)
                          .map(([dia, periodos]: [string, any]) => (
                            <div key={dia} className="flex justify-between">
                              <span className="font-medium">{dia}:</span>
                              <span className="text-gray-600">
                                {Object.keys(periodos).filter((p) => p !== "Recreo" && p !== "Almuerzo").length} clases
                              </span>
                            </div>
                          ))}
                        <div className="text-gray-500 text-center pt-1">...</div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Link href={`/horarios/${horario.tipo}/${horario.entidadId}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full bg-transparent">
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Completo
                        </Button>
                      </Link>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Print className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Actions */}
        {horariosGenerados.length > 0 && (
          <div className="mt-8 flex justify-center gap-4">
            <Link href="/generar">
              <Button className="bg-indigo-600 hover:bg-indigo-700">
                <Calendar className="h-4 w-4 mr-2" />
                Regenerar Horarios
              </Button>
            </Link>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar Todos
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
