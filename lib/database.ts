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
    // Evitar múltiples inicializaciones simultáneas
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

            // Create object stores
            if (!db.objectStoreNames.contains("docentes")) {
              console.log("Creating docentes store")
              db.createObjectStore("docentes", { keyPath: "id" })
            }

            if (!db.objectStoreNames.contains("asignaturas")) {
              console.log("Creating asignaturas store")
              db.createObjectStore("asignaturas", { keyPath: "id" })
            }

            if (!db.objectStoreNames.contains("cursos")) {
              console.log("Creating cursos store")
              db.createObjectStore("cursos", { keyPath: "id" })
            }

            if (!db.objectStoreNames.contains("configuracion")) {
              console.log("Creating configuracion store")
              db.createObjectStore("configuracion", { keyPath: "id" })
            }

            if (!db.objectStoreNames.contains("horarios")) {
              console.log("Creating horarios store")
              db.createObjectStore("horarios", { keyPath: "id" })
            }

            // Migrar datos existentes si es necesario
            if (event.oldVersion > 0 && event.oldVersion < 3) {
              console.log("Starting migration to version 3...")
              this.migrateToV3(transaction)
            }

            console.log("Database schema updated successfully")
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

  private migrateToV3(transaction: IDBTransaction) {
    try {
      console.log("Migrating existing data to version 3...")

      // Migrar docentes - eliminar campos innecesarios
      if (transaction.objectStoreNames.contains("docentes")) {
        const docentesStore = transaction.objectStore("docentes")
        const docentesRequest = docentesStore.getAll()

        docentesRequest.onsuccess = () => {
          const docentes = docentesRequest.result
          let migratedCount = 0

          docentes.forEach((docente: any) => {
            let updated = false

            // Eliminar campos que ya no se usan
            if (docente.asignaturasQueImparte) {
              delete docente.asignaturasQueImparte
              updated = true
            }

            if (docente.gradosDisponibles) {
              delete docente.gradosDisponibles
              updated = true
            }

            if (docente.seccionesDisponibles) {
              delete docente.seccionesDisponibles
              updated = true
            }

            // Asegurar que los campos requeridos existan
            if (!docente.cursosAsignados) {
              docente.cursosAsignados = []
              updated = true
            }

            if (!docente.restricciones) {
              docente.restricciones = []
              updated = true
            }

            if (updated) {
              docentesStore.put(docente)
              migratedCount++
            }
          })

          console.log(`Migrated ${migratedCount} docentes out of ${docentes.length}`)
        }

        docentesRequest.onerror = () => {
          console.error("Error migrating docentes:", docentesRequest.error)
        }
      }

      console.log("Migration setup completed")
    } catch (error) {
      console.error("Error during migration setup:", error)
    }
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

        request.onerror = () => {
          console.error(`Error saving to ${storeName}:`, request.error)
          reject(new Error(`Failed to save data: ${request.error?.message || "Unknown error"}`))
        }

        request.onsuccess = () => resolve()
      } catch (error) {
        console.error(`Error in save operation for ${storeName}:`, error)
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

        request.onerror = () => {
          console.error(`Error getting all from ${storeName}:`, request.error)
          reject(new Error(`Failed to get data: ${request.error?.message || "Unknown error"}`))
        }

        request.onsuccess = () => resolve(request.result || [])
      } catch (error) {
        console.error(`Error in getAll operation for ${storeName}:`, error)
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

        request.onerror = () => {
          console.error(`Error getting ${id} from ${storeName}:`, request.error)
          reject(new Error(`Failed to get data: ${request.error?.message || "Unknown error"}`))
        }

        request.onsuccess = () => resolve(request.result)
      } catch (error) {
        console.error(`Error in get operation for ${storeName}:`, error)
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

        request.onerror = () => {
          console.error(`Error deleting ${id} from ${storeName}:`, request.error)
          reject(new Error(`Failed to delete data: ${request.error?.message || "Unknown error"}`))
        }

        request.onsuccess = () => resolve()
      } catch (error) {
        console.error(`Error in delete operation for ${storeName}:`, error)
        reject(error)
      }
    })
  }

  // Método para limpiar la base de datos en caso de problemas
  async clearDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      const deleteRequest = indexedDB.deleteDatabase(this.dbName)

      deleteRequest.onsuccess = () => {
        console.log("Database cleared successfully")
        this.db = null
        this.initPromise = null
        resolve()
      }

      deleteRequest.onerror = () => {
        console.error("Error clearing database:", deleteRequest.error)
        reject(deleteRequest.error)
      }

      deleteRequest.onblocked = () => {
        console.warn("Database deletion blocked. Please close other tabs.")
      }
    })
  }
}

export const database = new DatabaseService()
