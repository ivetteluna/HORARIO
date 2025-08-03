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
import { useState, useEffect } from "react"

const especialidadesComunes = [
  "Educación Básica", "Matemáticas", "Lengua Española", "Ciencias Naturales",
  "Ciencias Sociales", "Educación Física", "Educación Artística", "Inglés",
  "Francés", "Informática", "Orientación y Psicología", "Biblioteca",
];

const ordenarCursosAutomaticamente = (cursos: any[]) => {
  if (!cursos) return [];
  return [...cursos].sort((a, b) => {
    if (a.nivel !== b.nivel) return a.nivel === "primario" ? -1 : 1;
    const gradoA = parseInt(a.grado?.replace("°", "") || "0");
    const gradoB = parseInt(b.grado?.replace("°", "") || "0");
    if (gradoA !== gradoB) return gradoA - gradoB;
    return (a.seccion || "").localeCompare(b.seccion || "");
  });
};

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
    try {
      await saveDocente(docenteData);
      setIsDialogOpen(false);
      toast({ title: "Éxito", description: "Docente guardado correctamente." });
    } catch (error) {
      console.error("Failed to save docente:", error);
      toast({ title: "Error", description: "No se pudo guardar el docente.", variant: "destructive" });
    }
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
          { isDialogOpen && (
            <DocenteForm
                docente={editingDocente}
                cursos={cursos}
                asignaturas={asignaturas}
                configuracionHorario={configuracionHorario}
                onSave={handleSaveDocente}
                onCancel={() => setIsDialogOpen(false)}
            />
          )}
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
                if (asig && asig.horasPorNivel && asig.horasPorNivel[curso.nivel]) {
                    return subtotal + (asig.horasPorNivel[curso.nivel][curso.grado] || 0);
                }
                return subtotal;
            }, 0);
            return total + horasAsignaturas;
        }, 0) || 0;
    };
    
    if (docentes.length === 0) {
        return <div className="text-center text-gray-500 py-10">No hay docentes registrados. Haz clic en "Agregar Docente" para empezar.</div>
    }
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {docentes.map((docente) => {
                const horasAsignadas = calcularHorasAsignadas(docente);
                const cargaPorcentaje = docente.horasDisponibles > 0 ? (horasAsignadas / docente.horasDisponibles) * 100 : 0;
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
    const [formData, setFormData] = useState<Partial<DocenteDB>>({
        nombre: docente?.nombre || "",
        apellido: docente?.apellido || "",
        cedula: docente?.cedula || "",
        especialidad: docente?.especialidad || "",
        email: docente?.email || "",
        telefono: docente?.telefono || "",
        tipo: docente?.tipo || "titular",
        nivel: docente?.nivel || "primario",
        horasDisponibles: docente?.horasDisponibles || 40,
        cursosAsignados: docente?.cursosAsignados ? JSON.parse(JSON.stringify(docente.cursosAsignados)) : [],
        restricciones: docente?.restricciones ? JSON.parse(JSON.stringify(docente.restricciones)) : [],
    });
    const [nuevaRestriccion, setNuevaRestriccion] = useState({ dia: "", periodo: "", actividad: "" });
    const [asignacionForm, setAsignacionForm] = useState({ cursoId: "", asignaturas: [], esTitular: false });

    useEffect(() => {
        if (docente) {
             setFormData({
                ...docente,
                cursosAsignados: docente.cursosAsignados ? JSON.parse(JSON.stringify(docente.cursosAsignados)) : [],
                restricciones: docente.restricciones ? JSON.parse(JSON.stringify(docente.restricciones)) : [],
             });
        }
    }, [docente]);
    
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

    const handleAsignacionCursoChange = (cursoId) => {
        setAsignacionForm({ cursoId, asignaturas: [], esTitular: false });
    };

    const handleAsignaturaToggle = (asignaturaId) => {
        setAsignacionForm(prev => {
            const newAsignaturas = prev.asignaturas.includes(asignaturaId)
                ? prev.asignaturas.filter(id => id !== asignaturaId)
                : [...prev.asignaturas, asignaturaId];
            return { ...prev, asignaturas: newAsignaturas };
        });
    };
    
    const agregarAsignacion = () => {
        if (!asignacionForm.cursoId || asignacionForm.asignaturas.length === 0) {
            toast({ title: "Selección incompleta", description: "Elige un curso y al menos una asignatura.", variant: "destructive" });
            return;
        }

        setFormData(prev => {
            const newCursosAsignados = [...(prev.cursosAsignados || [])];
            const existingIndex = newCursosAsignados.findIndex(ca => ca.cursoId === asignacionForm.cursoId);
            
            if (existingIndex > -1) { 
                newCursosAsignados[existingIndex].asignaturas = [...new Set([...newCursosAsignados[existingIndex].asignaturas, ...asignacionForm.asignaturas])];
                if (asignacionForm.esTitular) {
                    newCursosAsignados.forEach(ca => ca.esTitular = ca.cursoId === asignacionForm.cursoId);
                }
            } else { 
                if (asignacionForm.esTitular) {
                    newCursosAsignados.forEach(ca => ca.esTitular = false); 
                }
                newCursosAsignados.push({ ...asignacionForm, horasAsignadas: 0 }); 
            }
            return { ...prev, cursosAsignados: newCursosAsignados };
        });

        setAsignacionForm({ cursoId: "", asignaturas: [], esTitular: false });
    };
    
    const eliminarAsignacion = (cursoId: string) => {
        setFormData(prev => ({...prev, cursosAsignados: prev.cursosAsignados.filter(ca => ca.cursoId !== cursoId)}));
    }

    const periodosDeClase = configuracionHorario?.periodosPersonalizados?.filter(p => p.tipo === "clase") || [];
    const cursosDisponibles = ordenarCursosAutomaticamente(cursos.filter(c => formData.nivel === 'ambos' || c.nivel === formData.nivel));

    const asignaturasDelCursoSeleccionado = asignaturas.filter(asig => {
        const cursoSeleccionado = cursos.find(c => c.id === asignacionForm.cursoId);
        if(!cursoSeleccionado) return false;
        return asig.horasPorNivel[cursoSeleccionado.nivel]?.[cursoSeleccionado.grado] > 0;
    });

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4 p-4 border rounded-lg">
                <h3 className="text-lg font-medium">Información Personal</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><Label>Nombre *</Label><Input required value={formData.nombre} onChange={e => setFormData(f => ({...f, nombre: e.target.value}))} /></div>
                    <div><Label>Apellido *</Label><Input required value={formData.apellido} onChange={e => setFormData(f => ({...f, apellido: e.target.value}))} /></div>
                    <div><Label>Cédula *</Label><Input required value={formData.cedula} onChange={e => setFormData(f => ({...f, cedula: e.target.value}))} /></div>
                    <div><Label>Teléfono</Label><Input value={formData.telefono} onChange={e => setFormData(f => ({...f, telefono: e.target.value}))} /></div>
                    <div className="md:col-span-2"><Label>Email</Label><Input type="email" value={formData.email} onChange={e => setFormData(f => ({...f, email: e.target.value}))} /></div>
                </div>
            </div>
            
            <div className="space-y-4 p-4 border rounded-lg">
                <h3 className="text-lg font-medium">Información Profesional</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <div>
                        <Label>Tipo de Docente</Label>
                        <Select value={formData.tipo} onValueChange={v => setFormData(f => ({...f, tipo: v}))}>
                            <SelectTrigger><SelectValue/></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="titular">Titular (Un solo curso)</SelectItem>
                                <SelectItem value="titular_con_adicionales">Titular con Asignaturas Adicionales</SelectItem>
                                <SelectItem value="rotacion">De Rotación (Área)</SelectItem>
                            </SelectContent>
                        </Select>
                     </div>
                     <div><Label>Nivel</Label><Select value={formData.nivel} onValueChange={v => setFormData(f => ({...f, nivel: v}))}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="primario">Primario</SelectItem><SelectItem value="secundario">Secundario</SelectItem><SelectItem value="ambos">Ambos</SelectItem></SelectContent></Select></div>
                     <div><Label>Horas Disponibles</Label><Input type="number" value={formData.horasDisponibles} onChange={e => setFormData(f => ({...f, horasDisponibles: parseInt(e.target.value) || 0}))} /></div>
                </div>
                <div>
                  <Label>Título Académico</Label>
                  <Input value={formData.especialidad} onChange={e => setFormData(f => ({...f, especialidad: e.target.value}))} placeholder="Ej: Lic. en Educación Básica"/>
                </div>
            </div>

            <div className="space-y-4 rounded-lg border bg-gray-50 p-4">
                <h3 className="text-lg font-medium">Asignación de Cursos y Materias</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label>Curso</Label>
                        <Select value={asignacionForm.cursoId} onValueChange={handleAsignacionCursoChange}>
                            <SelectTrigger><SelectValue placeholder="Seleccionar curso" /></SelectTrigger>
                            <SelectContent>
                                {cursosDisponibles.map(c => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label>Asignaturas</Label>
                        <div className="p-2 border rounded-md max-h-32 overflow-y-auto space-y-1 bg-white">
                            {asignacionForm.cursoId ? asignaturasDelCursoSeleccionado.map(a => (
                                <div key={a.id} className="flex items-center gap-2">
                                    <input type="checkbox" id={`asig-${a.id}`} checked={asignacionForm.asignaturas.includes(a.id)} onChange={() => handleAsignaturaToggle(a.id)} />
                                    <label htmlFor={`asig-${a.id}`} className="text-sm">{a.nombre}</label>
                                </div>
                            )) : <p className="text-xs text-gray-500">Selecciona un curso primero.</p>}
                        </div>
                    </div>
                </div>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <input type="checkbox" id="esTitular" checked={asignacionForm.esTitular} onChange={(e) => setAsignacionForm(prev => ({ ...prev, esTitular: e.target.checked }))} disabled={formData.tipo === 'rotacion'}/>
                        <Label htmlFor="esTitular" className="text-sm font-medium">Marcar como curso titular</Label>
                    </div>
                    <Button type="button" size="sm" onClick={agregarAsignacion}>Agregar Asignación</Button>
                </div>
                 
                 {formData.cursosAsignados && formData.cursosAsignados.length > 0 && (
                     <div className="pt-4 mt-4 border-t">
                         <h4 className="font-semibold">Asignaciones Actuales</h4>
                         <div className="space-y-2 mt-2 max-h-40 overflow-y-auto">
                             {formData.cursosAsignados.map(ca => {
                                const curso = cursos.find(c => c.id === ca.cursoId);
                                return (
                                    <div key={ca.cursoId} className="flex justify-between items-center p-2 bg-white rounded border">
                                       <div>
                                           <p className="font-bold flex items-center gap-2">{curso?.nombre} {ca.esTitular && <Badge>Titular</Badge>}</p>
                                           <div className="flex gap-1 flex-wrap mt-1">
                                               {ca.asignaturas.map(asigId => {
                                                   const asig = asignaturas.find(a => a.id === asigId);
                                                   return <Badge key={asigId} style={{backgroundColor: asig?.color, color: 'white'}}>{asig?.codigo}</Badge>
                                               })}
                                           </div>
                                       </div>
                                       <Button type="button" variant="ghost" size="icon" onClick={() => eliminarAsignacion(ca.cursoId)}><Trash2 className="h-4 w-4 text-red-500"/></Button>
                                    </div>
                                )
                             })}
                         </div>
                     </div>
                 )}
            </div>

            <div className="space-y-4 rounded-lg border bg-gray-50 p-4">
                <h3 className="text-lg font-medium text-gray-900">Restricciones de Horario</h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4 items-end">
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
                                {periodosDeClase.map(p => <SelectItem key={p.nombre} value={p.nombre}>{p.nombre} ({p.inicio} - {p.fin})</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <Label>Actividad</Label>
                        <div className="flex gap-2">
                            <Input value={nuevaRestriccion.actividad} onChange={e => setNuevaRestriccion(p => ({...p, actividad: e.target.value}))} placeholder="Escribe la actividad..."/>
                            <Button type="button" onClick={agregarRestriccion}><Plus className="h-4 w-4"/></Button>
                        </div>
                    </div>
                </div>
                {formData.restricciones && formData.restricciones.length > 0 && (
                    <div className="space-y-2 pt-4">
                        <div className="max-h-40 overflow-y-auto space-y-2 rounded-md border p-2">
                            {formData.restricciones.map((r, index) => (
                                <div key={index} className="flex items-center justify-between rounded-md bg-white p-2 text-sm">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <Badge variant="secondary">{r.dia}</Badge>
                                        <Badge variant="outline">{r.periodo}</Badge>
                                        <span>{r.actividad}</span>
                                    </div>
                                    <Button type="button" variant="ghost" size="icon" onClick={() => eliminarRestriccion(index)}><X className="h-4 w-4" /></Button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            
            <div className="flex justify-end gap-4 border-t pt-4">
                <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
                <Button type="submit">{docente ? "Guardar Cambios" : "Agregar Docente"}</Button>
            </div>
        </form>
    );
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