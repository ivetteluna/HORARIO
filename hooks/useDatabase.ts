"use client"

import { useState, useEffect, useCallback } from "react"
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

  const loadDocentes = useCallback(async () => {
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
  }, [isInitialized])

  const saveDocente = useCallback(async (docente: DocenteDB) => {
    if (!isInitialized) throw new Error("Database not initialized")
    await database.save("docentes", docente)
    await loadDocentes()
  }, [isInitialized, loadDocentes])

  const deleteDocente = useCallback(async (id: string) => {
    if (!isInitialized) throw new Error("Database not initialized")
    await database.delete("docentes", id)
    await loadDocentes()
  }, [isInitialized, loadDocentes])

  useEffect(() => {
    if (isInitialized) {
      loadDocentes()
    }
  }, [isInitialized, loadDocentes])

  return { docentes, loading, saveDocente, deleteDocente, loadDocentes }
}

export function useAsignaturas() {
  const [asignaturas, setAsignaturas] = useState<AsignaturaDB[]>([])
  const [loading, setLoading] = useState(true)
  const { isInitialized } = useDatabase()

  const loadAsignaturas = useCallback(async () => {
    if (!isInitialized) return
    setLoading(true)
    try {
      const data = await database.getAll<AsignaturaDB>("asignaturas")
      setAsignaturas(data || [])
    } catch (error) {
      console.error("Error loading asignaturas:", error)
    } finally {
      setLoading(false)
    }
  }, [isInitialized])

  const saveAsignatura = useCallback(async (asignatura: AsignaturaDB) => {
    if (!isInitialized) throw new Error("Database not initialized")
    await database.save("asignaturas", asignatura)
    await loadAsignaturas()
  }, [isInitialized, loadAsignaturas])

  const deleteAsignatura = useCallback(async (id: string) => {
    if (!isInitialized) throw new Error("Database not initialized")
    await database.delete("asignaturas", id)
    await loadAsignaturas()
  }, [isInitialized, loadAsignaturas])

  useEffect(() => {
    if (isInitialized) {
      loadAsignaturas()
    }
  }, [isInitialized, loadAsignaturas])

  return { asignaturas, loading, saveAsignatura, deleteAsignatura, loadAsignaturas }
}

export function useCursos() {
  const [cursos, setCursos] = useState<CursoDB[]>([])
  const [loading, setLoading] = useState(true)
  const { isInitialized } = useDatabase()

  const loadCursos = useCallback(async () => {
    if (!isInitialized) return
    setLoading(true)
    try {
      const data = await database.getAll<CursoDB>("cursos")
      setCursos(data || [])
    } catch (error) {
      console.error("Error loading cursos:", error)
    } finally {
      setLoading(false)
    }
  }, [isInitialized])

  const saveCurso = useCallback(async (curso: CursoDB) => {
    if (!isInitialized) throw new Error("Database not initialized")
    await database.save("cursos", curso)
    await loadCursos()
  }, [isInitialized, loadCursos])

  const deleteCurso = useCallback(async (id: string) => {
    if (!isInitialized) throw new Error("Database not initialized")
    await database.delete("cursos", id)
    await loadCursos()
  }, [isInitialized, loadCursos])

  useEffect(() => {
    if (isInitialized) {
      loadCursos()
    }
  }, [isInitialized, loadCursos])

  return { cursos, loading, saveCurso, deleteCurso, loadCursos }
}

export function useConfiguracion() {
  const [configuracion, setConfiguracion] = useState<ConfiguracionDB[]>([])
  const [loading, setLoading] = useState(true)
  const { isInitialized } = useDatabase()

  const loadConfiguracion = useCallback(async () => {
    if (!isInitialized) return
    setLoading(true)
    try {
      const data = await database.getAll<ConfiguracionDB>("configuracion")
      setConfiguracion(data || [])
    } catch (error) {
      console.error("Error loading configuracion:", error)
    } finally {
      setLoading(false)
    }
  }, [isInitialized])

  const saveConfiguracion = useCallback(async (config: ConfiguracionDB) => {
    if (!isInitialized) throw new Error("Database not initialized")
    await database.save("configuracion", config)
    await loadConfiguracion()
  }, [isInitialized, loadConfiguracion])

  const getConfiguracion = useCallback(async (tipo: "horario" | "escuela") => {
    if (!isInitialized) throw new Error("Database not initialized")
    return await database.get<ConfiguracionDB>("configuracion", tipo)
  }, [isInitialized])

  useEffect(() => {
    if (isInitialized) {
      loadConfiguracion()
    }
  }, [isInitialized, loadConfiguracion])

  return { configuracion, loading, saveConfiguracion, getConfiguracion, loadConfiguracion }
}

// ... (El resto del archivo se mantiene igual)