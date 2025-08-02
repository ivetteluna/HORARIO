"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { database, type DocenteDB, type CursoDB, type ConfiguracionDB } from "@/lib/database"
import { HorarioTemplate } from "@/components/horario-template"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Download, Printer } from "lucide-react"
import Link from "next/link"

// ... (Interfaces se mantienen igual)

export default function HorarioDetallePage() {
  const params = useParams()
  const { tipo, id } = params

  const [horario, setHorario] = useState<HorarioGenerado | null>(null)
  const [entidad, setEntidad] = useState<DocenteDB | CursoDB | null>(null)
  const [configuracion, setConfiguracion] = useState<{
    escuela?: any
    horario?: any
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

        const horarios: any[] = JSON.parse(horariosGuardados)
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
      } catch (e) {
        console.error("Error loading data:", e)
        setError("Error al cargar los datos")
      } finally {
        setLoading(false)
      }
    }

    if (tipo && id) {
      loadData()
    }
  }, [tipo, id])

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    // ... loading state
  }

  if (error) {
    // ... error state
  }

  if (!horario || !entidad) {
    // ... no data state
  }

  const nombreCompleto =
    tipo === "docente"
      ? `${(entidad as DocenteDB).nombre} ${(entidad as DocenteDB).apellido}`
      : `${(entidad as CursoDB).nombre}`

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex items-center justify-between no-print">
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
        </div>
      </div>

      <Card className="print-full-width">
        <CardContent className="p-2 md:p-6">
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