"use client"

import dynamic from 'next/dynamic'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Edit, Trash2, BookOpen, Palette, Search, GraduationCap } from "lucide-react"
import { useAsignaturas, useDatabase } from "@/hooks/useDatabase"
import { useNiveles } from "@/hooks/useNiveles"
import type { AsignaturaDB } from "@/lib/database"
import { toast } from "@/hooks/use-toast"
import { useState, useEffect } from "react"

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

  return (
    <>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <BookOpen className="h-8 w-8 text-indigo-600" />
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Asignaturas</h1>
          </div>
          <p className="text-gray-600">Administra asignaturas básicas y de área por niveles educativos</p>
        </div>
        <Button onClick={() => {setEditingAsignatura(null); setIsDialogOpen(true)}} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="h-4 w-4 mr-2" />
          Agregar Asignatura
        </Button>
      </div>
      
      {/* Aquí puedes agregar el resto de la UI como filtros, tarjetas de estadísticas, etc. */}
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingAsignatura ? "Editar Asignatura" : "Agregar Asignatura"}</DialogTitle>
            <DialogDescription>
              {editingAsignatura ? "Modifica la información" : "Ingresa la información de la nueva asignatura"}
            </DialogDescription>
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
    if (!formData.nombre || !formData.codigo) {
        toast({ title: "Error", description: "Nombre y Código son obligatorios.", variant: "destructive" });
        return;
    }
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
                  [grado]: horas,
              }
          }
      }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div><Label>Nombre</Label><Input value={formData.nombre} onChange={e => setFormData(f => ({...f, nombre: e.target.value}))} /></div>
        <div><Label>Código</Label><Input value={formData.codigo} onChange={e => setFormData(f => ({...f, codigo: e.target.value}))} /></div>
      </div>
      
      {niveles.map(nivel => (
          <div key={nivel.id}>
              <h4 className="font-medium mb-2">{nivel.nombre}</h4>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                  {nivel.grados.map(grado => (
                      <div key={grado} className="space-y-1">
                          <Label className="text-sm">{grado}</Label>
                          <Input type="number" min="0" value={formData.horasPorNivel[nivel.id]?.[grado] || 0} onChange={e => updateHoras(nivel.id, grado, parseInt(e.target.value) || 0)} />
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

const DynamicAsignaturasPage = dynamic(() => Promise.resolve(AsignaturasPageComponent), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center p-6">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Cargando Módulo de Asignaturas...</p>
      </div>
    </div>
  )
});

export default function AsignaturasPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-cyan-100 p-6">
      <div className="max-w-7xl mx-auto">
        <DynamicAsignaturasPage />
      </div>
    </div>
  );
}