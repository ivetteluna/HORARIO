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
  private readonly version = 4 // Incrementa la versión para asegurar la actualización del esquema
  private initPromise: Promise<void> | null = null

  async init(): Promise<void> {
    if (this.initPromise) {
      return this.initPromise
    }
    if (this.db) {
      return Promise.resolve()
    }
    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains("docentes")) db.createObjectStore("docentes", { keyPath: "id" })
        if (!db.objectStoreNames.contains("asignaturas")) db.createObjectStore("asignaturas", { keyPath: "id" })
        if (!db.objectStoreNames.contains("cursos")) db.createObjectStore("cursos", { keyPath: "id" })
        if (!db.objectStoreNames.contains("configuracion")) db.createObjectStore("configuracion", { keyPath: "id" })
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
}

export const database = new DatabaseService()