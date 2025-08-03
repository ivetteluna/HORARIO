"use client"

import { useState, useEffect } from "react"
import { database, type DocenteDB, type CursoDB, type AsignaturaDB, type ConfiguracionDB } from "@/lib/database"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Calendar, Clock, Users, BookOpen, AlertTriangle, CheckCircle, Play, RotateCcw } from "lucide-react"
import { toast } from "@/hooks/use-toast"

export default function GenerarPage() {
  const [docentes, setDocentes] = useState<DocenteDB[]>([])
  const [cursos, setCursos] = useState<CursoDB[]>([])
  const [asignaturas, setAsignaturas] = useState<AsignaturaDB[]>([])
  const [configuracion, setConfiguracion] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [generando, setGenerando] = useState(false)
  const [progreso, setProgreso] = useState(0)
  const [mensajeProgreso, setMensajeProgreso] = useState("")

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await database.init();
      const [docentesData, cursosData, asignaturasData, configData] = await Promise.all([
        database.getAll<DocenteDB>("docentes"),
        database.getAll<CursoDB>("cursos"),
        database.getAll<AsignaturaDB>("asignaturas"),
        database.get<ConfiguracionDB>("configuracion", "horario"),
      ]);
      setDocentes(docentesData);
      setCursos(cursosData);
      setAsignaturas(asignaturasData);
      setConfiguracion(configData?.data);
      setLoading(false);
    };
    loadData();
  }, []);

  const generarHorarios = async () => {
    if (!configuracion) {
      toast({ title: "Error", description: "Configuración de horarios no encontrada.", variant: "destructive" });
      return;
    }
    setGenerando(true);
    setMensajeProgreso("Iniciando proceso...");
    await new Promise(resolve => setTimeout(resolve, 50));

    const periodosClase = configuracion.periodosPersonalizados.filter(p => p.tipo === "clase");
    const dias = configuracion.diasSemana;
    let horariosDocentes = [];
    let horariosCursos = [];
    
    // Generar horarios de docentes
    for (const [index, docente] of docentes.entries()) {
        setMensajeProgreso(`Creando horario para ${docente.nombre}...`);
        setProgreso(index / (docentes.length + cursos.length) * 100);

        const horarioDocente = {
            id: `docente-${docente.id}`, tipo: "docente", entidadId: docente.id,
            nombre: `${docente.nombre} ${docente.apellido}`, horario: {}, fechaGeneracion: new Date().toISOString(),
        };
        dias.forEach(dia => {
            horarioDocente.horario[dia] = {};
            periodosClase.forEach(p => { horarioDocente.horario[dia][p.nombre] = { asignatura: "H. P" }; });
        });
        docente.restricciones.forEach(r => {
            if (horarioDocente.horario[r.dia]?.[r.periodo]) {
                horarioDocente.horario[r.dia][r.periodo] = { asignatura: r.actividad };
            }
        });
        
        horariosDocentes.push(horarioDocente);
    }

    // Generar horarios de cursos
    for (const [index, curso] of cursos.entries()) {
        setMensajeProgreso(`Creando horario para ${curso.nombre}...`);
        setProgreso((docentes.length + index) / (docentes.length + cursos.length) * 100);

        const horarioCurso = {
            id: `curso-${curso.id}`, tipo: "curso", entidadId: curso.id,
            nombre: curso.nombre, horario: {}, fechaGeneracion: new Date().toISOString(),
        };
        dias.forEach(dia => {
            horarioCurso.horario[dia] = {};
            periodosClase.forEach(p => { horarioCurso.horario[dia][p.nombre] = { asignatura: "" }; });
        });
        horariosCursos.push(horarioCurso);
    }
    
    // Lógica de asignación principal
    for (const curso of cursos) {
        let asignacionesCurso = [];
        docentes.forEach(docente => {
            docente.cursosAsignados.forEach(ca => {
                if (ca.cursoId === curso.id) {
                    ca.asignaturas.forEach(asigId => {
                        const asignatura = asignaturas.find(a => a.id === asigId);
                        if (asignatura && asignatura.horasPorNivel) {
                            const horas = asignatura.horasPorNivel[curso.nivel]?.[curso.grado] || 0;
                            for (let i = 0; i < horas; i++) {
                                asignacionesCurso.push({
                                    asignatura: asignatura.nombre,
                                    docenteId: docente.id,
                                    docenteNombre: `${docente.nombre} ${docente.apellido}`,
                                    horasRequeridas: horas
                                });
                            }
                        }
                    });
                }
            });
        });

        // Barajar para aleatoriedad
        asignacionesCurso.sort(() => Math.random() - 0.5);

        dias.forEach(dia => {
            let periodosDia = [...periodosClase].sort(() => Math.random() - 0.5);
            for (const periodo of periodosDia) {
                if (asignacionesCurso.length === 0) break;
                
                const horarioCurso = horariosCursos.find(h => h.entidadId === curso.id);
                if (horarioCurso.horario[dia][periodo.nombre].asignatura) continue; // Ya ocupado

                const asignacion = asignacionesCurso[0];
                const horarioDocente = horariosDocentes.find(h => h.entidadId === asignacion.docenteId);

                if (horarioDocente.horario[dia][periodo.nombre].asignatura === "H. P") {
                    
                    const asignacionActual = asignacionesCurso.shift();
                    
                    horarioCurso.horario[dia][periodo.nombre] = {
                        asignatura: asignacionActual.asignatura,
                        docente: asignacionActual.docenteNombre
                    };
                    horarioDocente.horario[dia][periodo.nombre] = {
                        asignatura: asignacionActual.asignatura,
                        curso: curso.nombre
                    };
                }
            }
        });
    }

    setMensajeProgreso("¡Horarios generados exitosamente!");
    setProgreso(100);
    localStorage.setItem("horariosGenerados", JSON.stringify([...horariosDocentes, ...horariosCursos]));
    toast({ title: "Éxito!", description: `Se generaron ${horariosDocentes.length + horariosCursos.length} horarios.` });
    setGenerando(false);
  }

  // ... (El resto del JSX se mantiene igual)
}