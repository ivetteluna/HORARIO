"use client"

import { useState, useEffect } from "react"
import { database, type DocenteDB, type AsignaturaDB, type CursoDB, type ConfiguracionDB } from "@/lib/database"

export function useDatabase() {
  const [isInitialized, setIsInitialized] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const initDB = async () => {
      try {
        await database.init()
        setIsInitialized(true)
        setError(null)
      } catch (error) {
        console.error("Error initializing database:", error)
        setError(error instanceof Error ? error.message : "Unknown error")
      }
    }

    initDB()
  }, [])

  return { isInitialized, error }
}

export function useDocentes() {
  const [docentes, setDocentes] = useState<DocenteDB[]>([])
  const [loading, setLoading] = useState(true)
  const { isInitialized } = useDatabase()

  const loadDocentes = async () => {
    if (!isInitialized) {
      setLoading(true)
      return
    }

    try {
      setLoading(true)
      const data = await database.getAll<DocenteDB>("docentes")
      setDocentes(data || [])
    } catch (error) {
      console.error("Error loading docentes:", error)
      setDocentes([])
    } finally {
      setLoading(false)
    }
  }

  const saveDocente = async (docente: DocenteDB) => {
    if (!isInitialized) {
      throw new Error("Database not initialized")
    }

    try {
      await database.save("docentes", docente)
      await loadDocentes()
    } catch (error) {
      console.error("Error saving docente:", error)
      throw error
    }
  }

  const deleteDocente = async (id: string) => {
    if (!isInitialized) {
      throw new Error("Database not initialized")
    }

    try {
      await database.delete("docentes", id)
      await loadDocentes()
    } catch (error) {
      console.error("Error deleting docente:", error)
      throw error
    }
  }

  useEffect(() => {
    if (isInitialized) {
      loadDocentes()
    }
  }, [isInitialized])

  return { docentes, loading, saveDocente, deleteDocente, loadDocentes }
}

export function useAsignaturas() {
  const [asignaturas, setAsignaturas] = useState<AsignaturaDB[]>([])
  const [loading, setLoading] = useState(true)
  const { isInitialized } = useDatabase()

  const loadAsignaturas = async () => {
    if (!isInitialized) {
      setLoading(true)
      return
    }

    try {
      setLoading(true)
      const data = await database.getAll<AsignaturaDB>("asignaturas")
      setAsignaturas(data || [])
    } catch (error) {
      console.error("Error loading asignaturas:", error)
      setAsignaturas([])
    } finally {
      setLoading(false)
    }
  }

  const saveAsignatura = async (asignatura: AsignaturaDB) => {
    if (!isInitialized) {
      throw new Error("Database not initialized")
    }

    try {
      await database.save("asignaturas", asignatura)
      await loadAsignaturas()
    } catch (error) {
      console.error("Error saving asignatura:", error)
      throw error
    }
  }

  const deleteAsignatura = async (id: string) => {
    if (!isInitialized) {
      throw new Error("Database not initialized")
    }

    try {
      await database.delete("asignaturas", id)
      await loadAsignaturas()
    } catch (error) {
      console.error("Error deleting asignatura:", error)
      throw error
    }
  }

  useEffect(() => {
    if (isInitialized) {
      loadAsignaturas()
    }
  }, [isInitialized])

  return { asignaturas, loading, saveAsignatura, deleteAsignatura, loadAsignaturas }
}

export function useCursos() {
  const [cursos, setCursos] = useState<CursoDB[]>([])
  const [loading, setLoading] = useState(true)
  const { isInitialized } = useDatabase()

  const loadCursos = async () => {
    if (!isInitialized) {
      setLoading(true)
      return
    }

    try {
      setLoading(true)
      const data = await database.getAll<CursoDB>("cursos")
      setCursos(data || [])
    } catch (error) {
      console.error("Error loading cursos:", error)
      setCursos([])
    } finally {
      setLoading(false)
    }
  }

  const saveCurso = async (curso: CursoDB) => {
    if (!isInitialized) {
      throw new Error("Database not initialized")
    }

    try {
      await database.save("cursos", curso)
      await loadCursos()
    } catch (error) {
      console.error("Error saving curso:", error)
      throw error
    }
  }

  const deleteCurso = async (id: string) => {
    if (!isInitialized) {
      throw new Error("Database not initialized")
    }

    try {
      await database.delete("cursos", id)
      await loadCursos()
    } catch (error) {
      console.error("Error deleting curso:", error)
      throw error
    }
  }

  useEffect(() => {
    if (isInitialized) {
      loadCursos()
    }
  }, [isInitialized])

  return { cursos, loading, saveCurso, deleteCurso, loadCursos }
}

export function useConfiguracion() {
  const [configuracion, setConfiguracion] = useState<ConfiguracionDB[]>([])
  const [loading, setLoading] = useState(true)
  const { isInitialized } = useDatabase()

  const loadConfiguracion = async () => {
    if (!isInitialized) {
      setLoading(true)
      return
    }

    try {
      setLoading(true)
      const data = await database.getAll<ConfiguracionDB>("configuracion")
      setConfiguracion(data || [])
    } catch (error) {
      console.error("Error loading configuracion:", error)
      setConfiguracion([])
    } finally {
      setLoading(false)
    }
  }

  const saveConfiguracion = async (config: ConfiguracionDB) => {
    if (!isInitialized) {
      throw new Error("Database not initialized")
    }

    try {
      await database.save("configuracion", config)
      await loadConfiguracion()
    } catch (error) {
      console.error("Error saving configuracion:", error)
      throw error
    }
  }

  const getConfiguracion = async (tipo: "horario" | "escuela") => {
    if (!isInitialized) {
      throw new Error("Database not initialized")
    }

    try {
      return await database.get<ConfiguracionDB>("configuracion", tipo)
    } catch (error) {
      console.error("Error getting configuracion:", error)
      return undefined
    }
  }

  useEffect(() => {
    if (isInitialized) {
      loadConfiguracion()
    }
  }, [isInitialized])

  return { configuracion, loading, saveConfiguracion, getConfiguracion, loadConfiguracion }
}

// Agregar hook para niveles educativos

export interface NivelEducativo {
  id: string
  nombre: string
  grados: string[]
  descripcion: string
}

export function useNiveles() {
  const [niveles] = useState<NivelEducativo[]>([
    {
      id: "primario",
      nombre: "Nivel Primario",
      grados: ["1°", "2°", "3°", "4°", "5°", "6°"],
      descripcion: "Educación Primaria - 1° a 6° grado",
    },
    {
      id: "secundario",
      nombre: "Nivel Secundario",
      grados: ["1°", "2°", "3°", "4°", "5°", "6°"],
      descripcion: "Educación Secundaria - 1° a 6° grado",
    },
  ])

  return { niveles }
}

// Actualizar hooks existentes para manejar la nueva estructura...
