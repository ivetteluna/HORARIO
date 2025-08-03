"use client"

import dynamic from 'next/dynamic'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import {
  Plus,
  Edit,
  Trash2,
  Users,
  Mail,
  Phone,
  X,
  Eye,
  EyeOff
} from "lucide-react"
import { useDocentes, useAsignaturas, useCursos, useDatabase, useConfiguracion } from "@/hooks/useDatabase"
import type { DocenteDB } from "@/lib/database"
import { toast } from "@/hooks/use-toast"
import { useState } from "react"

function DocentesPageComponent() {
  const { isInitialized } = useDatabase();
  const { docentes, loading, saveDocente, deleteDocente } = useDocentes();
  const { asignaturas } = useAsignaturas();
  const { cursos } = useCursos();
  const { configuracion } = useConfiguracion();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDocente, setEditingDocente] = useState<DocenteDB | null>(null);

  const configuracionHorario = configuracion.find(c => c.id === 'horario')?.data;

  if (!isInitialized || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando docentes...</p>
        </div>
      </div>
    );
  }

  const handleSaveDocente = async (docenteData: DocenteDB) => {
    await saveDocente(docenteData);
    setIsDialogOpen(false);
    toast({ title: "Éxito", description: "Docente guardado correctamente." });
  };
  
  const handleEdit = (docente: DocenteDB) => {
    setEditingDocente(docente);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar este docente?")) {
      await deleteDocente(id);
      toast({ title: "Éxito", description: "Docente eliminado." });
    }
  };

  return (
    <>
      <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Users className="h-8 w-8 text-indigo-600" />
              <h1 className="text-3xl font-bold text-gray-900">Gestión de Docentes</h1>
            </div>
            <p className="text-gray-600">
              Organiza, asigna y gestiona el personal docente de la institución.
            </p>
          </div>
          <Button onClick={() => { setEditingDocente(null); setIsDialogOpen(true); }} className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="h-4 w-4 mr-2" />
            Agregar Docente
          </Button>
      </div>

      <DocentesList docentes={docentes} cursos={cursos} asignaturas={asignaturas} onEdit={handleEdit} onDelete={handleDelete} />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingDocente ? "Editar Docente" : "Agregar Docente"}</DialogTitle>
          </DialogHeader>
          <DocenteForm
            docente={editingDocente}
            cursos={cursos}
            asignaturas={asignaturas}
            configuracionHorario={configuracionHorario}
            onSave={handleSaveDocente}
            onCancel={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

function DocentesList({ docentes, cursos, asignaturas, onEdit, onDelete }: any) {
    const [expandedDocentes, setExpandedDocentes] = useState<Set<string>>(new Set());

    const toggleExpanded = (docenteId: string) => {
        const newExpanded = new Set(expandedDocentes);
        newExpanded.has(docenteId) ? newExpanded.delete(docenteId) : newExpanded.add(docenteId);
        setExpandedDocentes(newExpanded);
    };

    const calcularHorasAsignadas = (docente) => {
        return docente.cursosAsignados?.reduce((total, ca) => {
            const curso = cursos.find(c => c.id === ca.cursoId);
            if (!curso) return total;
            const horasAsignaturas = ca.asignaturas.reduce((subtotal, asigId) => {
                const asig = asignaturas.find(a => a.id === asigId);
                if (asig) {
                    return subtotal + (asig.horasPorNivel[curso.nivel]?.[curso.grado] || 0);
                }
                return subtotal;
            }, 0);
            return total + horasAsignaturas;
        }, 0) || 0;
    };
    
    if (docentes.length === 0) {
        return <div className="text-center text-gray-500 py-10">No hay docentes registrados.</div>
    }
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {docentes.map((docente) => {
                const horasAsignadas = calcularHorasAsignadas(docente);
                const cargaPorcentaje = (horasAsignadas / docente.horasDisponibles) * 100;
                return (
                    <Card key={docente.id} className="flex flex-col">
                        <CardHeader>
                            <CardTitle className="flex justify-between items-start">
                               <span className="text-lg">{docente.nombre} {docente.apellido}</span>
                               <div className="flex-shrink-0">
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(docente)}><Edit className="h-4 w-4"/></Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDelete(docente.id)}><Trash2 className="h-4 w-4"/></Button>
                                </div>
                            </CardTitle>
                            <CardDescription>{docente.especialidad}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 flex-grow">
                            <div className="space-y-2 text-sm">
                              <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-gray-500"/>{docente.email || 'No disponible'}</p>
                              <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-gray-500"/>{docente.telefono || 'No disponible'}</p>
                            </div>
                            <div className="flex gap-2">
                               <Badge variant={docente.tipo.startsWith("titular") ? "default" : "secondary"}>
                                    {docente.tipo === 'titular' ? 'Titular' : docente.tipo === 'titular_con_adicionales' ? 'Titular c/ Adicionales' : 'Rotación'}
                               </Badge>
                               <Badge variant="outline">{docente.nivel}</Badge>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs">Carga Horaria</Label>
                                <Progress value={cargaPorcentaje} />
                                <p className="text-xs text-right">{horasAsignadas} / {docente.horasDisponibles} horas</p>
                            </div>
                            {docente.cursosAsignados && docente.cursosAsignados.length > 0 && (
                                <div className="pt-2 border-t">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-semibold text-sm">Asignaciones ({docente.cursosAsignados.length})</h4>
                                        <Button variant="ghost" size="sm" onClick={() => toggleExpanded(docente.id)}>
                                            {expandedDocentes.has(docente.id) ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                    {expandedDocentes.has(docente.id) && (
                                        <div className="space-y-2 mt-2 max-h-48 overflow-y-auto">
                                            {docente.cursosAsignados.map(ca => {
                                                const curso = cursos.find(c => c.id === ca.cursoId);
                                                return (
                                                    <div key={ca.cursoId} className="p-2 border rounded-md bg-gray-50">
                                                        <p className="font-bold text-xs flex items-center gap-2">
                                                            {curso?.nombre}
                                                            {ca.esTitular && <Badge variant="default" className="h-4 text-[10px]">Titular</Badge>}
                                                        </p>
                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                            {ca.asignaturas.map(asigId => {
                                                                const asig = asignaturas.find(a => a.id === asigId);
                                                                return <Badge key={asigId} variant="secondary" style={{backgroundColor: asig?.color, color: 'white', fontSize: '10px'}}>{asig?.codigo}</Badge>
                                                            })}
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )
            })}
        </div>
    )
}

function DocenteForm({ docente, cursos, asignaturas, configuracionHorario, onSave, onCancel }: any) {
    // ... (El formulario completo y funcional va aquí, igual que en la respuesta anterior)
}

const DynamicDocentesPage = dynamic(() => Promise.resolve(DocentesPageComponent), { ssr: false });

export default function DocentesPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-cyan-100 p-6">
            <div className="max-w-7xl mx-auto">
                <DynamicDocentesPage />
            </div>
        </div>
    );
}