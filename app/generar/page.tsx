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

// ... (El resto del archivo se mantiene igual hasta la función 'generarHorarios')

  const generarHorarios = async () => {
    if (!configuracion) {
      toast({ title: "Error", description: "La configuración de horarios no está cargada.", variant: "destructive" })
      return
    }

    setGenerando(true)
    setProgreso(0)
    setMensajeProgreso("Iniciando generación de horarios...")

    const tiempoInicio = Date.now()
    const nuevosHorarios: HorarioGenerado[] = []
    let conflictos = 0

    try {
      const periodosClase = configuracion.periodosPersonalizados.filter((p) => p.tipo === "clase")
      const dias = configuracion.diasSemana

      for (let i = 0; i < docentes.length; i++) {
        const docente = docentes[i]
        setMensajeProgreso(`Generando horario para ${docente.nombre} ${docente.apellido}...`)
        const horarioDocente: any = {
          id: `docente-${docente.id}`,
          tipo: "docente",
          entidadId: docente.id,
          nombre: `${docente.nombre} ${docente.apellido}`,
          horario: {},
          fechaGeneracion: new Date().toISOString(),
        }

        // 1. Inicializar horario base con "H. P"
        dias.forEach((dia) => {
          horarioDocente.horario[dia] = {}
          periodosClase.forEach((periodo) => {
            horarioDocente.horario[dia][periodo.nombre] = { asignatura: "H. P" }
          })
        })

        // 2. Aplicar restricciones específicas
        docente.restricciones?.forEach((r) => {
          if (horarioDocente.horario[r.dia] && horarioDocente.horario[r.dia][r.periodo]) {
            horarioDocente.horario[r.dia][r.periodo] = { asignatura: r.actividad }
          }
        })

        // 3. Crear lista de asignaciones pendientes
        const asignacionesPendientes: AsignacionPendiente[] = []
        docente.cursosAsignados?.forEach((cursoAsignado) => {
          const curso = cursos.find((c) => c.id === cursoAsignado.cursoId)
          if (curso) {
            cursoAsignado.asignaturas.forEach((asignaturaId) => {
              const asignatura = asignaturas.find((a) => a.id === asignaturaId)
              if (asignatura) {
                const horasSemanales = asignatura.horasPorNivel?.[curso.nivel]?.[curso.grado] || 0
                for (let h = 0; h < horasSemanales; h++) {
                  asignacionesPendientes.push({
                    asignaturaId,
                    asignaturaNombre: asignatura.nombre,
                    curso: `${curso.grado}° ${curso.seccion}`,
                    docente: `${docente.nombre} ${docente.apellido}`,
                  })
                }
              }
            })
          }
        })
        
        // 4. Barajar las asignaciones para distribuirlas aleatoriamente
        asignacionesPendientes.sort(() => Math.random() - 0.5)

        // 5. Colocar cada hora de asignatura en un slot aleatorio
        asignacionesPendientes.forEach((asignacion) => {
            const diasAleatorios = [...dias].sort(() => Math.random() - 0.5);
            let asignado = false;
            for (const dia of diasAleatorios) {
                const periodosLibres = periodosClase
                    .filter(p => horarioDocente.horario[dia][p.nombre].asignatura === "H. P")
                    .sort(() => Math.random() - 0.5);
                
                if (periodosLibres.length > 0) {
                    const periodoSeleccionado = periodosLibres[0];
                    horarioDocente.horario[dia][periodoSeleccionado.nombre] = {
                        asignatura: asignacion.asignaturaNombre,
                        curso: asignacion.curso,
                    };
                    asignado = true;
                    break; 
                }
            }
        });
        
        nuevosHorarios.push(horarioDocente)
        setProgreso(((i + 1) / (docentes.length + cursos.length)) * 100)
      }

      // ... (El resto de la función se mantiene igual)

    } catch (error) {
        //...
    } finally {
        //...
    }
  }

// ... (El resto del archivo se mantiene igual)