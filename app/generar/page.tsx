// ... (El inicio del archivo se mantiene igual)

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
      for (const docente of docentes) {
        const horarioDocente: HorarioGenerado = {
          id: `docente-${docente.id}`,
          tipo: "docente",
          entidadId: docente.id,
          nombre: `${docente.nombre} ${docente.apellido}`,
          horario: {},
          fechaGeneracion: new Date().toISOString(),
        }

        // 1. Inicializar horario base con "H. P" (Hora Pedagógica)
        dias.forEach((dia) => {
          horarioDocente.horario[dia] = {}
          periodosClase.forEach((periodo) => {
            horarioDocente.horario[dia][periodo.nombre] = { asignatura: "H. P" }
          })
        })

        // 2. Aplicar restricciones específicas del docente
        if (docente.restricciones) {
          docente.restricciones.forEach((r) => {
            if (horarioDocente.horario[r.dia] && horarioDocente.horario[r.dia][r.periodo]) {
              horarioDocente.horario[r.dia][r.periodo] = { asignatura: r.actividad }
            }
          })
        }

        // 3. Crear lista de asignaciones pendientes
        const asignacionesPendientes: AsignacionPendiente[] = []
        if (docente.cursosAsignados) {
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
                    curso: `${curso.nombre}`,
                  })
                }
              })
            }
          })
        }

        // 4. Asignar materias en los slots que aún son "H. P"
        asignacionesPendientes.forEach((asignacion) => {
          // La función 'asignarAsignatura' debe ser modificada para buscar solo slots con "H. P"
          asignarAsignatura(horarioDocente.horario, asignacion, dias, periodosClase)
        })

        nuevosHorarios.push(horarioDocente)
      }
      
      // ... (El resto de la lógica de generación y guardado se mantiene igual)

    } catch (error) {
      console.error("Error generating schedules:", error)
      // ...
    } finally {
      setGenerando(false)
    }
}

// Asegúrate de que la función `asignarAsignatura` busque "H. P" en lugar de "Hora Pedagógica"
// y que la función `encontrarPeriodosConsecutivos` haga lo mismo.
// ...