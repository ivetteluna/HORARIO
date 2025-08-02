"use client"

import dynamic from 'next/dynamic'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Plus, Edit, Trash2, BookOpen } from "lucide-react"
import { useAsignaturas, useDatabase } from "@/hooks/useDatabase"
import { useNiveles } from "@/hooks/useNiveles"
import type { AsignaturaDB } from "@/lib/database"
import { toast } from "@/hooks/use-toast"
import { useState } from "react"

const colores = [
  "#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6",
  "#EC4899", "#06B6D4", "#84CC16", "#F97316", "#6366F1",
];

function AsignaturasPageComponent() {
  const { isInitialized } = useDatabase();
  const { asignaturas, loading, saveAsignatura, deleteAsignatura } = useAsignaturas();
  const { niveles } = useNiveles();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAsignatura, setEditingAsignatura] = useState<AsignaturaDB | null>(null);

  if (!isInitialized || loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando asignaturas...</p>
        </div>
      </div>
    );
  }
  
  const handleSave = async (data: AsignaturaDB) => {
      await saveAsignatura(data);
      setIsDialogOpen(false);
      toast({ title: "Éxito", description: "Asignatura guardada correctamente."});
  };
  
  const handleEdit = (asignatura: AsignaturaDB) => {
    setEditingAsignatura(asignatura);
    setIsDialogOpen(true);
  };
  
  const handleDelete = async (id: string) => {
      if(confirm("¿Seguro que deseas eliminar esta asignatura?")) {
          await deleteAsignatura(id);
          toast({ title: "Asignatura eliminada."});
      }
  }

  return (
    <>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <BookOpen className="h-8 w-8 text-indigo-600" />
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Asignaturas</h1>
          </div>
          <p className="text-gray-600">Administra las asignaturas de la institución.</p>
        </div>
        <Button onClick={() => {setEditingAsignatura(null); setIsDialogOpen(true)}} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="h-4 w-4 mr-2" />
          Agregar Asignatura
        </Button>
      </div>

      <AsignaturasList asignaturas={asignaturas} onEdit={handleEdit} onDelete={handleDelete} />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingAsignatura ? "Editar Asignatura" : "Agregar Asignatura"}</DialogTitle>
          </DialogHeader>
          <AsignaturaForm
            asignatura={editingAsignatura}
            niveles={niveles}
            onSave={handleSave}
            onCancel={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

function AsignaturasList({ asignaturas, onEdit, onDelete }: any) {
    if (asignaturas.length === 0) {
        return <p className="text-center text-gray-500 py-10">No hay asignaturas registradas.</p>
    }
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {asignaturas.map(asignatura => (
                <Card key={asignatura.id} style={{ borderTop: `4px solid ${asignatura.color}` }}>
                    <CardHeader>
                        <CardTitle className="flex justify-between items-start">
                           <span className="flex items-center gap-2">
                               <div className="w-3 h-3 rounded-full" style={{backgroundColor: asignatura.color}}></div>
                               {asignatura.nombre}
                           </span>
                           <div>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(asignatura)}><Edit className="h-4 w-4"/></Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDelete(asignatura.id)}><Trash2 className="h-4 w-4"/></Button>
                            </div>
                        </CardTitle>
                        <CardDescription>Código: <Badge variant="secondary">{asignatura.codigo}</Badge></CardDescription>
                    </CardHeader>
                    <CardContent>
                       <p className="text-sm text-gray-600 h-12">{asignatura.descripcion}</p>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}

function AsignaturaForm({ asignatura, niveles, onSave, onCancel }: any) {
  const [formData, setFormData] = useState<Partial<AsignaturaDB>>({
    nombre: asignatura?.nombre || "",
    codigo: asignatura?.codigo || "",
    descripcion: asignatura?.descripcion || "",
    color: asignatura?.color || colores[0],
    tipo: asignatura?.tipo || "basica",
    horasPorNivel: asignatura?.horasPorNivel || {
      primario: { "1°": 0, "2°": 0, "3°": 0, "4°": 0, "5°": 0, "6°": 0 },
      secundario: { "1°": 0, "2°": 0, "3°": 0, "4°": 0, "5°": 0, "6°": 0 },
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = asignatura?.id || Date.now().toString();
    onSave({ ...formData, id });
  };
  
  const updateHoras = (nivel, grado, horas) => {
      setFormData(prev => ({
          ...prev,
          horasPorNivel: {
              ...prev.horasPorNivel,
              [nivel]: {
                  ...prev.horasPorNivel[nivel],
                  [grado]: parseInt(horas) || 0,
              }
          }
      }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label>Nombre *</Label><Input required value={formData.nombre} onChange={e => setFormData(f => ({...f, nombre: e.target.value}))} /></div>
            <div><Label>Código *</Label><Input required value={formData.codigo} onChange={e => setFormData(f => ({...f, codigo: e.target.value}))} /></div>
        </div>
        <div><Label>Descripción</Label><Input value={formData.descripcion} onChange={e => setFormData(f => ({...f, descripcion: e.target.value}))} /></div>
        <div>
            <Label>Color</Label>
            <div className="flex gap-2 mt-2">
                {colores.map(c => <button type="button" key={c} onClick={() => setFormData(f => ({...f, color: c}))} className={`w-8 h-8 rounded-full border-2 ${formData.color === c ? 'border-blue-600 ring-2 ring-blue-300' : 'border-gray-300'}`} style={{backgroundColor: c}} />)}
            </div>
        </div>
        
      {niveles.map(nivel => (
          <div key={nivel.id} className="p-4 border rounded-lg">
              <h4 className="font-medium mb-4">{nivel.nombre}</h4>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                  {nivel.grados.map(grado => (
                      <div key={grado} className="space-y-1 text-center">
                          <Label className="text-sm font-medium">{grado}</Label>
                          <Input type="number" min="0" className="text-center" value={formData.horasPorNivel[nivel.id]?.[grado] || 0} onChange={e => updateHoras(nivel.id, grado, e.target.value)} />
                      </div>
                  ))}
              </div>
          </div>
      ))}

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit">{asignatura ? "Actualizar" : "Agregar"}</Button>
      </div>
    </form>
  );
}

const DynamicAsignaturasPage = dynamic(() => Promise.resolve(AsignaturasPageComponent), { ssr: false, /* ... */ });

export default function AsignaturasPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-cyan-100 p-6">
            <div className="max-w-7xl mx-auto">
                <DynamicAsignaturasPage />
            </div>
        </div>
    );
}