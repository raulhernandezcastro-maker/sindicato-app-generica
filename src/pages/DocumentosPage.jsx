import React, { useEffect, useState } from 'react'
import { Plus, Trash2, FolderOpen } from 'lucide-react'
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
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue
} from '../components/ui/select'
import { Alert } from '../components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import WhatsAppButton from '../components/ui/WhatsAppButton'

export default function DocumentosPage() {
  const { isAdministrador, isDirector, user } = useAuth()

  const [documentos, setDocumentos] = useState([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState({ titulo: '', categoria: 'estatutos' })
  const [selectedFile, setSelectedFile] = useState(null)
  const [formError, setFormError] = useState('')
  const [formLoading, setFormLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('beneficios')

  const canManage = isAdministrador

  useEffect(() => { loadDocumentos() }, [])

  const loadDocumentos = async () => {
    try {
      const { data, error } = await supabase
        .from('documentos')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      setDocumentos(data || [])
    } catch (err) {
      console.error('Error loading documentos:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e) => setSelectedFile(e.target.files?.[0])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')
    setFormLoading(true)

    if (!selectedFile) { setFormError('Selecciona un archivo'); setFormLoading(false); return }
    if (!user?.id)     { setFormError('Usuario no autenticado'); setFormLoading(false); return }

    try {
      const ext = selectedFile.name.split('.').pop()
      // Limpiar nombre: tildes, ñ, paréntesis, espacios y caracteres especiales
      const safeTitle = formData.titulo
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')  // eliminar tildes
        .replace(/ñ/g, 'n').replace(/Ñ/g, 'N')              // reemplazar ñ
        .replace(/[()\[\]{},;:!?¿¡'"]/g, '')               // eliminar símbolos
        .replace(/\s+/g, '_')                               // espacios → guión bajo
        .replace(/[^a-zA-Z0-9_\-]/g, '')                   // solo alfanuméricos
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
          categoria: formData.categoria,
          archivo_path: filePath,
          archivo_url: publicUrlData.publicUrl,
          subido_por: user.id,
        })
        .select().single()

      if (error) throw error

      setDocumentos([data, ...documentos])
      setDialogOpen(false)
      setFormData({ titulo: '', categoria: 'estatutos' })
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

  const documentosPorCategoria = (cat) => documentos.filter(d => d.categoria === cat)

  const DocumentosList = ({ categoria }) => {
    const docs = documentosPorCategoria(categoria)
    if (docs.length === 0) {
      return (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No hay documentos en esta categoría</p>
          </CardContent>
        </Card>
      )
    }
    return (
      <div className="space-y-3">
        {docs.map(doc => (
          <Card key={doc.id} className="overflow-hidden">
            {/* Cabecera con color */}
            <div className="px-4 py-2 flex items-center justify-between"
                 style={{ backgroundColor: '#3b82f6' }}>
              <span className="text-sm font-semibold" style={{ color: '#1e3a8a' }}>
                {doc.titulo}
              </span>
              <span className="text-xs" style={{ color: '#1e3a8a', opacity: 0.7 }}>
                {doc.created_at ? new Date(doc.created_at).toLocaleDateString('es-CL') : ''}
              </span>
            </div>
            <CardContent className="pt-3 pb-3">
              <div className="flex gap-2">
                <Button size="sm" asChild style={{ backgroundColor: '#1e40af', color: 'white' }}>
                  <a href={doc.archivo_url} target="_blank" rel="noopener noreferrer">
                    Ver documento
                  </a>
                </Button>
                {canManage && (
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(doc)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      <WhatsAppButton />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">

      {/* ── Encabezado ── */}
      <div className="flex items-center justify-between px-4 py-3 rounded-lg"
           style={{ backgroundColor: '#1e40af' }}>
        <div className="flex items-center gap-2">
          <FolderOpen className="w-5 h-5 text-white" />
          <div>
            <h1 className="text-xl font-bold text-white">Documentos</h1>
            <p className="text-xs text-blue-100">Documentación oficial del sindicato</p>
          </div>
        </div>

        {canManage && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" style={{ backgroundColor: '#3b82f6', color: '#1e3a8a' }}>
                <Plus className="w-4 h-4 mr-1" />
                Subir
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Subir Documento</DialogTitle>
                <DialogDescription>Completa los datos del documento</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                {formError && <Alert variant="destructive">{formError}</Alert>}
                <div>
                  <Label>Título</Label>
                  <Input
                    value={formData.titulo}
                    onChange={e => setFormData({ ...formData, titulo: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Categoría</Label>
                  <Select
                    value={formData.categoria}
                    onValueChange={v => setFormData({ ...formData, categoria: v })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="estatutos">Estatutos</SelectItem>
                      <SelectItem value="actas">Leyes Laborales</SelectItem>
                      <SelectItem value="beneficios">Beneficios</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Archivo (PDF)</Label>
                  <Input type="file" accept=".pdf" onChange={handleFileChange} required />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" style={{ backgroundColor: '#1e40af', color: 'white' }}>
                    {formLoading ? 'Subiendo...' : 'Subir'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner className="w-8 h-8" /></div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3"
                    style={{ backgroundColor: '#e8f5ec' }}>
            <TabsTrigger value="beneficios"
              style={activeTab === 'beneficios' ? { backgroundColor: '#1e40af', color: 'white' } : {}}>
              Beneficios
            </TabsTrigger>
            <TabsTrigger value="actas"
              style={activeTab === 'actas' ? { backgroundColor: '#1e40af', color: 'white' } : {}}>
              Leyes Laborales
            </TabsTrigger>
            <TabsTrigger value="estatutos"
              style={activeTab === 'estatutos' ? { backgroundColor: '#1e40af', color: 'white' } : {}}>
              Estatutos
            </TabsTrigger>
          </TabsList>
          <TabsContent value="beneficios"><DocumentosList categoria="beneficios" /></TabsContent>
          <TabsContent value="actas"><DocumentosList categoria="actas" /></TabsContent>
          <TabsContent value="estatutos"><DocumentosList categoria="estatutos" /></TabsContent>
        </Tabs>
      )}
    </div>
  )
}
