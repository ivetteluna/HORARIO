"use client"

import { useState } from "react"

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