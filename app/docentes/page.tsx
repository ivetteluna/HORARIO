"use client"

import dynamic from 'next/dynamic'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Plus,
  Edit,
  Trash2,
  Users,
  Mail,
  Phone,
  BookOpen,
  GraduationCap,
  X,
} from "lucide-react"
import { useDocentes, useAsignaturas, useCursos, useDatabase, useConfiguracion } from "@/hooks/useDatabase"
import { useNiveles } from "@/hooks/useNiveles"
import type { DocenteDB } from "@/lib/database"
import { toast } from "@/hooks/use-toast"
import { useState, useEffect } from "react"

const especialidadesComunes = [
  "Educación Básica", "Matemáticas", "Lengua Española", "Ciencias Naturales",
  "Ciencias Sociales", "Educación Física", "Educación Artística", "Inglés",
  "Francés", "Informática", "Orientación y Psicología", "Biblioteca",
];

function DocentesPageComponent() {
  const { isInitialized } = useDatabase();
  const { docentes, loading, saveDocente, deleteDocente } = useDocentes();
  const { asignaturas } = useAsignaturas();
  const { cursos } = useCursos();
  const { niveles } = useNiveles();
  const { configuracion } = useConfiguracion();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDocente, setEditingDocente] = useState<DocenteDB | null>(null);

  const configuracionHorario = configuracion.find(c => c.id === 'horario')?.data;

  if (!isInitialized || loading) {
    return (
      <div className="flex h-full items-center justify-center p-6">
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

      <DocentesList docentes={docentes} onEdit={handleEdit} onDelete={deleteDocente} />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingDocente ? "Editar Docente" : "Agregar Docente"}</DialogTitle>
          </DialogHeader>
          <DocenteForm
            docente={editingDocente}
            configuracionHorario={configuracionHorario}
            onSave={handleSaveDocente}
            onCancel={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

function DocentesList({ docentes, onEdit, onDelete }: { docentes: DocenteDB[], onEdit: (docente: DocenteDB) => void, onDelete: (id: string) => void }) {
    if (docentes.length === 0) {
        return <p className="text-center text-gray-500 py-10">No hay docentes registrados.</p>
    }
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {docentes.map(docente => (
                <Card key={docente.id}>
                    <CardHeader>
                        <CardTitle className="flex justify-between items-center">
                            {docente.nombre} {docente.apellido}
                            <div>
                                <Button variant="ghost" size="icon" onClick={() => onEdit(docente)}><Edit className="h-4 w-4"/></Button>
                                <Button variant="ghost" size="icon" onClick={() => onDelete(docente.id)}><Trash2 className="h-4 w-4"/></Button>
                            </div>
                        </CardTitle>
                        <CardDescription>{docente.especialidad}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm"><Mail className="inline h-4 w-4 mr-2"/>{docente.email}</p>
                        <p className="text-sm"><Phone className="inline h-4 w-4 mr-2"/>{docente.telefono}</p>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}

function DocenteForm({ docente, configuracionHorario, onSave, onCancel }: any) {
    // ... El formulario de docentes se mantiene igual
}

const DynamicDocentesPage = dynamic(() => Promise.resolve(DocentesPageComponent), { ssr: false, /* ... */ });

export default function DocentesPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-cyan-100 p-6">
            <div className="max-w-7xl mx-auto">
                <DynamicDocentesPage />
            </div>
        </div>
    );
}