// Database configuration and types
export interface DocenteDB {
  id: string
  nombre: string
  apellido: string
  cedula: string
  especialidad: string
  email: string
  telefono: string
  tipo: "titular" | "area" // Titular o de área
  nivel: "primario" | "secundario" | "ambos" // Nivel donde puede enseñar
  horasDisponibles: number
  cursosAsignados: {
    cursoId: string
    asignaturas: string[] // Asignaturas que imparte en este curso específico
    horasAsignadas: number
  }[]
  restricciones: string[]
}

export interface AsignaturaDB {
  id: string
  nombre: string
  codigo: string
  descripcion: string
  color: string
  tipo: "basica" | "area" // Básica (titular) o de área (especialista)
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
  asignaturas: {
    asignaturaId: string
    docenteId?: string // Docente asignado a esta asignatura en este curso
    horasSemanales: number
  }[]
  horasSemanales: number
  docenteTitular?: string // ID del docente titular (solo para primario)
  estudiantesMatriculados: number
  aula: string
}

export interface NivelEducativo {
  id: string
  nombre: string
  grados: string[]
  descripcion: string
}

export interface ConfiguracionDB {
  id: string
  tipo: "horario" | "escuela"
  data: any
}

export interface HorarioGeneradoDB {
  id: string
  tipo: "docente" | "curso"
  entidadId: string
  horario: any
  fechaGeneracion: string
}

class DatabaseService {
  private db: IDBDatabase | null = null
  private readonly dbName = "HorarioDocentesDB"
  private readonly version = 3
  private initPromise: Promise<void> | null = null

  async init(): Promise<void> {
    if (this.initPromise) {
      return this.initPromise
    }

    if (this.db) {
      return Promise.resolve()
    }

    this.initPromise = new Promise((resolve, reject) => {
      try {
        const request = indexedDB.open(this.dbName, this.version)

        request.onerror = () => {
          console.error("IndexedDB error:", request.error)
          this.initPromise = null
          reject(new Error(`Failed to open database: ${request.error?.message || "Unknown error"}`))
        }

        request.onsuccess = () => {
          this.db = request.result
          console.log("Database initialized successfully")
          resolve()
        }

        request.onupgradeneeded = (event) => {
          try {
            const db = (event.target as IDBOpenDBRequest).result
            const transaction = (event.target as IDBOpenDBRequest).transaction!

            console.log(`Upgrading database from version ${event.oldVersion} to ${event.newVersion}`)

            if (!db.objectStoreNames.contains("docentes")) {
              db.createObjectStore("docentes", { keyPath: "id" })
            }
            if (!db.objectStoreNames.contains("asignaturas")) {
              db.createObjectStore("asignaturas", { keyPath: "id" })
            }
            if (!db.objectStoreNames.contains("cursos")) {
              db.createObjectStore("cursos", { keyPath: "id" })
            }
            if (!db.objectStoreNames.contains("configuracion")) {
              db.createObjectStore("configuracion", { keyPath: "id" })
            }
            if (!db.objectStoreNames.contains("horarios")) {
              db.createObjectStore("horarios", { keyPath: "id" })
            }
          } catch (error) {
            console.error("Error during database upgrade:", error)
            this.initPromise = null
            reject(error)
          }
        }

        request.onblocked = () => {
          console.warn("Database upgrade blocked. Please close other tabs.")
        }
      } catch (error) {
        console.error("Error initializing IndexedDB:", error)
        this.initPromise = null
        reject(error)
      }
    })

    return this.initPromise
  }

  async save<T>(storeName: string, data: T): Promise<void> {
    if (!this.db) {
      throw new Error("Database not initialized. Call init() first.")
    }
    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db!.transaction([storeName], "readwrite")
        const store = transaction.objectStore(storeName)
        const request = store.put(data)
        request.onerror = () => reject(new Error(`Failed to save data: ${request.error?.message || "Unknown error"}`))
        request.onsuccess = () => resolve()
      } catch (error) {
        reject(error)
      }
    })
  }

  async getAll<T>(storeName: string): Promise<T[]> {
    if (!this.db) {
      throw new Error("Database not initialized. Call init() first.")
    }
    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db!.transaction([storeName], "readonly")
        const store = transaction.objectStore(storeName)
        const request = store.getAll()
        request.onerror = () => reject(new Error(`Failed to get data: ${request.error?.message || "Unknown error"}`))
        request.onsuccess = () => resolve(request.result || [])
      } catch (error) {
        reject(error)
      }
    })
  }

  async get<T>(storeName: string, id: string): Promise<T | undefined> {
    if (!this.db) {
      throw new Error("Database not initialized. Call init() first.")
    }
    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db!.transaction([storeName], "readonly")
        const store = transaction.objectStore(storeName)
        const request = store.get(id)
        request.onerror = () => reject(new Error(`Failed to get data: ${request.error?.message || "Unknown error"}`))
        request.onsuccess = () => resolve(request.result)
      } catch (error) {
        reject(error)
      }
    })
  }

  async delete(storeName: string, id: string): Promise<void> {
    if (!this.db) {
      throw new Error("Database not initialized. Call init() first.")
    }
    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db!.transaction([storeName], "readwrite")
        const store = transaction.objectStore(storeName)
        const request = store.delete(id)
        request.onerror = () => reject(new Error(`Failed to delete data: ${request.error?.message || "Unknown error"}`))
        request.onsuccess = () => resolve()
      } catch (error) {
        reject(error)
      }
    })
  }

  async clearAllStores(): Promise<void> {
    if (!this.db) {
      throw new Error("Database not initialized. Call init() first.")
    }
    const storeNames = Array.from(this.db.objectStoreNames)
    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db!.transaction(storeNames, "readwrite")
        transaction.onerror = () => {
          console.error("Error clearing stores:", transaction.error)
          reject(new Error(`Failed to clear stores: ${transaction.error?.message || "Unknown error"}`))
        }
        transaction.oncomplete = () => {
          console.log("All stores cleared successfully.")
          resolve()
        }
        storeNames.forEach((storeName) => {
          transaction.objectStore(storeName).clear()
        })
      } catch (error) {
        console.error("Error in clearAllStores operation:", error)
        reject(error)
      }
    })
  }

  async clearDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      const deleteRequest = indexedDB.deleteDatabase(this.dbName)
      deleteRequest.onsuccess = () => {
        this.db = null
        this.initPromise = null
        resolve()
      }
      deleteRequest.onerror = () => reject(deleteRequest.error)
      deleteRequest.onblocked = () => {
        console.warn("Database deletion blocked. Please close other tabs.")
      }
    })
  }
}

export const database = new DatabaseService()