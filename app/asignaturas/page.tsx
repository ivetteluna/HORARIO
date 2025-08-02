"use client"

import type React from "react"
import { useState, useEffect } from "react"
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

const colores = [
  "#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6",
  "#EC4899", "#06B6D4", "#84CC16", "#F97316", "#6366F1",
]

function AsignaturasPageComponent() {
  const { isInitialized } = useDatabase()
  const { asignaturas, loading, saveAsignatura, deleteAsignatura } = useAsignaturas()
  const { niveles } = useNiveles()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingAsignatura, setEditingAsignatura] = useState<AsignaturaDB | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterTipo, setFilterTipo] = useState<"todas" | "basica" | "area">("todas")

  if (!isInitialized || loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando asignaturas...</p>
        </div>
      </div>
    )
  }

  const filteredAsignaturas = asignaturas.filter((asignatura) => {
    const matchesSearch =
      asignatura.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asignatura.codigo.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesTipo = filterTipo === "todas" || asignatura.tipo === filterTipo
    return matchesSearch && matchesTipo
  })

  const handleAdd = () => {
    setEditingAsignatura(null)
    setIsDialogOpen(true)
  }

  const handleEdit = (asignatura: AsignaturaDB) => {
    setEditingAsignatura(asignatura)
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm("¿Estás seguro de que deseas eliminar esta asignatura?")) {
      await deleteAsignatura(id)
      toast({ title: "Asignatura eliminada" })
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
          <p className="text-gray-600">Administra asignaturas básicas y de área por niveles educativos</p>
        </div>
        <Button onClick={handleAdd} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="h-4 w-4 mr-2" />
          Agregar Asignatura
        </Button>
      </div>

      {/* ... (Aquí iría el resto del JSX de la página, como los filtros y las pestañas) ... */}
      
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
            onSave={async (asignatura) => {
              await saveAsignatura(asignatura)
              setIsDialogOpen(false)
              toast({ title: "Éxito", description: "Asignatura guardada." })
            }}
            onCancel={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}

function AsignaturaForm({ asignatura, niveles, onSave, onCancel }: any) {
    // ... El contenido del formulario se mantiene igual
    return (
        <form onSubmit={(e) => { e.preventDefault(); onSave(asignatura); }}>
             {/* Contenido del formulario aquí */}
        </form>
    );
}


// Carga dinámica del componente principal de la página
const DynamicAsignaturasPage = dynamic(() => Promise.resolve(AsignaturasPageComponent), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center p-6">
        <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando...</p>
        </div>
    </div>
  )
})

export default function AsignaturasPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-cyan-100 p-6">
            <div className="max-w-7xl mx-auto">
                <DynamicAsignaturasPage />
            </div>
        </div>
    )
}