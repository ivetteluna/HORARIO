// Database configuration and types
export interface DocenteDB {
  id: string
  nombre: string
  apellido: string
  cedula: string
  especialidad: string
  email: string
  telefono: string
  tipo: "titular" | "titular_con_adicionales" | "rotacion" // Actualizado
  nivel: "primario" | "secundario" | "ambos"
  horasDisponibles: number
  cursosAsignados: {
    cursoId: string
    asignaturas: string[]
    esTitular: boolean // Nuevo campo para marcar el curso principal
  }[]
  restricciones: {
    dia: string
    periodo: string
    actividad: string
  }[]
}

export interface AsignaturaDB {
  id: string
  nombre: string
  codigo: string
  descripcion: string
  color: string
  tipo: "basica" | "area"
  horasPorNivel: {
    primario: { [grado: string]: number }
    secundario: { [grado: string]: number }
  }
}

export interface CursoDB {
  id: string
  nombre: string
  nivel: "primario" | "secundario"
  grado: string
  seccion: string
  docenteTitularId?: string // Docente principal del curso
  estudiantesMatriculados: number
  aula: string
}

// ... (El resto del archivo se mantiene igual)