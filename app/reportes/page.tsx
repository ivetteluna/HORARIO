"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
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
  Mail,
  Phone,
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

  // ... (Las funciones de cálculo de estadísticas se mantienen igual)

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-cyan-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* ... (El Header y las tarjetas de estadísticas se mantienen igual) ... */}

        <Tabs defaultValue="asignaturas-faltantes" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="asignaturas-faltantes">Asignaturas Faltantes</TabsTrigger>
            <TabsTrigger value="cursos-problemas">Cursos con Problemas</TabsTrigger>
            <TabsTrigger value="docentes-disponibles">Docentes Disponibles</TabsTrigger>
            <TabsTrigger value="resumen-general">Directorio de Docentes</TabsTrigger>
          </TabsList>

          {/* ... (Las otras pestañas se mantienen igual) ... */}

          <TabsContent value="resumen-general" className="space-y-6">
            <Card className="bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-6 w-6 text-indigo-600" />
                  Directorio de Docentes
                </CardTitle>
                <CardDescription>
                  Información detallada de cada docente, incluyendo sus asignaciones.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {docentes.map((docente) => (
                    <AccordionItem value={docente.id} key={docente.id}>
                      <AccordionTrigger>
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                            <Users className="h-5 w-5 text-indigo-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-lg">{docente.nombre} {docente.apellido}</p>
                            <p className="text-sm text-gray-500">{docente.especialidad}</p>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="p-4 bg-gray-50 rounded-lg space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-semibold mb-2">Información Personal</h4>
                              <div className="space-y-1 text-sm">
                                <p><strong>Cédula:</strong> {docente.cedula}</p>
                                <p className="flex items-center gap-2">
                                  <Mail className="h-4 w-4" /> {docente.email || "No especificado"}
                                </p>
                                <p className="flex items-center gap-2">
                                  <Phone className="h-4 w-4" /> {docente.telefono}
                                </p>
                              </div>
                            </div>
                            <div>
                              <h4 className="font-semibold mb-2">Información Profesional</h4>
                              <div className="space-y-1 text-sm">
                                <p><strong>Tipo:</strong> <Badge variant={docente.tipo === 'titular' ? 'default' : 'secondary'}>{docente.tipo}</Badge></p>
                                <p><strong>Nivel:</strong> <Badge variant="outline">{docente.nivel}</Badge></p>
                                <p><strong>Horas Disponibles:</strong> {docente.horasDisponibles}h</p>
                              </div>
                            </div>
                          </div>
                          <div>
                            <h4 className="font-semibold mb-2">Asignaciones de Cursos y Asignaturas</h4>
                            {docente.cursosAsignados && docente.cursosAsignados.length > 0 ? (
                              <div className="space-y-3">
                                {docente.cursosAsignados.map(asignacion => {
                                  const curso = cursos.find(c => c.id === asignacion.cursoId);
                                  return (
                                    <div key={asignacion.cursoId} className="p-3 bg-white rounded-md border">
                                      <p className="font-bold text-indigo-700">{curso?.nombre || 'Curso no encontrado'}</p>
                                      <div className="mt-2 flex flex-wrap gap-2">
                                        {asignacion.asignaturas.map(asigId => {
                                          const asignatura = asignaturas.find(a => a.id === asigId);
                                          return (
                                            <Badge key={asigId} variant="secondary" style={{ backgroundColor: asignatura?.color, color: 'white' }}>
                                              {asignatura?.nombre || 'Asignatura desconocida'}
                                            </Badge>
                                          )
                                        })}
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            ) : (
                              <p className="text-sm text-gray-500">Este docente no tiene cursos asignados.</p>
                            )}
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}