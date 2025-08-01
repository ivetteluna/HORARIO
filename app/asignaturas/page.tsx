"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Edit, Trash2, BookOpen, Palette, Search, GraduationCap } from "lucide-react"
import { useAsignaturas, useDatabase, useNiveles } from "@/hooks/useDatabase"
import type { AsignaturaDB } from "@/lib/database"
import { toast } from "@/hooks/use-toast"

const colores = [
  "#3B82F6",
  "#EF4444",
  "#10B981",
  "#F59E0B",
  "#8B5CF6",
  "#EC4899",
  "#06B6D4",
  "#84CC16",
  "#F97316",
  "#6366F1",
]

export default function AsignaturasPage() {
  const { isInitialized } = useDatabase()
  const { asignaturas, loading, saveAsignatura, deleteAsignatura } = useAsignaturas()
  const { niveles } = useNiveles()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingAsignatura, setEditingAsignatura] = useState<AsignaturaDB | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterTipo, setFilterTipo] = useState<"todas" | "basica" | "area">("todas")

  if (!isInitialized || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-cyan-100 p-6 flex items-center justify-center">
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

  const asignaturasBasicas = asignaturas.filter((a) => a.tipo === "basica")
  const asignaturasArea = asignaturas.filter((a) => a.tipo === "area")

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
      try {
        await deleteAsignatura(id)
        toast({
          title: "Asignatura eliminada",
          description: "La asignatura ha sido eliminada correctamente",
        })
      } catch (error) {
        toast({
          title: "Error",
          description: "No se pudo eliminar la asignatura",
          variant: "destructive",
        })
      }
    }
  }

  const getTotalHoras = (asignatura: AsignaturaDB) => {
    const horasPrimario = Object.values(asignatura.horasPorNivel.primario).reduce((sum, h) => sum + h, 0)
    const horasSecundario = Object.values(asignatura.horasPorNivel.secundario).reduce((sum, h) => sum + h, 0)
    return horasPrimario + horasSecundario
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-cyan-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
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
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/90 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Asignaturas Básicas</p>
                  <p className="text-3xl font-bold text-indigo-600">{asignaturasBasicas.length}</p>
                </div>
                <GraduationCap className="h-12 w-12 text-indigo-600 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Asignaturas de Área</p>
                  <p className="text-3xl font-bold text-emerald-600">{asignaturasArea.length}</p>
                </div>
                <BookOpen className="h-12 w-12 text-emerald-600 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Asignaturas</p>
                  <p className="text-3xl font-bold text-amber-600">{asignaturas.length}</p>
                </div>
                <Palette className="h-12 w-12 text-amber-600 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Horas Totales</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {asignaturas.reduce((total, asignatura) => total + getTotalHoras(asignatura), 0)}
                  </p>
                </div>
                <Badge className="h-12 w-12 text-purple-600 opacity-80 bg-transparent border-0">
                  <span className="text-2xl">⏰</span>
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-white/90 backdrop-blur-sm mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Buscar por nombre o código..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={filterTipo} onValueChange={(value: any) => setFilterTipo(value)}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filtrar por tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas las asignaturas</SelectItem>
                  <SelectItem value="basica">Asignaturas Básicas</SelectItem>
                  <SelectItem value="area">Asignaturas de Área</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Asignaturas Tabs */}
        <Tabs defaultValue="todas" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="todas">Todas ({asignaturas.length})</TabsTrigger>
            <TabsTrigger value="basicas">Básicas ({asignaturasBasicas.length})</TabsTrigger>
            <TabsTrigger value="area">De Área ({asignaturasArea.length})</TabsTrigger>
            <TabsTrigger value="niveles">Por Niveles</TabsTrigger>
          </TabsList>

          <TabsContent value="todas" className="space-y-6">
            <AsignaturasList asignaturas={filteredAsignaturas} onEdit={handleEdit} onDelete={handleDelete} />
          </TabsContent>

          <TabsContent value="basicas" className="space-y-6">
            <AsignaturasList
              asignaturas={filteredAsignaturas.filter((a) => a.tipo === "basica")}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </TabsContent>

          <TabsContent value="area" className="space-y-6">
            <AsignaturasList
              asignaturas={filteredAsignaturas.filter((a) => a.tipo === "area")}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </TabsContent>

          <TabsContent value="niveles" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {niveles.map((nivel) => (
                <Card key={nivel.id} className="bg-white/90 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <span className="text-2xl">{nivel.id === "primario" ? "🎒" : "🎓"}</span>
                      {nivel.nombre}
                    </CardTitle>
                    <CardDescription>{nivel.descripcion}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {filteredAsignaturas.map((asignatura) => {
                        const horasNivel = Object.values(
                          asignatura.horasPorNivel[nivel.id as keyof typeof asignatura.horasPorNivel],
                        ).reduce((sum, h) => sum + h, 0)
                        if (horasNivel === 0) return null

                        return (
                          <div
                            key={asignatura.id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: asignatura.color }} />
                              <div>
                                <span className="font-medium">{asignatura.nombre}</span>
                                <Badge variant="outline" className="ml-2 text-xs">
                                  {asignatura.codigo}
                                </Badge>
                              </div>
                            </div>
                            <Badge variant="secondary">{horasNivel}h</Badge>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingAsignatura ? "Editar Asignatura" : "Agregar Asignatura"}</DialogTitle>
              <DialogDescription>
                {editingAsignatura
                  ? "Modifica la información de la asignatura"
                  : "Ingresa la información de la nueva asignatura"}
              </DialogDescription>
            </DialogHeader>
            <AsignaturaForm
              asignatura={editingAsignatura}
              niveles={niveles}
              onSave={async (asignatura) => {
                try {
                  await saveAsignatura(asignatura)
                  setIsDialogOpen(false)
                  toast({
                    title: editingAsignatura ? "Asignatura actualizada" : "Asignatura agregada",
                    description: "Los cambios se han guardado correctamente",
                  })
                } catch (error) {
                  toast({
                    title: "Error",
                    description: "No se pudo guardar la asignatura",
                    variant: "destructive",
                  })
                }
              }}
              onCancel={() => setIsDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

function AsignaturasList({
  asignaturas,
  onEdit,
  onDelete,
}: {
  asignaturas: AsignaturaDB[]
  onEdit: (asignatura: AsignaturaDB) => void
  onDelete: (id: string) => void
}) {
  if (asignaturas.length === 0) {
    return (
      <div className="text-center py-12">
        <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No hay asignaturas</h3>
        <p className="text-gray-500">No se encontraron asignaturas con los filtros aplicados</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {asignaturas.map((asignatura) => (
        <Card key={asignatura.id} className="border border-gray-200 hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: asignatura.color }} />
                <div>
                  <h3 className="font-semibold text-lg text-gray-900">{asignatura.nombre}</h3>
                  <div className="flex gap-2 mt-1">
                    <Badge variant="secondary">{asignatura.codigo}</Badge>
                    <Badge variant={asignatura.tipo === "basica" ? "default" : "outline"}>
                      {asignatura.tipo === "basica" ? "Básica" : "Área"}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => onEdit(asignatura)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => onDelete(asignatura.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-4">{asignatura.descripcion}</p>

            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Nivel Primario:</p>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(asignatura.horasPorNivel.primario).map(([grado, horas]) => (
                    <div key={grado} className="text-center">
                      <div className="text-xs text-gray-600">{grado}</div>
                      <Badge variant="outline" className="text-xs">
                        {horas}h
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Nivel Secundario:</p>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(asignatura.horasPorNivel.secundario).map(([grado, horas]) => (
                    <div key={grado} className="text-center">
                      <div className="text-xs text-gray-600">{grado}</div>
                      <Badge variant="outline" className="text-xs">
                        {horas}h
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total horas:</span>
                  <Badge variant="default">
                    {Object.values(asignatura.horasPorNivel.primario).reduce((sum, h) => sum + h, 0) +
                      Object.values(asignatura.horasPorNivel.secundario).reduce((sum, h) => sum + h, 0)}
                    h
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function AsignaturaForm({
  asignatura,
  niveles,
  onSave,
  onCancel,
}: {
  asignatura: AsignaturaDB | null
  niveles: any[]
  onSave: (asignatura: AsignaturaDB) => void
  onCancel: () => void
}) {
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
  })

  const asignaturasComunes = {
    basica: [
      "Lengua Española",
      "Matemáticas",
      "Ciencias Naturales",
      "Ciencias Sociales",
      "Formación Integral Humana y Religiosa",
    ],
    area: [
      "Educación Física",
      "Educación Artística",
      "Inglés",
      "Francés",
      "Informática",
      "Orientación y Psicología",
      "Biblioteca",
    ],
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const id = asignatura?.id || Date.now().toString()
    onSave({ ...formData, id } as AsignaturaDB)
  }

  const updateHorasNivel = (nivel: "primario" | "secundario", grado: string, horas: number) => {
    setFormData({
      ...formData,
      horasPorNivel: {
        ...formData.horasPorNivel,
        [nivel]: {
          ...formData.horasPorNivel?.[nivel],
          [grado]: horas,
        },
      },
    })
  }

  const setPresetAsignatura = (nombre: string) => {
    setFormData({
      ...formData,
      nombre,
      codigo: nombre
        .split(" ")
        .map((word) => word[0])
        .join("")
        .toUpperCase(),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Información Básica */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Información Básica</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="tipo">Tipo de Asignatura</Label>
            <Select value={formData.tipo} onValueChange={(value: any) => setFormData({ ...formData, tipo: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="basica">Asignatura Básica</SelectItem>
                <SelectItem value="area">Asignatura de Área</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 mt-1">
              Esta clasificación es solo organizativa. Cualquier docente puede impartir cualquier asignatura según las
              necesidades del centro.
            </p>
          </div>
          <div>
            <Label>Asignaturas Sugeridas</Label>
            <p className="text-xs text-gray-500 mb-2">Haz clic para usar como plantilla (opcional)</p>
            <div className="flex flex-wrap gap-1 mt-2">
              {asignaturasComunes[formData.tipo as keyof typeof asignaturasComunes]?.map((nombre) => (
                <Button
                  key={nombre}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPresetAsignatura(nombre)}
                  className="text-xs"
                >
                  {nombre}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="nombre">Nombre de la Asignatura</Label>
            <Input
              id="nombre"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              placeholder="Ej: Matemáticas"
              required
            />
          </div>
          <div>
            <Label htmlFor="codigo">Código</Label>
            <Input
              id="codigo"
              value={formData.codigo}
              onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
              placeholder="Ej: MAT"
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor="descripcion">Descripción</Label>
          <Input
            id="descripcion"
            value={formData.descripcion}
            onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
            placeholder="Descripción de la asignatura"
          />
        </div>

        <div>
          <Label>Color</Label>
          <div className="flex gap-2 mt-2">
            {colores.map((color) => (
              <button
                key={color}
                type="button"
                className={`w-8 h-8 rounded-full border-2 ${
                  formData.color === color ? "border-gray-800" : "border-gray-300"
                }`}
                style={{ backgroundColor: color }}
                onClick={() => setFormData({ ...formData, color })}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Distribución de Horas */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Distribución de Horas por Nivel</h3>

        {niveles.map((nivel) => (
          <div key={nivel.id} className="space-y-3">
            <h4 className="font-medium text-gray-800 flex items-center gap-2">
              <span className="text-xl">{nivel.id === "primario" ? "🎒" : "🎓"}</span>
              {nivel.nombre}
            </h4>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {nivel.grados.map((grado: string) => (
                <div key={grado} className="space-y-1">
                  <Label className="text-sm text-center block">{grado}</Label>
                  <Input
                    type="number"
                    value={formData.horasPorNivel?.[nivel.id as keyof typeof formData.horasPorNivel]?.[grado] || 0}
                    onChange={(e) =>
                      updateHorasNivel(
                        nivel.id as "primario" | "secundario",
                        grado,
                        Number.parseInt(e.target.value) || 0,
                      )
                    }
                    min="0"
                    max="10"
                    className="text-center"
                  />
                </div>
              ))}
            </div>
            <div className="text-sm text-gray-600">
              Total {nivel.nombre}:{" "}
              {Object.values(formData.horasPorNivel?.[nivel.id as keyof typeof formData.horasPorNivel] || {}).reduce(
                (sum: number, h: number) => sum + h,
                0,
              )}{" "}
              horas semanales
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">{asignatura ? "Actualizar" : "Agregar"}</Button>
      </div>
    </form>
  )
}
