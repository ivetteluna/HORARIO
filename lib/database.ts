// Database configuration and types
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
  asignaturas: {
    asignaturaId: string
    docenteId?: string
    horasSemanales: number
  }[]
  horasSemanales: number
  docenteTitular?: string
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
    if (!this.db) throw new Error("Database not initialized.");
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.put(data);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getAll<T>(storeName: string): Promise<T[]> {
    if (!this.db) throw new Error("Database not initialized.");
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, "readonly");
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async get<T>(storeName: string, id: string): Promise<T | undefined> {
    if (!this.db) throw new Error("Database not initialized.");
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, "readonly");
      const store = transaction.objectStore(storeName);
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async delete(storeName: string, id: string): Promise<void> {
    if (!this.db) throw new Error("Database not initialized.");
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clearAllStores(): Promise<void> {
    if (!this.db) throw new Error("Database not initialized.");
    const storeNames = Array.from(this.db.objectStoreNames);
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeNames, "readwrite");
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      storeNames.forEach(storeName => {
        transaction.objectStore(storeName).clear();
      });
    });
  }
}

export const database = new DatabaseService()