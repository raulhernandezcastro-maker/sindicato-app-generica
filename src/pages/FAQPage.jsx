import React, { useEffect, useState } from 'react'
import { HelpCircle, Plus, Pencil, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../components/ui/alert-dialog'
import { Label } from '../components/ui/label'
import { Input } from '../components/ui/input'
import { Spinner } from '../components/ui/spinner'
import WhatsAppButton from '../components/ui/WhatsAppButton'

const EMPTY_FORM = { pregunta: '', respuesta: '' }

export default function FAQPage() {
  const { isAdministrador } = useAuth()
  const [faqs, setFaqs]           = useState([])
  const [loading, setLoading]     = useState(true)
  const [openIdx, setOpenIdx]     = useState(null)

  // Modal crear/editar
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando]   = useState(null)
  const [form, setForm]           = useState(EMPTY_FORM)
  const [saving, setSaving]       = useState(false)
  const [formError, setFormError] = useState('')

  // Confirmar eliminar
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting]         = useState(false)

  const loadFaqs = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('faqs')
      .select('*')
      .order('orden', { ascending: true })
      .order('created_at', { ascending: true })
    setFaqs(data || [])
    setLoading(false)
  }

  useEffect(() => { loadFaqs() }, [])

  const abrirCrear = () => {
    setEditando(null)
    setForm(EMPTY_FORM)
    setFormError('')
    setModalOpen(true)
  }

  const abrirEditar = (faq) => {
    setEditando(faq)
    setForm({ pregunta: faq.pregunta, respuesta: faq.respuesta })
    setFormError('')
    setModalOpen(true)
  }

  const guardar = async () => {
    if (!form.pregunta.trim() || !form.respuesta.trim()) {
      setFormError('Debes completar la pregunta y la respuesta.')
      return
    }
    setSaving(true)
    setFormError('')
    try {
      if (editando) {
        await supabase.from('faqs').update({
          pregunta: form.pregunta.trim(),
          respuesta: form.respuesta.trim(),
        }).eq('id', editando.id)
      } else {
        const maxOrden = faqs.length > 0 ? Math.max(...faqs.map(f => f.orden)) + 1 : 0
        await supabase.from('faqs').insert({
          pregunta: form.pregunta.trim(),
          respuesta: form.respuesta.trim(),
          orden: maxOrden,
        })
      }
      setModalOpen(false)
      await loadFaqs()
    } catch (err) {
      setFormError('Error al guardar: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const eliminar = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    await supabase.from('faqs').delete().eq('id', deleteTarget.id)
    setDeleteTarget(null)
    setDeleting(false)
    await loadFaqs()
  }

  const toggleIdx = (i) => setOpenIdx(openIdx === i ? null : i)

  return (
    <div className="space-y-6 max-w-3xl mx-auto">

      {/* Título */}
      <div className="flex items-center justify-between px-4 py-3 rounded-lg"
           style={{ backgroundColor: '#1e40af' }}>
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-white" />
          <div>
            <h1 className="text-xl font-bold text-white">Preguntas Frecuentes</h1>
            <p className="text-xs text-blue-100">Consultas habituales del sindicato</p>
          </div>
        </div>
        {isAdministrador && (
          <Button size="sm" onClick={abrirCrear}
                  style={{ backgroundColor: '#3b82f6', color: '#1e3a8a' }}>
            <Plus className="w-4 h-4 mr-1" /> Nueva Pregunta
          </Button>
        )}
      </div>

      {/* Contenido */}
      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : faqs.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <HelpCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No hay preguntas frecuentes aún.</p>
          {isAdministrador && (
            <p className="text-xs mt-1">Haz clic en "Nueva Pregunta" para agregar la primera.</p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {faqs.map((faq, i) => (
            <div key={faq.id} className="rounded-lg border overflow-hidden shadow-sm">
              {/* Cabecera del acordeón */}
              <button
                onClick={() => toggleIdx(i)}
                className="w-full flex items-center justify-between px-4 py-3 text-left transition-colors"
                style={{
                  backgroundColor: openIdx === i ? '#1e40af' : '#eff6ff',
                  color: openIdx === i ? 'white' : '#1a1a1a'
                }}
              >
                <span className="font-semibold text-sm pr-4">{faq.pregunta}</span>
                <div className="flex items-center gap-2 shrink-0">
                  {/* Botones admin solo visibles al cerrar */}
                  {isAdministrador && openIdx !== i && (
                    <>
                      <span
                        onClick={(e) => { e.stopPropagation(); abrirEditar(faq) }}
                        className="p-1 rounded hover:bg-blue-200 cursor-pointer"
                        title="Editar"
                      >
                        <Pencil className="w-3.5 h-3.5" style={{ color: '#1e40af' }} />
                      </span>
                      <span
                        onClick={(e) => { e.stopPropagation(); setDeleteTarget(faq) }}
                        className="p-1 rounded hover:bg-red-100 cursor-pointer"
                        title="Eliminar"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      </span>
                    </>
                  )}
                  {openIdx === i
                    ? <ChevronUp className="w-4 h-4 text-white" />
                    : <ChevronDown className="w-4 h-4" style={{ color: '#1e40af' }} />
                  }
                </div>
              </button>

              {/* Respuesta */}
              {openIdx === i && (
                <div className="px-4 py-3 text-sm leading-relaxed border-t"
                     style={{ backgroundColor: '#f9fefb', color: '#333' }}>
                  <p style={{ whiteSpace: 'pre-line' }}>{faq.respuesta}</p>
                  {isAdministrador && (
                    <div className="flex gap-2 mt-3 pt-3 border-t">
                      <Button variant="outline" size="sm" onClick={() => abrirEditar(faq)}
                              className="h-7 px-2 text-xs">
                        <Pencil className="w-3 h-3 mr-1" /> Editar
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setDeleteTarget(faq)}
                              className="h-7 px-2 text-xs text-red-500 border-red-200 hover:bg-red-50">
                        <Trash2 className="w-3 h-3 mr-1" /> Eliminar
                      </Button>
      <WhatsAppButton />
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal crear/editar */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle style={{ color: '#1e40af' }}>
              {editando ? 'Editar Pregunta' : 'Nueva Pregunta Frecuente'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {formError && (
              <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded">{formError}</p>
            )}
            <div>
              <Label style={{ color: '#1e40af' }} className="font-semibold">Pregunta</Label>
              <Input
                className="mt-1"
                style={{ borderColor: '#1e40af' }}
                placeholder="¿Cuándo se pagan las cuotas?"
                value={form.pregunta}
                onChange={e => setForm(f => ({ ...f, pregunta: e.target.value }))}
              />
            </div>
            <div>
              <Label style={{ color: '#1e40af' }} className="font-semibold">Respuesta</Label>
              <textarea
                className="mt-1 w-full border rounded px-3 py-2 text-sm focus:outline-none resize-none"
                style={{ borderColor: '#1e40af', minHeight: '120px' }}
                placeholder="Escribe la respuesta aquí..."
                value={form.respuesta}
                onChange={e => setForm(f => ({ ...f, respuesta: e.target.value }))}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
              <Button onClick={guardar} disabled={saving}
                      style={{ backgroundColor: '#1e40af', color: 'white' }}>
                {saving ? 'Guardando...' : editando ? 'Guardar Cambios' : 'Agregar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmar eliminar */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta pregunta?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará permanentemente: <strong>"{deleteTarget?.pregunta}"</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={eliminar}
              disabled={deleting}
              style={{ backgroundColor: '#c0392b', color: 'white' }}
            >
              {deleting ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <WhatsAppButton />

    </div>
  )
}
