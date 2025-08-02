"use client"

import { useState, useEffect } from "react"
import { database, type DocenteDB, type CursoDB, type AsignaturaDB, type ConfiguracionDB } from "@/lib/database"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Calendar, Clock, Users, BookOpen, AlertTriangle, CheckCircle, Play, RotateCcw } from "lucide-react"
import { toast } from "@/hooks/use-toast"

export default function GenerarPage() {
    const [docentes, setDocentes] = useState<DocenteDB[]>([])
    const [cursos, setCursos] = useState<CursoDB[]>([])
    const [asignaturas, setAsignaturas] = useState<AsignaturaDB[]>([])
    const [configuracion, setConfiguracion] = useState<any>(null)
    const [generando, setGenerando] = useState(false)
    const [progreso, setProgreso] = useState(0)

    useEffect(() => {
        const loadData = async () => {
            await database.init()
            setDocentes(await database.getAll("docentes"))
            setCursos(await database.getAll("cursos"))
            setAsignaturas(await database.getAll("asignaturas"))
            const config = await database.get("configuracion", "horario")
            setConfiguracion(config?.data)
        }
        loadData()
    }, [])

    const generarHorarios = async () => {
        if (!configuracion) {
            toast({ title: "Error", description: "Configuración no cargada.", variant: "destructive" })
            return
        }
    
        setGenerando(true)
        setProgreso(0)
    
        const todosLosHorarios: any[] = []
        const periodosClase = configuracion.periodosPersonalizados.filter(p => p.tipo === "clase")
        const dias = configuracion.diasSemana
    
        for (const [index, docente] of docentes.entries()) {
            const horarioDocente = {
                id: `docente-${docente.id}`,
                tipo: "docente",
                entidadId: docente.id,
                nombre: `${docente.nombre} ${docente.apellido}`,
                horario: {},
                fechaGeneracion: new Date().toISOString(),
            }
    
            // Crear una lista plana de todos los slots disponibles
            let slotsDisponibles = []
            dias.forEach(dia => {
                periodosClase.forEach(periodo => {
                    slotsDisponibles.push({ dia, periodo: periodo.nombre })
                })
            })
    
            // Aplicar restricciones, eliminando slots
            docente.restricciones?.forEach(r => {
                slotsDisponibles = slotsDisponibles.filter(s => !(s.dia === r.dia && s.periodo === r.periodo))
            })
    
            // Crear una lista plana de todas las asignaturas a colocar (1 por hora)
            const asignacionesParaColocar: any[] = []
            docente.cursosAsignados?.forEach(ca => {
                const curso = cursos.find(c => c.id === ca.cursoId)
                if (curso) {
                    ca.asignaturas.forEach(asigId => {
                        const asignatura = asignaturas.find(a => a.id === asigId)
                        if (asignatura) {
                            const horas = asignatura.horasPorNivel[curso.nivel]?.[curso.grado] || 0
                            for (let i = 0; i < horas; i++) {
                                asignacionesParaColocar.push({
                                    asignatura: asignatura.nombre,
                                    curso: curso.nombre,
                                })
                            }
                        }
                    })
                }
            })
    
            // Barajar ambos arrays para máxima aleatoriedad
            slotsDisponibles.sort(() => Math.random() - 0.5)
            asignacionesParaColocar.sort(() => Math.random() - 0.5)
    
            // Llenar el horario
            dias.forEach(dia => {
                horarioDocente.horario[dia] = {}
                periodosClase.forEach(periodo => {
                    horarioDocente.horario[dia][periodo.nombre] = { asignatura: "H. P" } // Por defecto
                })
            })
            
            docente.restricciones?.forEach(r => {
              if (horarioDocente.horario[r.dia]?.[r.periodo]) {
                horarioDocente.horario[r.dia][r.periodo] = { asignatura: r.actividad }
              }
            });

            // Asignar
            let asignadasCount = 0;
            for (const asignacion of asignacionesParaColocar) {
                if (slotsDisponibles.length > 0) {
                    const slot = slotsDisponibles.pop()
                    if (slot) {
                       horarioDocente.horario[slot.dia][slot.periodo] = {
                           asignatura: asignacion.asignatura,
                           curso: asignacion.curso,
                       }
                       asignadasCount++;
                    }
                }
            }
    
            todosLosHorarios.push(horarioDocente)
            setProgreso(((index + 1) / docentes.length) * 50)
        }
    
        // Generar horarios de cursos
        for (const curso of cursos) {
            const horarioCurso = {
                id: `curso-${curso.id}`,
                tipo: "curso",
                entidadId: curso.id,
                nombre: curso.nombre,
                horario: {},
                fechaGeneracion: new Date().toISOString(),
            }
            dias.forEach(dia => {
                horarioCurso.horario[dia] = {}
                periodosClase.forEach(periodo => {
                    horarioCurso.horario[dia][periodo.nombre] = { asignatura: "" }
                })
            })
    
            todosLosHorarios.filter(h => h.tipo === 'docente').forEach(hDocente => {
                dias.forEach(dia => {
                    periodosClase.forEach(periodo => {
                        const asignacion = hDocente.horario[dia][periodo.nombre];
                        if (asignacion.curso === curso.nombre) {
                            horarioCurso.horario[dia][periodo.nombre] = {
                                asignatura: asignacion.asignatura,
                                docente: hDocente.nombre,
                            }
                        }
                    })
                })
            })
            todosLosHorarios.push(horarioCurso)
        }
    
        localStorage.setItem("horariosGenerados", JSON.stringify(todosLosHorarios))
        toast({ title: "¡Éxito!", description: `Se generaron ${todosLosHorarios.length} horarios.` })
        setGenerando(false)
        setProgreso(100)
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Generar Horarios</h1>
                <p className="text-gray-600">Genera horarios automáticamente para docentes y cursos</p>
              </div>
            </div>
            {/* ... Resto del JSX ... */}
            <Card>
                <CardHeader>
                    <CardTitle>Generación de Horarios</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {generando && (
                        <div className="space-y-2">
                            <Progress value={progreso} className="w-full" />
                        </div>
                    )}
                    <div className="flex gap-4">
                        <Button onClick={generarHorarios} disabled={generando}>
                            <Play className="w-4 h-4 mr-2" />
                            {generando ? "Generando..." : "Generar Horarios"}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}