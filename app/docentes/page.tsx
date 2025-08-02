"use client"

import dynamic from 'next/dynamic'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  X,
} from "lucide-react"
import { useDocentes, useAsignaturas, useCursos, useDatabase, useConfiguracion } from "@/hooks/useDatabase"
import { useNiveles } from "@/hooks/useNiveles"
import type { DocenteDB, ConfiguracionDB } from "@/lib/database"
import { toast } from "@/hooks/use-toast"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

const especialidadesComunes = [
  "Educación Básica", "Matemáticas", "Lengua Española", "Ciencias Naturales",
  "Ciencias Sociales", "Educación Física", "Educación Artística", "Inglés",
  "Francés", "Informática", "Orientación y Psicología", "Biblioteca",
]

const ordenarCursosAutomaticamente = (cursos: any[]) => {
  return [...cursos].sort((a, b) => {
    if (a.nivel !== b.nivel) return a.nivel === "primario" ? -1 : 1
    const gradoA = parseInt(a.grado?.replace("°", "") || "0")
    const gradoB = parseInt(b.grado?.replace("°", "") || "0")
    if (gradoA !== gradoB) return gradoA - gradoB
    return (a.seccion || "").localeCompare(b.seccion || "")
  })
}

function DocentesPageComponent() {
  const { isInitialized } = useDatabase()
  const { docentes, loading: loadingDocentes, saveDocente, deleteDocente } = useDocentes()
  const { asignaturas } = useAsignaturas()
  const { cursos } = useCursos()
  const { niveles } = useNiveles()
  const { configuracion } = useConfiguracion()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingDocente, setEditingDocente] = useState<DocenteDB | null>(null)

  const configuracionHorario = configuracion.find(c => c.id === 'horario')?.data

  if (!isInitialized || loadingDocentes) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando docentes...</p>
        </div>
      </div>
    )
  }
  
  const handleSaveDocente = async (docenteData: DocenteDB) => {
    await saveDocente(docenteData)
    setIsDialogOpen(false)
    toast({ title: "Éxito", description: "Docente guardado correctamente." })
  }

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
      
      {/* Contenido principal de la página como tarjetas, filtros y listas */}
      
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
            asignaturas={asignaturas}
            cursos={cursos}
            niveles={niveles}
            configuracionHorario={configuracionHorario}
            onSave={handleSaveDocente}
            onCancel={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}


function DocenteForm({ docente, asignaturas, cursos, niveles, configuracionHorario, onSave, onCancel }: any) {
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
        restricciones: docente?.restricciones ? JSON.parse(JSON.stringify(docente.restricciones)) : [],
    });
    const [nuevaRestriccion, setNuevaRestriccion] = useState({ dia: "", periodo: "", actividad: "" });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const id = docente?.id || Date.now().toString();
        onSave({ ...formData, id });
    };

    const agregarRestriccion = () => {
        if (nuevaRestriccion.dia && nuevaRestriccion.periodo && nuevaRestriccion.actividad) {
            setFormData(prev => ({ ...prev, restricciones: [...(prev.restricciones || []), nuevaRestriccion] }));
            setNuevaRestriccion({ dia: "", periodo: "", actividad: "" });
        } else {
            toast({ title: "Campos Incompletos", variant: "destructive" });
        }
    };
    
    const eliminarRestriccion = (index: number) => {
        setFormData(prev => ({ ...prev, restricciones: prev.restricciones?.filter((_, i) => i !== index) }));
    };

    const periodosDeClase = configuracionHorario?.periodosPersonalizados?.filter(p => p.tipo === "clase") || [];

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4 rounded-lg border bg-gray-50 p-4">
                <h3 className="text-lg font-medium text-gray-900">Restricciones de Horario</h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    <div className="space-y-2">
                        <Label>Día</Label>
                        <Select value={nuevaRestriccion.dia} onValueChange={(v) => setNuevaRestriccion(p => ({...p, dia: v}))}>
                            <SelectTrigger><SelectValue placeholder="Día" /></SelectTrigger>
                            <SelectContent>
                                {configuracionHorario?.diasSemana.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Período</Label>
                         <Select value={nuevaRestriccion.periodo} onValueChange={(v) => setNuevaRestriccion(p => ({...p, periodo: v}))}>
                            <SelectTrigger><SelectValue placeholder="Período" /></SelectTrigger>
                            <SelectContent>
                                {periodosDeClase.map(p => <SelectItem key={p.nombre} value={p.nombre}>{p.nombre}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <Label>Actividad</Label>
                        <div className="flex gap-2">
                            <Input value={nuevaRestriccion.actividad} onChange={e => setNuevaRestriccion(p => ({...p, actividad: e.target.value}))} />
                            <Button type="button" onClick={agregarRestriccion}><Plus className="h-4 w-4"/></Button>
                        </div>
                    </div>
                </div>
                {formData.restricciones && formData.restricciones.length > 0 && (
                    <div className="space-y-2 pt-4">
                        <div className="max-h-40 overflow-y-auto space-y-2 rounded-md border p-2">
                            {formData.restricciones.map((r, index) => (
                                <div key={index} className="flex items-center justify-between rounded-md bg-white p-2 text-sm">
                                    <Badge variant="secondary">{r.dia}</Badge>
                                    <Badge variant="outline">{r.periodo}</Badge>
                                    <span>{r.actividad}</span>
                                    <Button type="button" variant="ghost" size="icon" onClick={() => eliminarRestriccion(index)}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            <div className="flex justify-end gap-4">
                <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
                <Button type="submit">{docente ? "Guardar Cambios" : "Agregar Docente"}</Button>
            </div>
        </form>
    );
}

const DynamicDocentesPage = dynamic(() => Promise.resolve(DocentesPageComponent), {
    ssr: false,
    loading: () => (
        <div className="flex h-full items-center justify-center p-6">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Cargando Módulo de Docentes...</p>
            </div>
        </div>
    )
});

export default function DocentesPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-cyan-100 p-6">
            <div className="max-w-7xl mx-auto">
                <DynamicDocentesPage />
            </div>
        </div>
    );
}