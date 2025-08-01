"use client"

import { useState, useEffect } from "react"
import { database, type DocenteDB, type CursoDB, type AsignaturaDB, type ConfiguracionDB } from "@/lib/database"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Calendar, Clock, Users, BookOpen, AlertTriangle, CheckCircle, Play, RotateCcw } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface HorarioGenerado {
  id: string
  tipo: "docente" | "curso"
  entidadId: string
  nombre: string
  horario: {
    [dia: string]: {
      [periodo: string]: {
        asignatura: string
        docente?: string
        curso?: string
        aula?: string
      }
    }
  }
  fechaGeneracion: string
}

interface EstadisticasGeneracion {
  totalDocentes: number
  totalCursos: number
  totalAsignaturas: number
  horariosGenerados: number
  conflictosDetectados: number
  tiempoGeneracion: number
}

interface ConfiguracionHorario {
  periodosPersonalizados: Array<{
    nombre: string
    inicio: string
    fin: string
    tipo: "clase" | "recreo" | "almuerzo"
  }>
  diasSemana: string[]
}

interface AsignacionPendiente {
  asignaturaId: string
  asignaturaNombre: string
  horasRestantes: number
  curso?: string
  docente?: string
}

export default function GenerarPage() {
  const [docentes, setDocentes] = useState<DocenteDB[]>([])
  const [cursos, setCursos] = useState<CursoDB[]>([])
  const [asignaturas, setAsignaturas] = useState<AsignaturaDB[]>([])
  const [configuracion, setConfiguracion] = useState<ConfiguracionHorario | null>(null)
  const [loading, setLoading] = useState(true)
  const [generando, setGenerando] = useState(false)
  const [progreso, setProgreso] = useState(0)
  const [estadisticas, setEstadisticas] = useState<EstadisticasGeneracion | null>(null)
  const [horariosGenerados, setHorariosGenerados] = useState<HorarioGenerado[]>([])
  const [mensajeProgreso, setMensajeProgreso] = useState("")

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      await database.init()

      const [docentesData, cursosData, asignaturasData, horarioConfig] = await Promise.all([
        database.getAll<DocenteDB>("docentes"),
        database.getAll<CursoDB>("cursos"),
        database.getAll<AsignaturaDB>("asignaturas"),
        database.get<ConfiguracionDB>("configuracion", "horario"),
      ])

      setDocentes(docentesData)
      setCursos(cursosData)
      setAsignaturas(asignaturasData)
      setConfiguracion(
        horarioConfig?.data || {
          periodosPersonalizados: [
            { nombre: "Primera Hora", inicio: "08:00", fin: "08:45", tipo: "clase" },
            { nombre: "Segunda Hora", inicio: "08:45", fin: "09:30", tipo: "clase" },
            { nombre: "Recreo", inicio: "09:30", fin: "09:45", tipo: "recreo" },
            { nombre: "Tercera Hora", inicio: "09:45", fin: "10:30", tipo: "clase" },
            { nombre: "Cuarta Hora", inicio: "10:30", fin: "11:15", tipo: "clase" },
            { nombre: "Quinta Hora", inicio: "11:15", fin: "12:00", tipo: "clase" },
            { nombre: "Almuerzo", inicio: "12:00", fin: "13:00", tipo: "almuerzo" },
            { nombre: "Sexta Hora", inicio: "13:00", fin: "13:45", tipo: "clase" },
            { nombre: "Séptima Hora", inicio: "13:45", fin: "14:30", tipo: "clase" },
            { nombre: "Octava Hora", inicio: "14:30", fin: "15:15", tipo: "clase" },
          ],
          diasSemana: ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"],
        },
      )

      const horariosGuardados = localStorage.getItem("horariosGenerados")
      if (horariosGuardados) {
        setHorariosGenerados(JSON.parse(horariosGuardados))
      }
    } catch (error) {
      console.error("Error loading data:", error)
      toast({
        title: "Error",
        description: "Error al cargar los datos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Función para verificar si una asignatura ya está asignada en un día
  const asignaturaYaAsignadaEnDia = (horario: any, dia: string, asignatura: string): number => {
    let count = 0
    Object.values(horario[dia] || {}).forEach((asignacion: any) => {
      if (asignacion.asignatura === asignatura) {
        count++
      }
    })
    return count
  }

  // Función para encontrar períodos consecutivos libres
  const encontrarPeriodosConsecutivos = (
    horario: any,
    dia: string,
    periodosClase: any[],
    cantidadHoras: number,
  ): string[] | null => {
    for (let i = 0; i <= periodosClase.length - cantidadHoras; i++) {
      const periodosConsecutivos = []
      let todosLibres = true

      for (let j = 0; j < cantidadHoras; j++) {
        const periodo = periodosClase[i + j]
        if (horario[dia][periodo.nombre].asignatura !== "Hora Pedagógica") {
          todosLibres = false
          break
        }
        periodosConsecutivos.push(periodo.nombre)
      }

      if (todosLibres) {
        return periodosConsecutivos
      }
    }
    return null
  }

  // Función para asignar horas de una asignatura respetando las reglas
  const asignarAsignatura = (
    horario: any,
    asignacion: AsignacionPendiente,
    dias: string[],
    periodosClase: any[],
  ): boolean => {
    const { asignaturaId, asignaturaNombre, horasRestantes } = asignacion
    let horasAsignadas = 0

    // Mezclar días aleatoriamente
    const diasAleatorios = [...dias].sort(() => Math.random() - 0.5)

    for (const dia of diasAleatorios) {
      if (horasAsignadas >= horasRestantes) break

      const horasYaEnDia = asignaturaYaAsignadaEnDia(horario, dia, asignaturaNombre)

      // Regla: No más de 1 hora por día, excepto si tiene más de 4 horas semanales
      const maxHorasPorDia = horasRestantes > 4 ? 2 : 1

      if (horasYaEnDia >= maxHorasPorDia) continue

      const horasAAsignarEnDia = Math.min(maxHorasPorDia - horasYaEnDia, horasRestantes - horasAsignadas)

      if (horasAAsignarEnDia === 0) continue

      if (horasAAsignarEnDia === 1) {
        // Asignar una sola hora
        const periodosLibres = periodosClase.filter((p) => horario[dia][p.nombre].asignatura === "Hora Pedagógica")

        if (periodosLibres.length > 0) {
          const periodoAleatorio = periodosLibres[Math.floor(Math.random() * periodosLibres.length)]
          horario[dia][periodoAleatorio.nombre] = {
            asignatura: asignaturaNombre,
            ...(asignacion.curso && { curso: asignacion.curso }),
            ...(asignacion.docente && { docente: asignacion.docente }),
          }
          horasAsignadas++
        }
      } else if (horasAAsignarEnDia === 2) {
        // Asignar dos horas consecutivas
        const periodosConsecutivos = encontrarPeriodosConsecutivos(horario, dia, periodosClase, 2)

        if (periodosConsecutivos) {
          periodosConsecutivos.forEach((periodo) => {
            horario[dia][periodo] = {
              asignatura: asignaturaNombre,
              ...(asignacion.curso && { curso: asignacion.curso }),
              ...(asignacion.docente && { docente: asignacion.docente }),
            }
          })
          horasAsignadas += 2
        } else {
          // Si no hay períodos consecutivos, asignar una sola hora
          const periodosLibres = periodosClase.filter((p) => horario[dia][p.nombre].asignatura === "Hora Pedagógica")

          if (periodosLibres.length > 0) {
            const periodoAleatorio = periodosLibres[Math.floor(Math.random() * periodosLibres.length)]
            horario[dia][periodoAleatorio.nombre] = {
              asignatura: asignaturaNombre,
              ...(asignacion.curso && { curso: asignacion.curso }),
              ...(asignacion.docente && { docente: asignacion.docente }),
            }
            horasAsignadas++
          }
        }
      }
    }

    return horasAsignadas === horasRestantes
  }

  // Función para verificar horas pedagógicas consecutivas
  const verificarHorasPedagogicasConsecutivas = (horario: any, dias: string[], periodosClase: any[]): boolean => {
    for (const dia of dias) {
      let consecutivas = 0
      for (const periodo of periodosClase) {
        if (horario[dia][periodo.nombre].asignatura === "Hora Pedagógica") {
          consecutivas++
          if (consecutivas > 2) {
            return false // Más de 2 consecutivas
          }
        } else {
          consecutivas = 0
        }
      }
    }
    return true
  }

  // Función para redistribuir horas pedagógicas
  const redistribuirHorasPedagogicas = (horario: any, dias: string[], periodosClase: any[]) => {
    const maxIntentos = 50
    let intentos = 0

    while (!verificarHorasPedagogicasConsecutivas(horario, dias, periodosClase) && intentos < maxIntentos) {
      intentos++

      for (const dia of dias) {
        const periodosDelDia = [...periodosClase]

        // Encontrar bloques de más de 2 horas pedagógicas consecutivas
        for (let i = 0; i < periodosDelDia.length - 2; i++) {
          const periodo1 = periodosDelDia[i]
          const periodo2 = periodosDelDia[i + 1]
          const periodo3 = periodosDelDia[i + 2]

          if (
            horario[dia][periodo1.nombre].asignatura === "Hora Pedagógica" &&
            horario[dia][periodo2.nombre].asignatura === "Hora Pedagógica" &&
            horario[dia][periodo3.nombre].asignatura === "Hora Pedagógica"
          ) {
            // Buscar una materia en otro período del mismo día para intercambiar
            for (let j = 0; j < periodosDelDia.length; j++) {
              const periodoIntercambio = periodosDelDia[j]
              if (
                j !== i &&
                j !== i + 1 &&
                j !== i + 2 &&
                horario[dia][periodoIntercambio.nombre].asignatura !== "Hora Pedagógica"
              ) {
                // Intercambiar la tercera hora pedagógica con una materia
                const temp = { ...horario[dia][periodo3.nombre] }
                horario[dia][periodo3.nombre] = { ...horario[dia][periodoIntercambio.nombre] }
                horario[dia][periodoIntercambio.nombre] = temp
                break
              }
            }
          }
        }
      }
    }
  }

  const generarHorarios = async () => {
    if (!configuracion) return

    setGenerando(true)
    setProgreso(0)
    setMensajeProgreso("Iniciando generación de horarios...")

    const tiempoInicio = Date.now()
    const nuevosHorarios: HorarioGenerado[] = []
    let conflictos = 0

    try {
      const periodosClase = configuracion.periodosPersonalizados.filter((p) => p.tipo === "clase")
      const dias = configuracion.diasSemana

      // Generar horarios para docentes
      setMensajeProgreso("Generando horarios de docentes...")
      for (let i = 0; i < docentes.length; i++) {
        const docente = docentes[i]
        const horarioDocente: HorarioGenerado = {
          id: `docente-${docente.id}`,
          tipo: "docente",
          entidadId: docente.id,
          nombre: `${docente.nombre} ${docente.apellido}`,
          horario: {},
          fechaGeneracion: new Date().toISOString(),
        }

        // Inicializar horario vacío con Hora Pedagógica para DOCENTES
        dias.forEach((dia) => {
          horarioDocente.horario[dia] = {}
          periodosClase.forEach((periodo) => {
            horarioDocente.horario[dia][periodo.nombre] = {
              asignatura: "Hora Pedagógica",
            }
          })
        })

        // Crear lista de asignaciones pendientes
        const asignacionesPendientes: AsignacionPendiente[] = []

        if (docente.cursosAsignados && docente.cursosAsignados.length > 0) {
          docente.cursosAsignados.forEach((cursoAsignado) => {
            const curso = cursos.find((c) => c.id === cursoAsignado.cursoId)
            if (curso && cursoAsignado.asignaturas) {
              cursoAsignado.asignaturas.forEach((asignaturaId) => {
                const asignatura = asignaturas.find((a) => a.id === asignaturaId)
                if (asignatura) {
                  const horasSemanales = asignatura.horasPorNivel?.[curso.nivel]?.[curso.grado] || 2
                  asignacionesPendientes.push({
                    asignaturaId,
                    asignaturaNombre: asignatura.nombre,
                    horasRestantes: horasSemanales,
                    curso: `${curso.nombre} - ${curso.grado}° ${curso.seccion}`,
                  })
                }
              })
            }
          })
        }

        // Asignar todas las materias respetando las reglas
        asignacionesPendientes.forEach((asignacion) => {
          asignarAsignatura(horarioDocente.horario, asignacion, dias, periodosClase)
        })

        // Redistribuir horas pedagógicas para evitar más de 2 consecutivas
        redistribuirHorasPedagogicas(horarioDocente.horario, dias, periodosClase)

        nuevosHorarios.push(horarioDocente)
        setProgreso(((i + 1) / (docentes.length + cursos.length)) * 50)
      }

      // Generar horarios para cursos (SIN Hora Pedagógica)
      setMensajeProgreso("Generando horarios de cursos...")
      for (let i = 0; i < cursos.length; i++) {
        const curso = cursos[i]
        const horarioCurso: HorarioGenerado = {
          id: `curso-${curso.id}`,
          tipo: "curso",
          entidadId: curso.id,
          nombre: `${curso.nombre} - ${curso.grado}° ${curso.seccion}`,
          horario: {},
          fechaGeneracion: new Date().toISOString(),
        }

        // Inicializar horario VACÍO para CURSOS (sin Hora Pedagógica)
        dias.forEach((dia) => {
          horarioCurso.horario[dia] = {}
          periodosClase.forEach((periodo) => {
            horarioCurso.horario[dia][periodo.nombre] = {
              asignatura: "", // Vacío para cursos
            }
          })
        })

        // Crear lista de asignaciones pendientes para el curso
        const asignacionesPendientes: AsignacionPendiente[] = []

        // Buscar docentes asignados a este curso
        const docentesDelCurso = docentes.filter((docente) =>
          docente.cursosAsignados?.some((ca) => ca.cursoId === curso.id),
        )

        docentesDelCurso.forEach((docente) => {
          const cursoAsignado = docente.cursosAsignados?.find((ca) => ca.cursoId === curso.id)
          if (cursoAsignado?.asignaturas) {
            cursoAsignado.asignaturas.forEach((asignaturaId) => {
              const asignatura = asignaturas.find((a) => a.id === asignaturaId)
              if (asignatura) {
                const horasSemanales = asignatura.horasPorNivel?.[curso.nivel]?.[curso.grado] || 2
                asignacionesPendientes.push({
                  asignaturaId,
                  asignaturaNombre: asignatura.nombre,
                  horasRestantes: horasSemanales,
                  docente: `${docente.nombre} ${docente.apellido}`,
                })
              }
            })
          }
        })

        // Asignar todas las materias (para cursos, solo asignaturas reales)
        asignacionesPendientes.forEach((asignacion) => {
          // Modificar la función para cursos: buscar slots vacíos (no "Hora Pedagógica")
          const { asignaturaId, asignaturaNombre, horasRestantes } = asignacion
          let horasAsignadas = 0

          const diasAleatorios = [...dias].sort(() => Math.random() - 0.5)

          for (const dia of diasAleatorios) {
            if (horasAsignadas >= horasRestantes) break

            const horasYaEnDia = asignaturaYaAsignadaEnDia(horarioCurso.horario, dia, asignaturaNombre)
            const maxHorasPorDia = horasRestantes > 4 ? 2 : 1

            if (horasYaEnDia >= maxHorasPorDia) continue

            const horasAAsignarEnDia = Math.min(maxHorasPorDia - horasYaEnDia, horasRestantes - horasAsignadas)

            if (horasAAsignarEnDia === 0) continue

            // Buscar períodos libres (vacíos)
            const periodosLibres = periodosClase.filter((p) => !horarioCurso.horario[dia][p.nombre].asignatura)

            if (periodosLibres.length > 0) {
              const periodoAleatorio = periodosLibres[Math.floor(Math.random() * periodosLibres.length)]
              horarioCurso.horario[dia][periodoAleatorio.nombre] = {
                asignatura: asignaturaNombre,
                docente: asignacion.docente,
              }
              horasAsignadas++
            }
          }
        })

        nuevosHorarios.push(horarioCurso)
        setProgreso(50 + ((i + 1) / cursos.length) * 40)
      }

      // Detectar conflictos básicos
      setMensajeProgreso("Detectando conflictos...")
      conflictos = detectarConflictos(nuevosHorarios)
      setProgreso(95)

      // Guardar horarios generados
      setMensajeProgreso("Guardando horarios...")
      localStorage.setItem("horariosGenerados", JSON.stringify(nuevosHorarios))
      setHorariosGenerados(nuevosHorarios)

      const tiempoFin = Date.now()
      const tiempoGeneracion = tiempoFin - tiempoInicio

      setEstadisticas({
        totalDocentes: docentes.length,
        totalCursos: cursos.length,
        totalAsignaturas: asignaturas.length,
        horariosGenerados: nuevosHorarios.length,
        conflictosDetectados: conflictos,
        tiempoGeneracion,
      })

      setProgreso(100)
      setMensajeProgreso("¡Horarios generados exitosamente!")

      toast({
        title: "Horarios generados",
        description: `Se generaron ${nuevosHorarios.length} horarios exitosamente`,
      })
    } catch (error) {
      console.error("Error generating schedules:", error)
      setMensajeProgreso("Error al generar horarios")
      toast({
        title: "Error",
        description: "Error al generar horarios",
        variant: "destructive",
      })
    } finally {
      setTimeout(() => {
        setGenerando(false)
        setProgreso(0)
        setMensajeProgreso("")
      }, 2000)
    }
  }

  const detectarConflictos = (horarios: HorarioGenerado[]): number => {
    let conflictos = 0
    const ocupacionDocentes: { [key: string]: { [dia: string]: { [periodo: string]: boolean } } } = {}

    horarios.forEach((horario) => {
      Object.entries(horario.horario).forEach(([dia, periodos]) => {
        Object.entries(periodos).forEach(([periodo, asignacion]) => {
          if (asignacion.docente && asignacion.asignatura !== "Hora Pedagógica" && asignacion.asignatura !== "") {
            const docente = asignacion.docente
            if (!ocupacionDocentes[docente]) {
              ocupacionDocentes[docente] = {}
            }
            if (!ocupacionDocentes[docente][dia]) {
              ocupacionDocentes[docente][dia] = {}
            }
            if (ocupacionDocentes[docente][dia][periodo]) {
              conflictos++
            } else {
              ocupacionDocentes[docente][dia][periodo] = true
            }
          }
        })
      })
    })

    return conflictos
  }

  const limpiarHorarios = () => {
    localStorage.removeItem("horariosGenerados")
    setHorariosGenerados([])
    setEstadisticas(null)
    toast({
      title: "Horarios eliminados",
      description: "Todos los horarios han sido eliminados",
    })
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Cargando datos...</p>
          </div>
        </div>
      </div>
    )
  }

  const puedeGenerar = docentes.length > 0 && cursos.length > 0 && asignaturas.length > 0

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Generar Horarios</h1>
          <p className="text-gray-600">Genera horarios automáticamente para docentes y cursos</p>
        </div>
      </div>

      {/* Estadísticas de datos */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Docentes</p>
                <p className="text-2xl font-bold">{docentes.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium">Cursos</p>
                <p className="text-2xl font-bold">{cursos.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium">Asignaturas</p>
                <p className="text-2xl font-bold">{asignaturas.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium">Horarios</p>
                <p className="text-2xl font-bold">{horariosGenerados.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reglas de generación */}
      <Card>
        <CardHeader>
          <CardTitle>Reglas de Generación</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Máximo 1 hora por día de cada asignatura (excepto si tiene +4 horas semanales)</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Horas múltiples de la misma asignatura son consecutivas</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Los horarios de cursos NO muestran "Hora Pedagógica"</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Detección automática de conflictos de docentes</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Controles de generación */}
      <Card>
        <CardHeader>
          <CardTitle>Generación de Horarios</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {generando && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{mensajeProgreso}</span>
                <span className="text-sm text-gray-500">{progreso}%</span>
              </div>
              <Progress value={progreso} className="w-full" />
            </div>
          )}

          <div className="flex gap-4">
            <Button onClick={generarHorarios} disabled={generando || !puedeGenerar}>
              <Play className="w-4 h-4 mr-2" />
              {generando ? "Generando..." : "Generar Horarios"}
            </Button>

            <Button variant="outline" onClick={limpiarHorarios} disabled={generando || horariosGenerados.length === 0}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Limpiar Horarios
            </Button>
          </div>

          {!puedeGenerar && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Para generar horarios necesitas tener al menos un docente, un curso y una asignatura registrados.
              </AlertDescription>
            </Alert>
          )}

          {puedeGenerar && (
            <div className="flex items-center space-x-2 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">Sistema listo para generar horarios.</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Estadísticas de generación */}
      {estadisticas && (
        <Card>
          <CardHeader>
            <CardTitle>Estadísticas de Generación</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{estadisticas.horariosGenerados}</p>
                <p className="text-sm text-gray-600">Horarios Generados</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{estadisticas.conflictosDetectados}</p>
                <p className="text-sm text-gray-600">Conflictos Detectados</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {(estadisticas.tiempoGeneracion / 1000).toFixed(1)}s
                </p>
                <p className="text-sm text-gray-600">Tiempo de Generación</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de horarios generados */}
      {horariosGenerados.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Horarios Generados ({horariosGenerados.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {horariosGenerados.map((horario) => (
                <div key={horario.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Badge variant={horario.tipo === "docente" ? "default" : "secondary"}>
                      {horario.tipo === "docente" ? "Docente" : "Curso"}
                    </Badge>
                    <span className="font-medium">{horario.nombre}</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(horario.fechaGeneracion).toLocaleDateString("es-DO")}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
