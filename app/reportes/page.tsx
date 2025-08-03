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
} from "lucide-react";
import { useDocentes, useAsignaturas, useCursos, useDatabase } from "@/hooks/useDatabase";
import Link from "next/link";

function ReportesPageComponent() {
  const { isInitialized } = useDatabase();
  const { docentes, loading: loadingDocentes } = useDocentes();
  const { asignaturas, loading: loadingAsignaturas } = useAsignaturas();
  const { cursos, loading: loadingCursos } = useCursos();
  const [filtroNivel, setFiltroNivel] = useState("todos");

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

  const calcularEstadisticasGenerales = () => {
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

  const estadisticasGenerales = calcularEstadisticasGenerales();

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
                    <AccordionTrigger className="text-left">
                      {docente.nombre} {docente.apellido}
                    </AccordionTrigger>
                    <AccordionContent className="p-4 bg-gray-50 rounded-md">
                      <p><strong>Título:</strong> {docente.especialidad}</p>
                      <p><strong>Email:</strong> {docente.email}</p>
                      <p><strong>Teléfono:</strong> {docente.telefono}</p>
                      <h4 className="font-semibold mt-2">Cursos Asignados:</h4>
                      <ul>
                        {docente.cursosAsignados.map(ca => {
                          const curso = cursos.find(c => c.id === ca.cursoId);
                          return <li key={ca.cursoId}>- {curso?.nombre}</li>
                        })}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>
        {/* ... Otras pestañas aquí */}
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