"use client"

import type { DocenteDB, CursoDB } from "@/lib/database"

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

interface ConfiguracionEscuela {
  nombre: string
  direccion: string
  telefono: string
  email: string
  logo?: string
  distrito: string
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

interface HorarioTemplateProps {
  horario: HorarioGenerado
  entidad: DocenteDB | CursoDB
  tipo: "docente" | "curso"
  configuracion: {
    escuela?: ConfiguracionEscuela
    horario?: ConfiguracionHorario
  }
}

export function HorarioTemplate({ horario, entidad, tipo, configuracion }: HorarioTemplateProps) {
  const periodos = configuracion.horario?.periodosPersonalizados || [
    { nombre: "Primera Hora", inicio: "08:00", fin: "08:45", tipo: "clase" as const },
    { nombre: "Segunda Hora", inicio: "08:45", fin: "09:30", tipo: "clase" as const },
    { nombre: "Recreo", inicio: "09:30", fin: "09:45", tipo: "recreo" as const },
    { nombre: "Tercera Hora", inicio: "09:45", fin: "10:30", tipo: "clase" as const },
    { nombre: "Cuarta Hora", inicio: "10:30", fin: "11:15", tipo: "clase" as const },
    { nombre: "Quinta Hora", inicio: "11:15", fin: "12:00", tipo: "clase" as const },
    { nombre: "Almuerzo", inicio: "12:00", fin: "13:00", tipo: "almuerzo" as const },
    { nombre: "Sexta Hora", inicio: "13:00", fin: "13:45", tipo: "clase" as const },
    { nombre: "Séptima Hora", inicio: "13:45", fin: "14:30", tipo: "clase" as const },
    { nombre: "Octava Hora", inicio: "14:30", fin: "15:15", tipo: "clase" as const },
  ]

  const dias = configuracion.horario?.diasSemana || ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"]

  const nombreCompleto =
    tipo === "docente"
      ? `${(entidad as DocenteDB).nombre} ${(entidad as DocenteDB).apellido}`
      : `${(entidad as CursoDB).nombre} - ${(entidad as CursoDB).grado}° ${(entidad as CursoDB).seccion}`

  const asignaciones = horario.horario || {}

  return (
    <div className="w-full bg-white">
      {/* Encabezado - SOLO LOGO */}
      <div className="text-center mb-6">
        <img
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-DLkvxN0JCPRdUjCRHU4yEu9M8ZCuka.png"
          alt="Logo Institucional"
          className="mx-auto mb-4 object-contain block"
          style={{ width: "300px", height: "auto" }}
        />
      </div>

      {/* Tabla de horario */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-400">
          <thead>
            <tr>
              <th className="border border-gray-400 bg-gray-200 p-2 text-sm font-bold">Período</th>
              <th className="border border-gray-400 bg-gray-200 p-2 text-sm font-bold">Horario</th>
              {dias.map((dia) => (
                <th key={dia} className="border border-gray-400 bg-gray-100 p-2 text-sm font-bold">
                  {dia}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {periodos.map((periodo, index) => {
              const esPeriodoEspecial = periodo.tipo === "recreo" || periodo.tipo === "almuerzo"
              const bgColor =
                periodo.tipo === "recreo" || periodo.tipo === "almuerzo"
                  ? "bg-yellow-100"
                  : index % 2 === 0
                    ? "bg-white"
                    : "bg-gray-50"

              return (
                <tr key={periodo.nombre}>
                  <td className={`border border-gray-400 p-2 text-sm font-medium ${bgColor}`}>{periodo.nombre}</td>
                  <td className={`border border-gray-400 p-2 text-sm text-blue-600 ${bgColor}`}>
                    {periodo.inicio} - {periodo.fin}
                  </td>
                  {dias.map((dia) => {
                    if (esPeriodoEspecial) {
                      return (
                        <td
                          key={dia}
                          className={`border border-gray-400 p-2 text-sm font-medium text-center ${bgColor}`}
                        >
                          {periodo.nombre}
                        </td>
                      )
                    }

                    const asignacion = asignaciones[dia]?.[periodo.nombre]

                    // Para horarios de CURSO: NO mostrar "Hora Pedagógica"
                    if (tipo === "curso" && (!asignacion || asignacion.asignatura === "Hora Pedagógica")) {
                      return (
                        <td key={dia} className={`border border-gray-400 p-2 text-xs text-center ${bgColor}`}>
                          {/* Celda vacía para cursos sin asignatura */}
                        </td>
                      )
                    }

                    // Para horarios de DOCENTE: mostrar "Hora Pedagógica" si no hay asignatura
                    if (tipo === "docente" && (!asignacion || asignacion.asignatura === "Hora Pedagógica")) {
                      return (
                        <td key={dia} className={`border border-gray-400 p-2 text-xs text-center ${bgColor}`}>
                          <div className="italic text-gray-600">Hora Pedagógica</div>
                        </td>
                      )
                    }

                    // Mostrar asignatura real
                    if (asignacion && asignacion.asignatura && asignacion.asignatura !== "Hora Pedagógica") {
                      return (
                        <td key={dia} className={`border border-gray-400 p-2 text-xs text-center ${bgColor}`}>
                          <div className="font-bold">{asignacion.asignatura}</div>
                          {asignacion.docente && tipo === "curso" && (
                            <div className="text-xs text-gray-600 mt-1">{asignacion.docente}</div>
                          )}
                          {asignacion.curso && tipo === "docente" && (
                            <div className="text-xs text-gray-600 mt-1">{asignacion.curso}</div>
                          )}
                        </td>
                      )
                    }

                    // Fallback: celda vacía
                    return <td key={dia} className={`border border-gray-400 p-2 text-xs text-center ${bgColor}`}></td>
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="text-center mt-6 text-xs text-gray-500 border-t pt-4">
        <p>Generado automáticamente por el Sistema de Horarios Docentes</p>
        <p>Fecha de generación: {new Date(horario.fechaGeneracion).toLocaleDateString("es-DO")}</p>
      </div>
    </div>
  )
}