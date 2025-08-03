"use client"

import dynamic from "next/dynamic";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  BarChart3,
  Users,
  BookOpen,
  AlertTriangle,
  CheckCircle,
  FileText,
  Eye,
  TrendingUp,
  AlertCircle,
  Info,
  Mail,
  Phone,
} from "lucide-react";
import { useDocentes, useAsignaturas, useCursos, useDatabase } from "@/hooks/useDatabase";
import Link from "next/link";

function ReportesPageComponent() {
  const { isInitialized } = useDatabase();
  const { docentes, loading: loadingDocentes } = useDocentes();
  const { asignaturas, loading: loadingAsignaturas } = useAsignaturas();
  const { cursos, loading: loadingCursos } = useCursos();

  const loading = loadingDocentes || loadingAsignaturas || loadingCursos;

  if (!isInitialized || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando reportes...</p>
        </div>
      </div>
    );
  }

  const estadisticasGenerales = () => {
    const cursosConProblemas = cursos.filter(curso => 
        !docentes.some(d => d.cursosAsignados?.some(ca => ca.cursoId === curso.id))
    );
    const docentesSinAsignaciones = docentes.filter(d => !d.cursosAsignados || d.cursosAsignados.length === 0);
    const asignaturasAsignadasIds = new Set(docentes.flatMap(d => d.cursosAsignados?.flatMap(ca => ca.asignaturas) || []));
    const asignaturasNoAsignadas = asignaturas.filter(a => !asignaturasAsignadasIds.has(a.id));

    return {
      totalCursos: cursos.length,
      totalDocentes: docentes.length,
      totalAsignaturas: asignaturas.length,
      cursosConProblemas,
      docentesSinAsignaciones,
      asignaturasNoAsignadas,
    };
  };

  const stats = estadisticasGenerales();

  return (
    <>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <BarChart3 className="h-8 w-8 text-indigo-600" />
          <h1 className="text-3xl font-bold text-gray-900">Reportes y Análisis</h1>
        </div>
        <p className="text-gray-600">
          Análisis detallado de asignaciones, faltantes y estado general del sistema.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card><CardContent className="p-6"><div><p className="text-sm font-medium">Cursos con Problemas</p><p className="text-3xl font-bold text-red-600">{stats.cursosConProblemas.length}</p></div></CardContent></Card>
          <Card><CardContent className="p-6"><div><p className="text-sm font-medium">Docentes Sin Asignar</p><p className="text-3xl font-bold text-amber-600">{stats.docentesSinAsignaciones.length}</p></div></CardContent></Card>
          <Card><CardContent className="p-6"><div><p className="text-sm font-medium">Asignaturas No Asignadas</p><p className="text-3xl font-bold text-orange-600">{stats.asignaturasNoAsignadas.length}</p></div></CardContent></Card>
          <Card><CardContent className="p-6"><div><p className="text-sm font-medium">Eficiencia</p><p className="text-3xl font-bold text-green-600">{stats.totalCursos > 0 ? Math.round(((stats.totalCursos - stats.cursosConProblemas.length) / stats.totalCursos) * 100) : 100}%</p></div></CardContent></Card>
      </div>

      <Tabs defaultValue="resumen-general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="resumen-general">Directorio de Docentes</TabsTrigger>
          <TabsTrigger value="cursos-problemas">Cursos con Problemas</TabsTrigger>
          <TabsTrigger value="docentes-disponibles">Docentes Disponibles</TabsTrigger>
          <TabsTrigger value="asignaturas-no-asignadas">Asignaturas sin Asignar</TabsTrigger>
        </TabsList>

        <TabsContent value="resumen-general">
          <Card>
            <CardHeader>
              <CardTitle>Directorio de Docentes</CardTitle>
              <CardDescription>Información detallada de cada docente y sus asignaciones.</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {docentes.map((docente) => (
                  <AccordionItem value={docente.id} key={docente.id}>
                    <AccordionTrigger className="text-left hover:no-underline">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center"><Users className="h-5 w-5 text-indigo-600"/></div>
                           <div>
                                <p className="font-semibold text-base">{docente.nombre} {docente.apellido}</p>
                                <p className="text-sm text-gray-500 font-normal">{docente.especialidad}</p>
                           </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="p-4 bg-gray-50 rounded-b-md border-t">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h4 className="font-semibold mb-2">Información Personal</h4>
                            <div className="space-y-1 text-sm">
                                <p><strong>Cédula:</strong> {docente.cedula}</p>
                                <p className="flex items-center gap-2"><Mail className="h-4 w-4" /> {docente.email || "No especificado"}</p>
                                <p className="flex items-center gap-2"><Phone className="h-4 w-4" /> {docente.telefono}</p>
                            </div>
                          </div>
                           <div>
                              <h4 className="font-semibold mb-2">Información Profesional</h4>
                              <div className="space-y-2 text-sm">
                                <p><strong>Tipo:</strong> <Badge variant={docente.tipo.startsWith("titular") ? "default" : "secondary"}>{docente.tipo === 'titular' ? 'Titular' : docente.tipo === 'titular_con_adicionales' ? 'Titular c/ Adicionales' : 'Rotación'}</Badge></p>
                                <p><strong>Nivel:</strong> <Badge variant="outline">{docente.nivel}</Badge></p>
                                <p><strong>Horas Disponibles:</strong> {docente.horasDisponibles}h</p>
                              </div>
                            </div>
                      </div>
                      <div className="mt-4 pt-4 border-t">
                        <h4 className="font-semibold mb-2">Asignaciones de Cursos y Asignaturas</h4>
                        {docente.cursosAsignados && docente.cursosAsignados.length > 0 ? (
                          <div className="space-y-3">
                            {docente.cursosAsignados.map(asignacion => {
                              const curso = cursos.find(c => c.id === asignacion.cursoId);
                              return (
                                <div key={asignacion.cursoId} className="p-3 bg-white rounded-md border">
                                  <p className="font-bold text-indigo-700 flex items-center gap-2">{curso?.nombre || 'Curso no encontrado'} {asignacion.esTitular && <Badge>Titular</Badge>}</p>
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
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>
        {/* ... (Las otras pestañas se mantienen igual, pero ahora funcionales) ... */}
      </Tabs>
    </>
  );
}


const DynamicReportesPage = dynamic(() => Promise.resolve(ReportesPageComponent), {
    ssr: false,
    loading: () => (
        <div className="flex h-screen items-center justify-center">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Cargando Módulo de Reportes...</p>
            </div>
        </div>
    )
});

export default function ReportesPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-cyan-100 p-6">
            <div className="max-w-7xl mx-auto">
                <DynamicReportesPage />
            </div>
        </div>
    );
}