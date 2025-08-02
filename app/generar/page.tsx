"use client"

import { useState, useEffect } from "react"
import { database, type DocenteDB, type CursoDB, type AsignaturaDB, type ConfiguracionDB } from "@/lib/database"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Calendar, Clock, Users, BookOpen, AlertTriangle, CheckCircle, Play, RotateCcw } from "lucide-react"
import { toast } from "@/hooks/use-toast"

// ... (Las interfaces y el estado inicial se mantienen igual)

export default function GenerarPage() {
  // ... (El estado y useEffect se mantienen igual)

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

    // 1. Generar horarios para cada docente
    for (const docente of docentes) {
      const horarioDocente = {
        id: `docente-${docente.id}`,
        tipo: "docente",
        entidadId: docente.id,
        nombre: `${docente.nombre} ${docente.apellido}`,
        horario: {},
        fechaGeneracion: new Date().toISOString(),
      }

      dias.forEach(dia => {
        horarioDocente.horario[dia] = {}
        periodosClase.forEach(periodo => {
          horarioDocente.horario[dia][periodo.nombre] = { asignatura: "H. P" }
        })
      })

      docente.restricciones?.forEach(r => {
        if (horarioDocente.horario[r.dia]?.[r.periodo]) {
          horarioDocente.horario[r.dia][r.periodo] = { asignatura: r.actividad }
        }
      })

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
                  docente: `${docente.nombre} ${docente.apellido}`
                })
              }
            }
          })
        }
      })
      
      asignacionesParaColocar.sort(() => Math.random() - 0.5)

      let slotsDisponibles = []
      dias.forEach(dia => {
          periodosClase.forEach(periodo => {
              if (horarioDocente.horario[dia][periodo.nombre].asignatura === "H. P") {
                  slotsDisponibles.push({ dia, periodo: periodo.nombre })
              }
          })
      })
      
      slotsDisponibles.sort(() => Math.random() - 0.5)

      asignacionesParaColocar.forEach(asignacion => {
          if (slotsDisponibles.length > 0) {
              const slot = slotsDisponibles.pop()
              horarioDocente.horario[slot.dia][slot.periodo] = {
                  asignatura: asignacion.asignatura,
                  curso: asignacion.curso,
              }
          }
      })
      
      todosLosHorarios.push(horarioDocente)
    }

    // 2. Generar horarios para cursos a partir de los horarios de docentes
    for (const curso of cursos) {
        const horarioCurso = {
            id: `curso-${curso.id}`,
            tipo: "curso",
            entidadId: curso.id,
            nombre: curso.nombre,
            horario: {},
            fechaGeneracion: new Date().toISOString(),
        };

        dias.forEach(dia => {
            horarioCurso.horario[dia] = {};
            periodosClase.forEach(periodo => {
                horarioCurso.horario[dia][periodo.nombre] = { asignatura: "" }; // Vacío por defecto
            });
        });

        // Llenar con la información de los horarios de los docentes
        todosLosHorarios
            .filter(h => h.tipo === 'docente')
            .forEach(hDocente => {
                dias.forEach(dia => {
                    periodosClase.forEach(periodo => {
                        const asignacionDocente = hDocente.horario[dia][periodo.nombre];
                        if (asignacionDocente.curso === curso.nombre) {
                            horarioCurso.horario[dia][periodo.nombre] = {
                                asignatura: asignacionDocente.asignatura,
                                docente: hDocente.nombre,
                            };
                        }
                    });
                });
            });
        todosLosHorarios.push(horarioCurso);
    }

    localStorage.setItem("horariosGenerados", JSON.stringify(todosLosHorarios))
    toast({ title: "¡Éxito!", description: `Se generaron ${todosLosHorarios.length} horarios.` })
    setGenerando(false)
  }

  return (
    // ... El resto del JSX de la página de generar se mantiene igual
  )
}