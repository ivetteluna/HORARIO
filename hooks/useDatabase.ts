"use client"

import { useState, useEffect, useCallback } from "react"
import { database, type DocenteDB, type AsignaturaDB, type CursoDB, type ConfiguracionDB } from "@/lib/database"

export function useDatabase() {
  const [isInitialized, setIsInitialized] = useState(false);
  useEffect(() => {
    database.init().then(() => setIsInitialized(true)).catch(err => console.error("DB Init failed:", err));
  }, []);
  return { isInitialized };
}

function useDataStore<T extends { id: string }>(storeName: string) {
  const { isInitialized } = useDatabase();
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!isInitialized) return;
    setLoading(true);
    try {
      const result = await database.getAll<T>(storeName);
      setData(result);
    } catch (error) {
      console.error(`Error loading ${storeName}:`, error);
    } finally {
      setLoading(false);
    }
  }, [isInitialized, storeName]);

  const saveData = useCallback(async (item: T) => {
    await database.save(storeName, item);
    await loadData();
  }, [storeName, loadData]);

  const deleteData = useCallback(async (id: string) => {
    await database.delete(storeName, id);
    await loadData();
  }, [storeName, loadData]);

  useEffect(() => {
    if (isInitialized) {
      loadData();
    }
  }, [isInitialized, loadData]);

  return { data, loading, saveData, deleteData, loadData };
}

export function useDocentes() {
  const { data, loading, saveData, deleteData } = useDataStore<DocenteDB>("docentes");
  return { docentes: data, loading, saveDocente: saveData, deleteDocente: deleteData };
}

export function useAsignaturas() {
  const { data, loading, saveData, deleteData } = useDataStore<AsignaturaDB>("asignaturas");
  return { asignaturas: data, loading, saveAsignatura: saveData, deleteAsignatura: deleteData };
}

export function useCursos() {
  const { data, loading, saveData, deleteData } = useDataStore<CursoDB>("cursos");
  return { cursos: data, loading, saveCurso: saveData, deleteCurso: deleteData };
}

export function useConfiguracion() {
  const { data, loading, saveData } = useDataStore<ConfiguracionDB>("configuracion");
  const { isInitialized } = useDatabase();

  const getConfiguracion = useCallback(async (tipo: "horario" | "escuela") => {
    if (!isInitialized) return undefined;
    return await database.get<ConfiguracionDB>("configuracion", tipo);
  }, [isInitialized]);

  return { configuracion: data, loading, saveConfiguracion: saveData, getConfiguracion };
}