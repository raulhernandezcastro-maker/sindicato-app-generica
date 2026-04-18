import React, { useEffect, useState } from 'react'
import { Plus, Trash2, Gift, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Button } from '../components/ui/button'
import { Spinner } from '../components/ui/spinner'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from '../components/ui/dialog'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Alert } from '../components/ui/alert'
import WhatsAppButton from '../components/ui/WhatsAppButton'

export default function BeneficiosPage() {
  const { isAdministrador, user } = useAuth()

  const [beneficios, setBeneficios]   = useState([])
  const [loading, setLoading]         = useState(true)
  const [dialogOpen, setDialogOpen]   = useState(false)
  const [formData, setFormData]       = useState({ titulo: '', descripcion: '' })
  const [selectedFile, setSelectedFile] = useState(null)
  const [formError, setFormError]     = useState('')
  const [formLoading, setFormLoading] = useState(false)

  // Lightbox
  const [lightboxIdx, setLightboxIdx] = useState(null)

  useEffect(() => { loadBeneficios() }, [])

  const loadBeneficios = async () => {
    try {
      const { data, error } = await supabase
        .from('beneficios')
        .select('*')
        .order('titulo', { ascending: true })
      if (error) throw error
      setBeneficios(data || [])
    } catch (err) {
      console.error('Error loading beneficios:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')
    setFormLoading(true)

    if (!selectedFile) { setFormError('Selecciona una imagen'); setFormLoading(false); return }
    if (!user?.id)     { setFormError('Usuario no autenticado'); setFormLoading(false); return }

    // Validar que sea imagen
    const MIME_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp']
    if (!MIME_PERMITIDOS.includes(selectedFile.type)) {
      setFormError('Solo se permiten imágenes JPG, PNG o WEBP')
      setFormLoading(false)
      return
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setFormError('La imagen no puede superar los 5MB')
      setFormLoading(false)
      return
    }

    try {
      const ext = selectedFile.name.split('.').pop().toLowerCase()
      const safeTitle = formData.titulo
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/ñ/g, 'n').replace(/Ñ/g, 'N')
        .replace(/[^a-zA-Z0-9\s_-]/g, '')
        .replace(/\s+/g, '_')
        .toLowerCase()
      const imagenPath = `${Date.now()}_${safeTitle}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('beneficios').upload(imagenPath, selectedFile, { contentType: selectedFile.type })
      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('beneficios').getPublicUrl(imagenPath)

      const { data, error } = await supabase
        .from('beneficios')
        .insert({
          titulo: formData.titulo,
          descripcion: formData.descripcion || null,
          imagen_path: imagenPath,
          imagen_url: urlData.publicUrl,
          subido_por: user.id,
        })
        .select().single()

      if (error) throw error

      setBeneficios(prev => [...prev, data].sort((a, b) => a.titulo.localeCompare(b.titulo)))
      setDialogOpen(false)
      setFormData({ titulo: '', descripcion: '' })
      setSelectedFile(null)
    } catch (err) {
      setFormError(err.message || 'Error al subir el beneficio')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async (beneficio) => {
    if (!window.confirm(`¿Eliminar "${beneficio.titulo}"?`)) return
    try {
      await supabase.storage.from('beneficios').remove([beneficio.imagen_path])
      const { error } = await supabase.from('beneficios').delete().eq('id', beneficio.id)
      if (error) throw error
      setBeneficios(prev => prev.filter(b => b.id !== beneficio.id))
      if (lightboxIdx !== null) setLightboxIdx(null)
    } catch (err) {
      alert('Error eliminando beneficio')
    }
  }

  // Lightbox navigation
  const openLightbox = (idx) => setLightboxIdx(idx)
  const closeLightbox = () => setLightboxIdx(null)
  const prevLightbox = () => setLightboxIdx(i => (i - 1 + beneficios.length) % beneficios.length)
  const nextLightbox = () => setLightboxIdx(i => (i + 1) % beneficios.length)

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (lightboxIdx === null) return
    const handler = (e) => {
      if (e.key === 'ArrowLeft')  prevLightbox()
      if (e.key === 'ArrowRight') nextLightbox()
      if (e.key === 'Escape')     closeLightbox()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [lightboxIdx])

  return (
    <div className="space-y-6 max-w-5xl mx-auto">

      {/* ── Encabezado ── */}
      <div className="flex items-center justify-between px-4 py-3 rounded-lg"
           style={{ backgroundColor: '#1e40af' }}>
        <div className="flex items-center gap-2">
          <Gift className="w-5 h-5 text-white" />
          <div>
            <h1 className="text-xl font-bold text-white">Beneficios</h1>
            <p className="text-xs text-blue-100">
              {beneficios.length} beneficio{beneficios.length !== 1 ? 's' : ''} del contrato colectivo
            </p>
          </div>
        </div>

        {isAdministrador && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" style={{ backgroundColor: '#3b82f6', color: '#1e3a8a' }}>
                <Plus className="w-4 h-4 mr-1" />
                Agregar
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Agregar Beneficio</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                {formError && <Alert variant="destructive">{formError}</Alert>}
                <div>
                  <Label>Nombre del beneficio *</Label>
                  <Input
                    value={formData.titulo}
                    onChange={e => setFormData({ ...formData, titulo: e.target.value })}
                    placeholder="Ej: Bono por Antigüedad"
                    required
                  />
                </div>
                <div>
                  <Label>Descripción breve (opcional)</Label>
                  <Input
                    value={formData.descripcion}
                    onChange={e => setFormData({ ...formData, descripcion: e.target.value })}
                    placeholder="Ej: Bono anual según años de servicio"
                  />
                </div>
                <div>
                  <Label>Imagen (JPG, PNG o WEBP — máx 5MB) *</Label>
                  <Input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={e => setSelectedFile(e.target.files?.[0])}
                    required
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={formLoading} style={{ backgroundColor: '#1e40af', color: 'white' }}>
                    {formLoading ? 'Subiendo...' : 'Agregar'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* ── Galería ── */}
      {loading ? (
        <div className="flex justify-center py-12"><Spinner className="w-8 h-8" /></div>
      ) : beneficios.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Gift className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No hay beneficios publicados aún</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 px-1">
            {beneficios.map((b, idx) => (
              <div
                key={b.id}
                className="rounded-xl overflow-hidden border shadow-sm bg-white cursor-pointer group relative"
                style={{ transition: 'transform 0.15s', }}
                onClick={() => openLightbox(idx)}
              >
                {/* Imagen */}
                <div className="overflow-hidden bg-white flex items-center justify-center" style={{ height: '180px' }}>
                  <img
                    src={b.imagen_url}
                    alt={b.titulo}
                    className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-200"
                    loading="lazy"
                  />
                </div>
                {/* Título */}
                <div className="px-2 py-2" style={{ backgroundColor: '#eff6ff' }}>
                  <p className="text-xs font-semibold leading-tight text-center"
                     style={{ color: '#1e40af' }}>
                    {b.titulo}
                  </p>
                  {b.descripcion && (
                    <p className="text-xs text-muted-foreground text-center mt-0.5 leading-tight">
                      {b.descripcion}
                    </p>
                  )}
                </div>
                {/* Botón eliminar — solo admin */}
                {isAdministrador && (
                  <button
                    onClick={e => { e.stopPropagation(); handleDelete(b) }}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Eliminar"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
          <WhatsAppButton />
        </>
      )}

      {/* ── Lightbox ── */}
      {lightboxIdx !== null && beneficios[lightboxIdx] && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85"
          onClick={closeLightbox}
        >
          {/* Botón cerrar */}
          <button
            className="absolute top-4 right-4 text-white bg-black/40 rounded-full p-2 hover:bg-black/60"
            onClick={closeLightbox}
          >
            <X className="w-6 h-6" />
          </button>

          {/* Navegación anterior */}
          {beneficios.length > 1 && (
            <button
              className="absolute left-2 text-white bg-black/40 rounded-full p-2 hover:bg-black/60"
              onClick={e => { e.stopPropagation(); prevLightbox() }}
            >
              <ChevronLeft className="w-7 h-7" />
            </button>
          )}

          {/* Imagen */}
          <div
            className="max-w-2xl w-full mx-12 flex flex-col items-center gap-3"
            onClick={e => e.stopPropagation()}
          >
            <img
              src={beneficios[lightboxIdx].imagen_url}
              alt={beneficios[lightboxIdx].titulo}
              className="w-full rounded-xl shadow-2xl object-contain max-h-[75vh]"
            />
            <div className="text-center">
              <p className="text-white font-bold text-lg">
                {beneficios[lightboxIdx].titulo}
              </p>
              {beneficios[lightboxIdx].descripcion && (
                <p className="text-gray-300 text-sm mt-1">
                  {beneficios[lightboxIdx].descripcion}
                </p>
              )}
              <p className="text-gray-500 text-xs mt-2">
                {lightboxIdx + 1} de {beneficios.length}
              </p>
            </div>
          </div>

          {/* Navegación siguiente */}
          {beneficios.length > 1 && (
            <button
              className="absolute right-2 text-white bg-black/40 rounded-full p-2 hover:bg-black/60"
              onClick={e => { e.stopPropagation(); nextLightbox() }}
            >
              <ChevronRight className="w-7 h-7" />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
