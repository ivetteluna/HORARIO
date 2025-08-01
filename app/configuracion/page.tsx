"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Settings, Clock, Upload, Save, Download, UploadCloud } from "lucide-react"
import { useConfiguracion, useDatabase } from "@/hooks/useDatabase"
import { database } from "@/lib/database"
import { toast } from "@/hooks/use-toast"

interface ConfiguracionHorario {
  horaInicio: string
  horaFin: string
  duracionClase: number
  recreos: { inicio: string; fin: string; nombre: string }[]
  almuerzo: { inicio: string; fin: string }
  diasSemana: string[]
  periodosPersonalizados: { inicio: string; fin: string; nombre: string; tipo: "clase" | "recreo" | "almuerzo" }[]
}

interface ConfiguracionEscuela {
  nombre: string
  logo: string
  direccion: string
  telefono: string
  email: string
}

export default function ConfiguracionPage() {
  const { isInitialized } = useDatabase()
  const { saveConfiguracion, getConfiguracion } = useConfiguracion()

  const [horario, setHorario] = useState<ConfiguracionHorario>({
    horaInicio: "04:00",
    horaFin: "15:00",
    duracionClase: 45,
    recreos: [],
    almuerzo: { inicio: "11:25", fin: "12:20" },
    diasSemana: ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"],
    periodosPersonalizados: [
      { inicio: "04:00", fin: "08:45", nombre: "Primera Hora", tipo: "clase" },
      { inicio: "08:45", fin: "09:30", nombre: "Segunda Hora", tipo: "clase" },
      { inicio: "09:30", fin: "09:55", nombre: "Recreo", tipo: "recreo" },
      { inicio: "09:55", fin: "10:40", nombre: "Tercera Hora", tipo: "clase" },
      { inicio: "10:40", fin: "11:25", nombre: "Cuarta Hora", tipo: "clase" },
      { inicio: "11:25", fin: "12:20", nombre: "Almuerzo", tipo: "almuerzo" },
      { inicio: "12:20", fin: "13:00", nombre: "Quinta Hora", tipo: "clase" },
      { inicio: "13:00", fin: "13:40", nombre: "Sexta Hora", tipo: "clase" },
      { inicio: "13:40", fin: "14:20", nombre: "Séptima Hora", tipo: "clase" },
      { inicio: "14:20", fin: "15:00", nombre: "Octava Hora", tipo: "clase" },
    ],
  })

  const [escuela, setEscuela] = useState<ConfiguracionEscuela>({
    nombre: "Centro Educativo San José",
    logo: "",
    direccion: "Av. Principal #123, Ciudad",
    telefono: "(809) 555-0123",
    email: "info@centrosanjose.edu.do",
  })

  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const loadConfig = async () => {
      if (!isInitialized) return

      try {
        const horarioConfig = await getConfiguracion("horario")
        const escuelaConfig = await getConfiguracion("escuela")

        if (horarioConfig) {
          setHorario(horarioConfig.data)
        }

        if (escuelaConfig) {
          setEscuela(escuelaConfig.data)
        }
      } catch (error) {
        console.error("Error loading configuration:", error)
      }
    }

    loadConfig()
  }, [isInitialized, getConfiguracion])

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setEscuela((prev) => ({ ...prev, logo: reader.result as string }))
      }
      reader.readAsDataURL(file)
    }
  }

  const agregarPeriodo = () => {
    setHorario({
      ...horario,
      periodosPersonalizados: [
        ...horario.periodosPersonalizados,
        { inicio: "10:00", fin: "10:45", nombre: "Nuevo Período", tipo: "clase" },
      ],
    })
  }

  const eliminarPeriodo = (index: number) => {
    setHorario({
      ...horario,
      periodosPersonalizados: horario.periodosPersonalizados.filter((_, i) => i !== index),
    })
  }

  const actualizarPeriodo = (index: number, campo: string, valor: string) => {
    const nuevosPeriodos = [...horario.periodosPersonalizados]
    nuevosPeriodos[index] = { ...nuevosPeriodos[index], [campo]: valor }
    setHorario({ ...horario, periodosPersonalizados: nuevosPeriodos })
  }

  const guardarConfiguracion = async () => {
    if (!isInitialized) {
      toast({
        title: "Error",
        description: "La base de datos no está inicializada",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    try {
      await saveConfiguracion({
        id: "horario",
        tipo: "horario",
        data: horario,
      })

      await saveConfiguracion({
        id: "escuela",
        tipo: "escuela",
        data: escuela,
      })

      toast({
        title: "Configuración guardada",
        description: "Los cambios se han guardado correctamente",
      })
    } catch (error) {
      console.error("Error saving configuration:", error)
      toast({
        title: "Error",
        description: "No se pudo guardar la configuración",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleExport = async () => {
    try {
      const exportData = {
        docentes: await database.getAll("docentes"),
        asignaturas: await database.getAll("asignaturas"),
        cursos: await database.getAll("cursos"),
        configuracion: await database.getAll("configuracion"),
      }

      const jsonString = JSON.stringify(exportData, null, 2)
      const blob = new Blob([jsonString], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `configuracion_horarios_${new Date().toISOString().split("T")[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: "Exportación exitosa",
        description: "Todos los datos han sido exportados.",
      })
    } catch (error) {
      console.error("Error exporting data:", error)
      toast({
        title: "Error de Exportación",
        description: "No se pudieron exportar los datos.",
        variant: "destructive",
      })
    }
  }

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!confirm("¿Estás seguro? Importar un archivo borrará todos los datos actuales del sistema.")) {
      return
    }

    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)

        // Limpiar base de datos
        await database.clearAllStores()

        // Importar datos
        for (const docente of data.docentes || []) await database.save("docentes", docente)
        for (const asignatura of data.asignaturas || []) await database.save("asignaturas", asignatura)
        for (const curso of data.cursos || []) await database.save("cursos", curso)
        for (const config of data.configuracion || []) await database.save("configuracion", config)

        toast({
          title: "Importación Completada",
          description: "Los datos se han restaurado. La página se recargará.",
        })

        setTimeout(() => window.location.reload(), 2000)
      } catch (error) {
        console.error("Error importing data:", error)
        toast({
          title: "Error de Importación",
          description: "El archivo no es válido o está corrupto.",
          variant: "destructive",
        })
      }
    }
    reader.readAsText(file)
  }

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-cyan-100 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Inicializando base de datos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-cyan-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Settings className="h-8 w-8 text-indigo-600" />
            <h1 className="text-3xl font-bold text-gray-900">Configuración del Sistema</h1>
          </div>
          <p className="text-gray-600">Configura los parámetros generales del sistema de horarios</p>
        </div>

        <Tabs defaultValue="escuela" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="escuela">Datos de la Escuela</TabsTrigger>
            <TabsTrigger value="horarios">Configuración de Horarios</TabsTrigger>
            <TabsTrigger value="preview">Vista Previa</TabsTrigger>
          </TabsList>

          <TabsContent value="escuela" className="space-y-6">
            <Card className="bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Información de la Institución
                </CardTitle>
                <CardDescription>Configura los datos que aparecerán en todos los horarios generados</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="nombre">Nombre de la Institución</Label>
                      <Input
                        id="nombre"
                        value={escuela.nombre}
                        onChange={(e) => setEscuela({ ...escuela, nombre: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="direccion">Dirección</Label>
                      <Input
                        id="direccion"
                        value={escuela.direccion}
                        onChange={(e) => setEscuela({ ...escuela, direccion: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="telefono">Teléfono</Label>
                      <Input
                        id="telefono"
                        value={escuela.telefono}
                        onChange={(e) => setEscuela({ ...escuela, telefono: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={escuela.email}
                        onChange={(e) => setEscuela({ ...escuela, email: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="logo">Logo de la Institución</Label>
                      <div className="mt-2 space-y-4">
                        <Input id="logo" type="file" accept="image/*" onChange={handleLogoUpload} className="cursor-pointer" />
                        {escuela.logo && (
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                            <img src={escuela.logo} alt="Logo" className="mx-auto max-w-full h-32 object-contain" />
                            <p className="text-sm text-gray-500 mt-2">Dimensiones recomendadas: 400px de ancho</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Gestión de Datos</CardTitle>
                <CardDescription>Crea copias de seguridad o restaura los datos del sistema.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col sm:flex-row gap-4">
                <Button onClick={handleExport} variant="outline" className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  Exportar Datos
                </Button>
                <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="w-full">
                  <UploadCloud className="mr-2 h-4 w-4" />
                  Importar Datos
                </Button>
                <input type="file" ref={fileInputRef} onChange={handleImport} className="hidden" accept=".json" />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="horarios" className="space-y-6">
            <Card className="bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Períodos de Clase Personalizados
                </CardTitle>
                <CardDescription>Define los períodos exactos de clase según tu horario institucional</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <Label className="text-base font-medium">Períodos del Día</Label>
                  <Button size="sm" onClick={agregarPeriodo} variant="outline">
                    Agregar Período
                  </Button>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {horario.periodosPersonalizados.map((periodo, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div>
                          <Label className="text-sm">Nombre</Label>
                          <Input
                            placeholder="Nombre del período"
                            value={periodo.nombre}
                            onChange={(e) => actualizarPeriodo(index, "nombre", e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-sm">Hora Inicio</Label>
                          <Input
                            type="time"
                            value={periodo.inicio}
                            onChange={(e) => actualizarPeriodo(index, "inicio", e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-sm">Hora Fin</Label>
                          <Input
                            type="time"
                            value={periodo.fin}
                            onChange={(e) => actualizarPeriodo(index, "fin", e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-sm">Tipo</Label>
                          <select
                            value={periodo.tipo}
                            onChange={(e) => actualizarPeriodo(index, "tipo", e.target.value)}
                            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          >
                            <option value="clase">Clase</option>
                            <option value="recreo">Recreo</option>
                            <option value="almuerzo">Almuerzo</option>
                          </select>
                        </div>
                      </div>
                      <Button size="sm" variant="destructive" onClick={() => eliminarPeriodo(index)} className="w-full">
                        Eliminar Período
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="mt-6">
                  <Label>Días de la Semana</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"].map((dia) => (
                      <label key={dia} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={horario.diasSemana.includes(dia)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setHorario({
                                ...horario,
                                diasSemana: [...horario.diasSemana, dia],
                              })
                            } else {
                              setHorario({
                                ...horario,
                                diasSemana: horario.diasSemana.filter((d) => d !== dia),
                              })
                            }
                          }}
                          className="rounded"
                        />
                        <span className="text-sm">{dia}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preview" className="space-y-6">
            <Card className="bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Vista Previa del Horario</CardTitle>
                <CardDescription>Así se verá la estructura de horarios con tu configuración actual</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center border-b pb-4">
                    {escuela.logo && (
                      <img src={escuela.logo} alt="Logo" className="mx-auto mb-4" style={{ width: "400px", height: "auto" }} />
                    )}
                    <h2 className="text-2xl font-bold">{escuela.nombre}</h2>
                    <p className="text-gray-600">{escuela.direccion}</p>
                    <p className="text-gray-600">
                      {escuela.telefono} | {escuela.email}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold mb-3">Estructura de Horarios</h3>
                      <div className="space-y-2">
                        {horario.periodosPersonalizados.map((periodo, index) => (
                          <div
                            key={index}
                            className={`flex justify-between items-center p-2 rounded ${
                              periodo.tipo === "recreo"
                                ? "bg-yellow-100"
                                : periodo.tipo === "almuerzo"
                                ? "bg-orange-100"
                                : "bg-blue-50"
                            }`}
                          >
                            <span className="font-medium">{periodo.nombre}</span>
                            <Badge variant="outline">
                              {periodo.inicio} - {periodo.fin}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-3">Resumen</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Total de períodos:</span>
                          <span>{horario.periodosPersonalizados.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Clases por día:</span>
                          <span>{horario.periodosPersonalizados.filter((p) => p.tipo === "clase").length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Recreos:</span>
                          <span>{horario.periodosPersonalizados.filter((p) => p.tipo === "recreo").length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Días activos:</span>
                          <span>{horario.diasSemana.length}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end mt-6">
          <Button onClick={guardarConfiguracion} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Guardando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Guardar Configuración
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}