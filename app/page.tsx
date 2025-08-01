"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Users,
  BookOpen,
  GraduationCap,
  Calendar,
  Settings,
  BarChart3,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
} from "lucide-react"
import Link from "next/link"
import { useDatabase, useDocentes, useAsignaturas, useCursos } from "@/hooks/useDatabase"

export default function HomePage() {
  const { isInitialized, error } = useDatabase()
  const { docentes, loading: loadingDocentes } = useDocentes()
  const { asignaturas, loading: loadingAsignaturas } = useAsignaturas()
  const { cursos, loading: loadingCursos } = useCursos()

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-cyan-100 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg className="h-12 w-12 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error de Base de Datos</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-cyan-100 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Inicializando sistema...</p>
          <p className="text-sm text-gray-500 mt-2">Configurando base de datos local...</p>
        </div>
      </div>
    )
  }

  const loading = loadingDocentes || loadingAsignaturas || loadingCursos

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-cyan-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Sistema de Gestión de Horarios Docentes</h1>
          <p className="text-gray-600 text-lg">
            Administra docentes, asignaturas, cursos y genera horarios de manera eficiente
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Docentes</p>
                  <p className="text-3xl font-bold text-indigo-600">{loading ? "..." : docentes.length}</p>
                </div>
                <Users className="h-12 w-12 text-indigo-600 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Asignaturas</p>
                  <p className="text-3xl font-bold text-emerald-600">{loading ? "..." : asignaturas.length}</p>
                </div>
                <BookOpen className="h-12 w-12 text-emerald-600 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Cursos</p>
                  <p className="text-3xl font-bold text-amber-600">{loading ? "..." : cursos.length}</p>
                </div>
                <GraduationCap className="h-12 w-12 text-amber-600 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Estado</p>
                  <p className="text-lg font-bold text-green-600 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Activo
                  </p>
                </div>
                <TrendingUp className="h-12 w-12 text-green-600 opacity-80" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-6 w-6 text-indigo-600" />
                Acciones Rápidas
              </CardTitle>
              <CardDescription>Accede rápidamente a las funciones principales del sistema</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link href="/docentes">
                  <Button className="w-full justify-start bg-transparent" variant="outline">
                    <Users className="h-4 w-4 mr-2" />
                    Gestionar Docentes
                  </Button>
                </Link>
                <Link href="/asignaturas">
                  <Button className="w-full justify-start bg-transparent" variant="outline">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Gestionar Asignaturas
                  </Button>
                </Link>
                <Link href="/cursos">
                  <Button className="w-full justify-start bg-transparent" variant="outline">
                    <GraduationCap className="h-4 w-4 mr-2" />
                    Gestionar Cursos
                  </Button>
                </Link>
                <Link href="/generar">
                  <Button className="w-full justify-start bg-indigo-600 hover:bg-indigo-700 text-white">
                    <Calendar className="h-4 w-4 mr-2" />
                    Generar Horarios
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-6 w-6 text-emerald-600" />
                Estado del Sistema
              </CardTitle>
              <CardDescription>Información general sobre el estado actual del sistema</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Base de Datos</span>
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Conectada
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Configuración</span>
                  <Badge variant="default" className="bg-blue-100 text-blue-800">
                    <Settings className="h-3 w-3 mr-1" />
                    Lista
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Horarios</span>
                  <Badge variant="default" className="bg-amber-100 text-amber-800">
                    <Clock className="h-3 w-3 mr-1" />
                    Pendiente
                  </Badge>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Link href="/configuracion">
                  <Button variant="outline" className="w-full bg-transparent">
                    <Settings className="h-4 w-4 mr-2" />
                    Ir a Configuración
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-6 w-6 text-gray-600" />
              Actividad Reciente
            </CardTitle>
            <CardDescription>Últimas acciones realizadas en el sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                  <p className="text-gray-500">Cargando actividad...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium">Sistema inicializado correctamente</p>
                      <p className="text-xs text-gray-500">Base de datos IndexedDB configurada</p>
                    </div>
                  </div>

                  {docentes.length > 0 && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Users className="h-5 w-5 text-indigo-600" />
                      <div>
                        <p className="text-sm font-medium">{docentes.length} docentes registrados</p>
                        <p className="text-xs text-gray-500">Listos para asignación de horarios</p>
                      </div>
                    </div>
                  )}

                  {asignaturas.length > 0 && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <BookOpen className="h-5 w-5 text-emerald-600" />
                      <div>
                        <p className="text-sm font-medium">{asignaturas.length} asignaturas configuradas</p>
                        <p className="text-xs text-gray-500">Disponibles para los cursos</p>
                      </div>
                    </div>
                  )}

                  {cursos.length > 0 && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <GraduationCap className="h-5 w-5 text-amber-600" />
                      <div>
                        <p className="text-sm font-medium">{cursos.length} cursos creados</p>
                        <p className="text-xs text-gray-500">Preparados para generar horarios</p>
                      </div>
                    </div>
                  )}

                  {docentes.length === 0 && asignaturas.length === 0 && cursos.length === 0 && (
                    <div className="text-center py-8">
                      <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 mb-4">No hay actividad reciente</p>
                      <p className="text-sm text-gray-400">
                        Comienza agregando docentes, asignaturas o cursos al sistema
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
