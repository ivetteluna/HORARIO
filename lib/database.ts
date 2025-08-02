// ... (El resto de las interfaces se mantienen igual)

export interface DocenteDB {
  id: string
  nombre: string
  apellido: string
  cedula: string
  especialidad: string
  email: string
  telefono: string
  tipo: "titular" | "area"
  nivel: "primario" | "secundario" | "ambos"
  horasDisponibles: number
  cursosAsignados: {
    cursoId: string
    asignaturas: string[]
    horasAsignadas: number
  }[]
  restricciones: {
    dia: string
    periodo: string
    actividad: string
  }[]
}

// ... (El resto del código de la base de datos se mantiene igual)