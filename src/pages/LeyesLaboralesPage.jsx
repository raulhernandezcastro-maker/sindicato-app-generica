import React, { useEffect, useState } from 'react'
import { Plus, Trash2, Scale } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Card, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Spinner } from '../components/ui/spinner'
import {
  Dialog, DialogContent, DialogDescription,
  DialogHeader, DialogTitle, DialogTrigger
} from '../components/ui/dialog'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Alert } from '../components/ui/alert'
import WhatsAppButton from '../components/ui/WhatsAppButton'

export default function LeyesLaboralesPage() {
  const { isAdministrador, user } = useAuth()

  const [documentos, setDocumentos] = useState([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState({ titulo: '' })
  const [selectedFile, setSelectedFile] = useState(null)
  const [formError, setFormError] = useState('')
  const [formLoading, setFormLoading] = useState(false)

  useEffect(() => { loadDocumentos() }, [])

  const loadDocumentos = async () => {
    try {
      const { data, error } = await supabase
        .from('documentos')
        .select('*')
        .eq('categoria', 'actas')
        .order('created_at', { ascending: false })
      if (error) throw error
      setDocumentos(data || [])
    } catch (err) {
      console.error('Error loading leyes:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')
    setFormLoading(true)

    if (!selectedFile) { setFormError('Selecciona un archivo'); setFormLoading(false); return }
    if (!user?.id)     { setFormError('Usuario no autenticado'); setFormLoading(false); return }

    try {
      const ext = selectedFile.name.split('.').pop()
      const safeTitle = formData.titulo
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/ñ/g, 'n').replace(/Ñ/g, 'N')
        .replace(/()[[\]{},;:!?¿¡'"]/g, '')
        .replace(/\s+/g, '_')
        .replace(/[^a-zA-Z0-9_\-]/g, '')
        .toLowerCase()
      const filePath = `${Date.now()}_${safeTitle}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('documents').upload(filePath, selectedFile)
      if (uploadError) throw uploadError

      const { data: publicUrlData } = supabase.storage
        .from('documents').getPublicUrl(filePath)

      const { data, error } = await supabase
        .from('documentos')
        .insert({
          titulo: formData.titulo,
          categoria: 'actas',
          archivo_path: filePath,
          archivo_url: publicUrlData.publicUrl,
          subido_por: user.id,
        })
        .select().single()

      if (error) throw error

      setDocumentos([data, ...documentos])
      setDialogOpen(false)
      setFormData({ titulo: '' })
      setSelectedFile(null)
    } catch (err) {
      setFormError(err.message || 'Error al subir el documento')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async (documento) => {
    if (!window.confirm('¿Eliminar este documento?')) return
    try {
      const { error } = await supabase.from('documentos').delete().eq('id', documento.id)
      if (error) throw error
      setDocumentos(documentos.filter(d => d.id !== documento.id))
    } catch (err) {
      alert('Error eliminando documento')
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">

      {/* ── Encabezado ── */}
      <div className="flex items-center justify-between px-4 py-3 rounded-lg"
           style={{ backgroundColor: '#1e40af' }}>
        <div className="flex items-center gap-2">
          <Scale className="w-5 h-5 text-white" />
          <div>
            <h1 className="text-xl font-bold text-white">Leyes Laborales</h1>
            <p className="text-xs text-blue-100">{documentos.length} documento{documentos.length !== 1 ? 's' : ''} disponible{documentos.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {isAdministrador && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" style={{ backgroundColor: '#3b82f6', color: '#1e3a8a' }}>
                <Plus className="w-4 h-4 mr-1" />
                Subir
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Subir Ley Laboral</DialogTitle>
                <DialogDescription>Sube un documento PDF de ley laboral</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                {formError && <Alert variant="destructive">{formError}</Alert>}
                <div>
                  <Label>Título</Label>
                  <Input
                    value={formData.titulo}
                    onChange={e => setFormData({ titulo: e.target.value })}
                    placeholder="Ej: Ley 20.940 Modernización Sindical"
                    required
                  />
                </div>
                <div>
                  <Label>Archivo (PDF)</Label>
                  <Input type="file" accept=".pdf" onChange={e => setSelectedFile(e.target.files?.[0])} required />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={formLoading} style={{ backgroundColor: '#1e40af', color: 'white' }}>
                    {formLoading ? 'Subiendo...' : 'Subir'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* ── Lista de documentos ── */}
      {loading ? (
        <div className="flex justify-center py-12"><Spinner className="w-8 h-8" /></div>
      ) : documentos.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Scale className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-40" />
            <p className="text-muted-foreground">No hay leyes laborales publicadas aún</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {documentos.map(doc => (
            <Card key={doc.id} className="overflow-hidden shadow-sm">
              <div className="px-4 py-2 flex items-center justify-between"
                   style={{ backgroundColor: '#3b82f6' }}>
                <span className="text-sm font-semibold" style={{ color: '#1e3a8a' }}>
                  {doc.titulo}
                </span>
                <span className="text-xs" style={{ color: '#1e3a8a', opacity: 0.7 }}>
                  {doc.created_at ? new Date(doc.created_at).toLocaleDateString('es-CL') : ''}
                </span>
              </div>
              <CardContent className="pt-3 pb-3 flex gap-2">
                <Button size="sm" asChild style={{ backgroundColor: '#1e40af', color: 'white' }}>
                  <a href={doc.archivo_url} target="_blank" rel="noopener noreferrer">
                    Ver documento
                  </a>
                </Button>
                {isAdministrador && (
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(doc)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
          <WhatsAppButton />
        </div>
      )}
    </div>
  )
}
