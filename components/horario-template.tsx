"use client"

import type { DocenteDB, CursoDB } from "@/lib/database"

// ... (Interfaces se mantienen igual)

interface HorarioTemplateProps {
  horario: any
  entidad: DocenteDB | CursoDB
  tipo: "docente" | "curso"
  configuracion: {
    escuela?: any
    horario?: any
  }
}

export function HorarioTemplate({ horario, entidad, tipo, configuracion }: HorarioTemplateProps) {
  const periodos = configuracion.horario?.periodosPersonalizados || []
  const dias = configuracion.horario?.diasSemana || []

  const nombreCompleto =
    tipo === "docente"
      ? `${(entidad as DocenteDB).nombre} ${(entidad as DocenteDB).apellido}`
      : `${(entidad as CursoDB).nombre}`

  const asignaciones = horario.horario || {}

  return (
    <div className="w-full bg-white">
      <div className="text-center mb-6">
        {configuracion.escuela?.logo && (
          <img
            src={configuracion.escuela.logo}
            alt="Logo Institucional"
            className="mx-auto mb-4 object-contain block"
            style={{ width: "300px", height: "auto" }}
          />
        )}
        <div className="text-2xl font-bold mt-4">{nombreCompleto}</div>
      </div>

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
                esPeriodoEspecial
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
                        <td key={dia} className={`border border-gray-400 p-2 text-sm font-medium text-center ${bgColor}`}>
                          {periodo.nombre}
                        </td>
                      )
                    }

                    const asignacion = asignaciones[dia]?.[periodo.nombre]
                    const textoCelda = asignacion?.asignatura || "H. P"
                    const esHp = textoCelda === "H. P"

                    return (
                      <td key={dia} className={`border border-gray-400 p-2 text-xs text-center ${bgColor}`}>
                        <div className={esHp ? "italic text-gray-600" : "font-bold"}>{textoCelda}</div>
                        {asignacion?.curso && tipo === "docente" && !esHp && (
                          <div className="text-xs text-gray-600 mt-1">{asignacion.curso}</div>
                        )}
                        {asignacion?.docente && tipo === "curso" && !esHp && (
                          <div className="text-xs text-gray-600 mt-1">{asignacion.docente}</div>
                        )}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="text-center mt-6 text-xs text-gray-500 border-t pt-4">
        <p>Generado automáticamente por el Sistema de Horarios Docentes</p>
        <p>Fecha de generación: {new Date(horario.fechaGeneracion).toLocaleDateString("es-DO")}</p>
      </div>
    </div>
  )
}