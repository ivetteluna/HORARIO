"use client"

import { useState, useEffect, useCallback } from "react"
import { database, type DocenteDB, type AsignaturaDB, type CursoDB, type ConfiguracionDB } from "@/lib/database"

export function useDatabase() {
  const [isInitialized, setIsInitialized] = useState(false)
  useEffect(() => {
    database.init().then(() => setIsInitialized(true))
  }, [])
  return { isInitialized }
}

function useDataStore<T extends { id: string }>(storeName: string) {
  const { isInitialized } = useDatabase()
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    if (!isInitialized) return
    setLoading(true)
    try {
      const result = await database.getAll<T>(storeName)
      setData(result)
    } catch (error) {
      console.error(`Error loading ${storeName}:`, error)
    } finally {
      setLoading(false)
    }
  }, [isInitialized, storeName])

  const saveData = useCallback(async (item: T) => {
    await database.save(storeName, item)
    await loadData() // <-- Clave: Recargar los datos después de guardar
  }, [storeName, loadData])

  const deleteData = useCallback(async (id: string) => {
    await database.delete(storeName, id)
    await loadData() // <-- Clave: Recargar los datos después de eliminar
  }, [storeName, loadData])

  useEffect(() => {
    loadData()
  }, [loadData])

  return { data, loading, saveData, deleteData, loadData }
}

export function useDocentes() {
  const { data, loading, saveData, deleteData, loadData } = useDataStore<DocenteDB>("docentes")
  return { docentes: data, loading, saveDocente: saveData, deleteDocente: deleteData, loadDocentes: loadData }
}

export function useAsignaturas() {
  const { data, loading, saveData, deleteData, loadData } = useDataStore<AsignaturaDB>("asignaturas")
  return { asignaturas: data, loading, saveAsignatura: saveData, deleteAsignatura: deleteData, loadAsignaturas: loadData }
}

export function useCursos() {
  const { data, loading, saveData, deleteData, loadData } = useDataStore<CursoDB>("cursos")
  return { cursos: data, loading, saveCurso: saveData, deleteCurso: deleteData, loadCursos: loadData }
}

export function useConfiguracion() {
  const { data, loading, saveData, loadData } = useDataStore<ConfiguracionDB>("configuracion")
  const { isInitialized } = useDatabase()

  const getConfiguracion = useCallback(async (tipo: "horario" | "escuela") => {
    if (!isInitialized) return undefined;
    return await database.get<ConfiguracionDB>("configuracion", tipo);
  }, [isInitialized]);

  return { configuracion: data, loading, saveConfiguracion: saveData, getConfiguracion, loadConfiguracion: loadData }
}