"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { database, type DocenteDB, type CursoDB, type ConfiguracionDB } from "@/lib/database"
import { HorarioTemplate } from "@/components/horario-template"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Printer } from "lucide-react"
import Link from "next/link"

export default function HorarioDetallePage() {
  const params = useParams()
  const { tipo, id } = params as { tipo: string; id: string }

  const [horario, setHorario] = useState<any | null>(null)
  const [entidad, setEntidad] = useState<DocenteDB | CursoDB | null>(null)
  const [configuracion, setConfiguracion] = useState<{ escuela?: any; horario?: any }>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await database.init();
      const horariosGuardados = localStorage.getItem("horariosGenerados");
      if (horariosGuardados) {
        const horarios = JSON.parse(horariosGuardados);
        setHorario(horarios.find((h) => h.tipo === tipo && h.entidadId === id));
      }
      const storeName = tipo === "docente" ? "docentes" : "cursos";
      setEntidad(await database.get<DocenteDB | CursoDB>(storeName, id));

      const [escuelaConfig, horarioConfig] = await Promise.all([
        database.get<ConfiguracionDB>("configuracion", "escuela"),
        database.get<ConfiguracionDB>("configuracion", "horario"),
      ]);
      setConfiguracion({ escuela: escuelaConfig?.data, horario: horarioConfig?.data });
      setLoading(false);
    };
    if (tipo && id) loadData();
  }, [tipo, id]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando horario...</p>
        </div>
      </div>
    );
  }
  
  if (!horario || !entidad) return <p className="p-6">Horario o entidad no encontrados.</p>

  const nombreCompleto = tipo === "docente"
    ? `${(entidad as DocenteDB).nombre} ${(entidad as DocenteDB).apellido}`
    : (entidad as CursoDB).nombre;

  return (
    <div className="print-this">
      <div className="mb-6 flex items-center justify-between no-print p-6">
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
        <Button onClick={() => window.print()} className="bg-indigo-600 hover:bg-indigo-700">
          <Printer className="w-4 h-4 mr-2" />
          Imprimir
        </Button>
      </div>
      
      <div className="print-container bg-white p-6">
          <HorarioTemplate
            horario={horario}
            entidad={entidad}
            tipo={tipo as "docente" | "curso"}
            configuracion={configuracion}
          />
      </div>
    </div>
  );
}