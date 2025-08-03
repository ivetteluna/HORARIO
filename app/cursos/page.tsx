"use client"

import dynamic from 'next/dynamic'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  GraduationCap,
  Plus,
  Edit,
  Trash2,
  Users,
  AlertTriangle,
} from "lucide-react"
import { useCursos, useDocentes, useDatabase } from "@/hooks/useDatabase"
import { toast } from "@/hooks/use-toast"
import { useState } from "react"
import { cn } from "@/lib/utils"

function CursosPageComponent() {
  const { isInitialized } = useDatabase()
  const { cursos, loading, saveCurso, deleteCurso } = useCursos()
  const { docentes } = useDocentes()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCurso, setEditingCurso] = useState(null)

  const [formData, setFormData] = useState({
    nivel: "",
    grado: "",
    seccion: "",
    estudiantesMatriculados: "",
    aula: "",
    docenteTitularId: "",
  })
  
  // ... (Lógica de ordenamiento y guardado se mantiene igual)

  const cursosOrdenados = cursos; // Simplificado para brevedad

  return (
    <>
      {/* ... (Header y Dialog se mantienen igual) ... */}
      
      {cursosOrdenados.length === 0 ? (
          <Card className="text-center p-12">
             <GraduationCap className="h-16 w-16 text-gray-400 mx-auto mb-4" />
             <h3 className="text-xl font-semibold">No hay cursos registrados</h3>
           </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cursosOrdenados.map((curso) => {
              const docenteTitular = docentes.find(d => d.id === curso.docenteTitularId);
              const docentesRotacion = docentes.filter(d => 
                d.tipo === 'rotacion' && d.cursosAsignados.some(ca => ca.cursoId === curso.id)
              );

              return (
                <Card key={curso.id} className={cn(
                  "hover:shadow-lg transition-shadow border-2",
                   curso.nivel === "primario" ? "bg-green-50 border-green-700" : "bg-blue-50 border-blue-700",
                )}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{curso.nombre}</CardTitle>
                      <div>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(curso)}><Edit className="h-4 w-4"/></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(curso)}><Trash2 className="h-4 w-4"/></Button>
                      </div>
                    </div>
                    <CardDescription>{curso.estudiantesMatriculados} estudiantes</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {docenteTitular ? (
                        <div className="text-sm font-medium flex items-center gap-2 p-2 bg-white rounded border">
                            <Users className="h-4 w-4 text-gray-600"/> 
                            <span>Titular: {docenteTitular.nombre} {docenteTitular.apellido}</span>
                        </div>
                    ) : (
                        <div className="text-sm text-amber-800 flex items-center gap-2 p-2 bg-amber-100 rounded border border-amber-300">
                            <AlertTriangle className="h-4 w-4"/> 
                            <span>Sin titular asignado</span>
                        </div>
                    )}
                    {docentesRotacion.length > 0 && (
                        <div className="pt-2 border-t">
                            <h4 className="text-xs font-bold text-gray-500 mb-2">DOCENTES DE ROTACIÓN:</h4>
                            <div className="space-y-1">
                                {docentesRotacion.map(d => (
                                    <div key={d.id} className="text-xs">
                                        <span className="font-semibold">{d.nombre} {d.apellido}</span>
                                        <span className="text-gray-600"> ({d.especialidad})</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
    </>
  );
}

const DynamicCursosPage = dynamic(() => Promise.resolve(CursosPageComponent), { ssr: false });

export default function CursosPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-cyan-100 p-6">
            <div className="max-w-7xl mx-auto">
                <DynamicCursosPage />
            </div>
        </div>
    );
}