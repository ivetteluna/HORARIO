"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Edit, Trash2, BookOpen, Palette, Search, GraduationCap } from "lucide-react"
import { useAsignaturas, useDatabase } from "@/hooks/useDatabase"
import { useNiveles } from "@/hooks/useNiveles" // <-- CORRECCIÓN IMPORTANTE
import type { AsignaturaDB } from "@/lib/database"
import { toast } from "@/hooks/use-toast"

// ... (El resto del código del archivo se mantiene igual)