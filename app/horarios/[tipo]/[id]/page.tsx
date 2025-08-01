"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { database, type DocenteDB, type CursoDB, type ConfiguracionDB } from "@/lib/database"
import { HorarioTemplate } from "@/components/horario-template"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Download, Printer } from 'lucide-react'
import Link from "next/link"

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

export default function HorarioDetallePage() {
  const params = useParams()
  const { tipo, id } = params

  const [horario, setHorario] = useState<HorarioGenerado | null>(null)
  const [entidad, setEntidad] = useState<DocenteDB | CursoDB | null>(null)
  const [configuracion, setConfiguracion] = useState<{
    escuela?: ConfiguracionEscuela
    horario?: ConfiguracionHorario
  }>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)

        await database.init()

        const horariosGuardados = localStorage.getItem("horariosGenerados")
        if (!horariosGuardados) {
          setError("No hay horarios generados")
          return
        }

        const horarios: HorarioGenerado[] = JSON.parse(horariosGuardados)
        const horarioEncontrado = horarios.find((h) => h.tipo === tipo && h.entidadId === id)

        if (!horarioEncontrado) {
          setError("Horario no encontrado")
          return
        }

        setHorario(horarioEncontrado)

        const storeName = tipo === "docente" ? "docentes" : "cursos"
        const entidadData = await database.get<DocenteDB | CursoDB>(storeName, id as string)
        if (!entidadData) {
          setError(`${tipo === "docente" ? "Docente" : "Curso"} no encontrado`)
          return
        }
        setEntidad(entidadData)

        const [escuelaConfig, horarioConfig] = await Promise.all([
          database.get<ConfiguracionDB>("configuracion", "escuela"),
          database.get<ConfiguracionDB>("configuracion", "horario"),
        ])

        setConfiguracion({
          escuela: escuelaConfig?.data,
          horario: horarioConfig?.data,
        })
      } catch (error) {
        console.error("Error loading data:", error)
        setError("Error al cargar los datos")
      } finally {
        setLoading(false)
      }
    }

    if (tipo && id) {
      loadData()
    }
  }, [tipo, id])

  const generarHTMLHorario = (
    horarioData: HorarioGenerado,
    entidadData: DocenteDB | CursoDB,
    tipoHorario: "docente" | "curso",
    escuelaConfig?: ConfiguracionEscuela,
    horarioConfig?: ConfiguracionHorario,
  ) => {
    const periodos = horarioConfig?.periodosPersonalizados || [
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

    const dias = horarioConfig?.diasSemana || ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"]

    const nombreCompleto =
      tipoHorario === "docente"
        ? `${(entidadData as DocenteDB).nombre} ${(entidadData as DocenteDB).apellido}`
        : `${(entidadData as CursoDB).nombre} - ${(entidadData as CursoDB).grado}° ${(entidadData as CursoDB).seccion}`

    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Horario - ${nombreCompleto}</title>
    <style>
        @page {
            size: letter landscape;
            margin: 0.5in;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: Arial, sans-serif;
            font-size: 12px;
            line-height: 1.2;
            color: #000;
            background: white;
        }
        
        .header {
            text-align: center;
            margin-bottom: 30px;
            page-break-inside: avoid;
        }
        
        .logo-escuela {
            width: 300px !important;
            height: auto !important;
            object-fit: contain;
            margin: 0 auto 20px auto;
            display: block;
            max-width: 300px;
        }
        
        .nombre-entidad {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 20px;
            color: #000;
        }
        
        .horario-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
            page-break-inside: avoid;
        }
        
        .horario-table th,
        .horario-table td {
            border: 1px solid #000;
            padding: 8px 4px;
            text-align: center;
            vertical-align: middle;
            font-size: 11px;
        }
        
        .horario-table th {
            background-color: #f0f0f0;
            font-weight: bold;
        }
        
        .periodo-header {
            background-color: #e6e6e6 !important;
            font-weight: bold;
            width: 12%;
        }
        
        .horario-header {
            background-color: #e6e6e6 !important;
            font-weight: bold;
            width: 10%;
        }
        
        .dia-header {
            background-color: #d9d9d9 !important;
            font-weight: bold;
            width: 15.6%;
        }
        
        .recreo-cell {
            background-color: #fff2cc !important;
            font-weight: bold;
        }
        
        .almuerzo-cell {
            background-color: #fff2cc !important;
            font-weight: bold;
        }
        
        .asignatura-cell {
            font-size: 10px;
            line-height: 1.1;
            font-weight: bold;
        }
        
        .hora-pedagogica {
            font-style: italic;
            color: #666;
            font-size: 9px;
        }
        
        .footer {
            text-align: center;
            font-size: 10px;
            color: #666;
            margin-top: 15px;
            page-break-inside: avoid;
        }
        
        @media print {
            body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            
            .no-print {
                display: none !important;
            }
            
            .logo-escuela {
                width: 300px !important;
                height: auto !important;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-DLkvxN0JCPRdUjCRHU4yEu9M8ZCuka.png" alt="Logo Ministerio" class="logo-escuela" />
    </div>
    
    <table class="horario-table">
        <thead>
            <tr>
                <th class="periodo-header">Período</th>
                <th class="horario-header">Horario</th>
                ${dias.map((dia) => `<th class="dia-header">${dia}</th>`).join("")}
            </tr>
        </thead>
        <tbody>
            ${periodos
              .map((periodo) => {
                const esPeriodoEspecial = periodo.tipo === "recreo" || periodo.tipo === "almuerzo"
                const cellClass =
                  periodo.tipo === "recreo"
                    ? "recreo-cell"
                    : periodo.tipo === "almuerzo"
                      ? "almuerzo-cell"
                      : "asignatura-cell"

                return `
                <tr>
                    <td class="periodo-header">${periodo.nombre}</td>
                    <td class="horario-header">${periodo.inicio} - ${periodo.fin}</td>
                    ${dias
                      .map((dia) => {
                        if (esPeriodoEspecial) {
                          return `<td class="${cellClass}">${periodo.nombre}</td>`
                        }

                        const asignacion = horarioData.horario[dia]?.[periodo.nombre]
                        if (asignacion && asignacion.asignatura && asignacion.asignatura !== "Hora Pedagógica") {
                          return `<td class="${cellClass}">${asignacion.asignatura}</td>`
                        }

                        return `<td class="hora-pedagogica">Hora Pedagógica</td>`
                      })
                      .join("")}
                </tr>`
              })
              .join("")}
        </tbody>
    </table>
    
    <div class="footer">
        <p>Generado automáticamente por el Sistema de Horarios Docentes</p>
        <p>Fecha de generación: ${new Date().toLocaleDateString("es-DO")}</p>
    </div>
</body>
</html>`
  }

  const handlePrint = () => {
    if (!horario || !entidad) return

    const htmlContent = generarHTMLHorario(
      horario,
      entidad,
      tipo as "docente" | "curso",
      configuracion.escuela,
      configuracion.horario,
    )

    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(htmlContent)
      printWindow.document.close()
      printWindow.focus()

      setTimeout(() => {
        printWindow.print()
        printWindow.close()
      }, 500)
    }
  }

  const handleDownload = () => {
    if (!horario || !entidad) return

    const htmlContent = generarHTMLHorario(
      horario,
      entidad,
      tipo as "docente" | "curso",
      configuracion.escuela,
      configuracion.horario,
    )

    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(htmlContent)
      printWindow.document.close()
      printWindow.focus()

      setTimeout(() => {
        printWindow.print()
      }, 500)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Cargando horario...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              <p className="text-lg font-semibold mb-2">Error</p>
              <p>{error}</p>
              <Link href="/horarios" className="inline-block mt-4">
                <Button variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver a Horarios
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!horario || !entidad) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-lg font-semibold mb-2">Horario no encontrado</p>
              <p>No se pudo cargar el horario solicitado.</p>
              <Link href="/horarios" className="inline-block mt-4">
                <Button variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver a Horarios
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const nombreCompleto =
    tipo === "docente"
      ? `${(entidad as DocenteDB).nombre} ${(entidad as DocenteDB).apellido}`
      : `${(entidad as CursoDB).nombre} - ${(entidad as CursoDB).grado}° ${(entidad as CursoDB).seccion}`

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/horarios">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Horario de {tipo === "docente" ? "Docente" : "Curso"}</h1>
            <p className="text-gray-600">{nombreCompleto}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={handlePrint} variant="outline">
            <Printer className="w-4 h-4 mr-2" />
            Imprimir
          </Button>
          <Button onClick={handleDownload}>
            <Download className="w-4 h-4 mr-2" />
            Descargar PDF
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="text-center no-print">
          <img
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-DLkvxN0JCPRdUjCRHU4yEu9M8ZCuka.png"
            alt="Logo Ministerio"
            className="mx-auto mb-4 object-contain block"
            style={{ width: "300px", height: "auto" }}
          />
          <CardTitle className="text-xl">{nombreCompleto}</CardTitle>
        </CardHeader>
        <CardContent>
          <HorarioTemplate
            horario={horario}
            entidad={entidad}
            tipo={tipo as "docente" | "curso"}
            configuracion={configuracion}
          />
        </CardContent>
      </Card>
    </div>
  )
}