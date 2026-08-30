'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  BookOpen,
  FileText,
  Music,
  Plus,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  UploadCloud,
  Edit3,
  Trash2,
  ListFilter,
  GraduationCap,
  X,
} from 'lucide-react'

interface SubjectData {
  id: string
  name: string
}

interface ModuleData {
  id: string
  created_at?: string
  title: string
  content_text: string | null
  audio_url: string | null
  file_url: string | null
  file_type: string | null
  subject: string | null
  subject_id?: string | null
}

interface StatusState {
  success?: boolean
  msg?: string
}

export default function ManageMateriPage() {
  const router = useRouter()
  const supabase = createClient()

  const [viewMode, setViewMode] = useState<'list' | 'form'>('list')
  const [modulesList, setModulesList] = useState<ModuleData[]>([])
  const [subjectsList, setSubjectsList] = useState<SubjectData[]>([])
  const [isFetching, setIsFetching] = useState(true)
  const [isFetchingSubjects, setIsFetchingSubjects] = useState(true)

  const [filterSubjectId, setFilterSubjectId] = useState('')

  const [editingModuleId, setEditingModuleId] = useState<string | null>(null)
  const [contentType, setContentType] = useState<'text' | 'file'>('text')
  const [isDragActive, setIsDragActive] = useState(false)

  const [moduleTitle, setModuleTitle] = useState('')
  const [moduleContent, setModuleContent] = useState('')
  const [audioUrl, setAudioUrl] = useState('')
  const [fileDoc, setFileDoc] = useState<File | null>(null)
  const [existingFileUrl, setExistingFileUrl] = useState<string | null>(null)
  const [existingFileType, setExistingFileType] = useState<string | null>(null)

  const [selectedSubjectId, setSelectedSubjectId] = useState('')
  const [selectedSubjectName, setSelectedSubjectName] = useState('')

  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false)
  const [subjectModalMode, setSubjectModalMode] = useState<'add' | 'manage'>('add')
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null)
  const [subjectName, setSubjectName] = useState('')
  const [isSubjectLoading, setIsSubjectLoading] = useState(false)
  const [subjectStatus, setSubjectStatus] = useState<StatusState>({})

  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<StatusState>({})

  const fetchSubjects = useCallback(async () => {
    setIsFetchingSubjects(true)

    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('id, name')
        .order('name', { ascending: true })

      if (error) throw error
      setSubjectsList((data || []) as SubjectData[])
    } catch (error) {
      console.error('fetchSubjects error:', error)
    } finally {
      setIsFetchingSubjects(false)
    }
  }, [supabase])

  const fetchModules = useCallback(async () => {
    setIsFetching(true)

    try {
      const { data, error } = await supabase
        .from('modules')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      const modules = (data || []) as ModuleData[]
      setModulesList(modules)
    } catch (error) {
      console.error('fetchModules error:', error)
      setStatus({
        success: false,
        msg: error instanceof Error ? error.message : 'Gagal mengambil data materi.',
      })
    } finally {
      setIsFetching(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchModules()
    fetchSubjects()
  }, [fetchModules, fetchSubjects])

  useEffect(() => {
    const channel = supabase
      .channel('manage-materi-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'modules' },
        () => fetchModules()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'subjects' },
        () => fetchSubjects()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, fetchModules, fetchSubjects])

  const resetForm = () => {
    setEditingModuleId(null)
    setModuleTitle('')
    setModuleContent('')
    setAudioUrl('')
    setFileDoc(null)
    setExistingFileUrl(null)
    setExistingFileType(null)
    setSelectedSubjectId('')
    setSelectedSubjectName('')
    setContentType('text')
    setStatus({})
    setViewMode('list')
  }

  const openAddSubjectModal = () => {
    setSubjectModalMode('add')
    setEditingSubjectId(null)
    setSubjectName('')
    setSubjectStatus({})
    setIsSubjectModalOpen(true)
  }

  const openManageSubjectModal = () => {
    setSubjectModalMode('manage')
    setEditingSubjectId(null)
    setSubjectName('')
    setSubjectStatus({})
    setIsSubjectModalOpen(true)
  }

  const closeSubjectModal = () => {
    if (isSubjectLoading) return
    setIsSubjectModalOpen(false)
    setEditingSubjectId(null)
    setSubjectName('')
    setSubjectStatus({})
    setSubjectModalMode('add')
  }

  const handleSaveSubject = async (event: React.FormEvent) => {
    event.preventDefault()

    const trimmedName = subjectName.trim()

    if (trimmedName.length < 2) {
      setSubjectStatus({
        success: false,
        msg: 'Nama mata pelajaran minimal 2 karakter.',
      })
      return
    }

    setIsSubjectLoading(true)
    setSubjectStatus({})

    try {
      const { data: duplicateData, error: duplicateError } = await supabase
        .from('subjects')
        .select('id, name')
        .ilike('name', trimmedName)

      if (duplicateError) throw duplicateError

      const duplicate = (duplicateData || []).find(
        (subject) =>
          subject.id !== editingSubjectId &&
          subject.name.trim().toLowerCase() === trimmedName.toLowerCase()
      )

      if (duplicate) {
        throw new Error(`Mata pelajaran "${duplicate.name}" sudah tersedia.`)
      }

      if (editingSubjectId) {
        const currentSubject = subjectsList.find(
          (subject) => subject.id === editingSubjectId
        )
        const oldName = currentSubject?.name?.trim() || ''

        const { error } = await supabase
          .from('subjects')
          .update({ name: trimmedName })
          .eq('id', editingSubjectId)

        if (error) throw error

        if (oldName && oldName !== trimmedName) {
          const { error: moduleSyncError } = await supabase
            .from('modules')
            .update({ subject: trimmedName })
            .eq('subject', oldName)

          if (moduleSyncError) {
            await supabase
              .from('subjects')
              .update({ name: oldName })
              .eq('id', editingSubjectId)

            throw moduleSyncError
          }

          if (
            selectedSubjectName.trim().toLowerCase() === oldName.toLowerCase()
          ) {
            setSelectedSubjectName(trimmedName)
          }
        }

        setSubjectStatus({
          success: true,
          msg: 'Mata pelajaran dan materi terkait berhasil disinkronkan.',
        })
      } else {
        const { data, error } = await supabase
          .from('subjects')
          .insert({ name: trimmedName })
          .select('id, name')
          .single()

        if (error) throw error

        if (data) {
          setSelectedSubjectId(data.id)
          setSelectedSubjectName(data.name)
        }

        setSubjectStatus({
          success: true,
          msg: 'Mata pelajaran berhasil ditambahkan.',
        })
      }

      await fetchSubjects()
      setSubjectName('')
      setEditingSubjectId(null)
      setSubjectModalMode('manage')
    } catch (error) {
      console.error('handleSaveSubject error:', error)
      setSubjectStatus({
        success: false,
        msg: error instanceof Error ? error.message : 'Gagal menyimpan mata pelajaran.',
      })
    } finally {
      setIsSubjectLoading(false)
    }
  }

  const handleEditSubject = (subject: SubjectData) => {
    setSubjectModalMode('add')
    setEditingSubjectId(subject.id)
    setSubjectName(subject.name)
    setSubjectStatus({})
  }

  const handleDeleteSubject = async (subject: SubjectData) => {
    if (isSubjectLoading) return

    const confirmed = confirm(
      `Hapus mata pelajaran "${subject.name}"?\n\nMata pelajaran yang masih digunakan oleh materi atau kuis tidak dapat dihapus.`
    )

    if (!confirmed) return

    setIsSubjectLoading(true)
    setSubjectStatus({})

    try {
      const { count: moduleCount, error: moduleCheckError } = await supabase
        .from('modules')
        .select('id', { count: 'exact', head: true })
        .eq('subject', subject.name)

      if (moduleCheckError) throw moduleCheckError

      if ((moduleCount || 0) > 0) {
        throw new Error(
          `"${subject.name}" masih digunakan oleh ${moduleCount} materi.`
        )
      }

      const { count: quizCount, error: quizCheckError } = await supabase
        .from('quizzes')
        .select('id', { count: 'exact', head: true })
        .eq('subject_id', subject.id)

      if (quizCheckError) throw quizCheckError

      if ((quizCount || 0) > 0) {
        throw new Error(
          `"${subject.name}" masih digunakan oleh ${quizCount} kuis.`
        )
      }

      const { error } = await supabase
        .from('subjects')
        .delete()
        .eq('id', subject.id)

      if (error) throw error

      await fetchSubjects()

      if (selectedSubjectId === subject.id) {
        setSelectedSubjectId('')
        setSelectedSubjectName('')
      }

      setSubjectStatus({
        success: true,
        msg: `Mata pelajaran "${subject.name}" berhasil dihapus.`,
      })
    } catch (error) {
      console.error('handleDeleteSubject error:', error)
      setSubjectStatus({
        success: false,
        msg: error instanceof Error ? error.message : 'Gagal menghapus mata pelajaran.',
      })
    } finally {
      setIsSubjectLoading(false)
    }
  }

  const handleEditClick = (module: ModuleData) => {
    setEditingModuleId(module.id)
    setModuleTitle(module.title)

    const moduleSubjectName = module.subject?.trim() || ''
    const matchingSubject = subjectsList.find(
      (subject) =>
        subject.name.trim().toLowerCase() === moduleSubjectName.toLowerCase()
    )

    setSelectedSubjectName(moduleSubjectName)
    setSelectedSubjectId(matchingSubject?.id || module.subject_id || '')

    if (module.file_url) {
      setContentType('file')
      setExistingFileUrl(module.file_url)
      setExistingFileType(module.file_type)
      setModuleContent('')
      setAudioUrl('')
    } else {
      setContentType('text')
      setModuleContent(module.content_text || '')
      setAudioUrl(module.audio_url || '')
      setExistingFileUrl(null)
      setExistingFileType(null)
    }

    setStatus({})
    setViewMode('form')
  }

  const handleDeleteClick = async (moduleId: string) => {
    const linkedQuiz = await supabase
      .from('quizzes')
      .select('id, title')
      .eq('module_id', moduleId)

    if (linkedQuiz.error) {
      alert(`Gagal memeriksa quiz terkait: ${linkedQuiz.error.message}`)
      return
    }

    if ((linkedQuiz.data || []).length > 0) {
      alert(
        `Materi tidak dapat dihapus karena masih memiliki ${
          linkedQuiz.data?.length || 0
        } quiz terkait.\n\nHapus atau lepaskan quiz tersebut melalui Manage Quiz terlebih dahulu.`
      )
      return
    }

    if (!confirm('Apakah Anda yakin ingin menghapus materi ini?')) return

    setIsLoading(true)

    try {
      const { error } = await supabase
        .from('modules')
        .delete()
        .eq('id', moduleId)

      if (error) throw error

      await fetchModules()
      alert('Materi berhasil dihapus.')
    } catch (error) {
      alert(
        `Gagal menghapus materi: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsLoading(true)
    setStatus({})

    try {
      if (!selectedSubjectName.trim()) {
        throw new Error('Mata Pelajaran wajib dipilih.')
      }

      if (!moduleTitle.trim()) {
        throw new Error('Judul materi wajib diisi.')
      }

      const selectedSubjectRecord = subjectsList.find(
        (subject) =>
          subject.name.trim().toLowerCase() ===
          selectedSubjectName.trim().toLowerCase()
      )

      if (!selectedSubjectRecord) {
        throw new Error(
          'Mata pelajaran tidak ditemukan. Silakan refresh daftar mata pelajaran.'
        )
      }

      const normalizedSubjectName = selectedSubjectRecord.name.trim()

      let uploadedFileUrl = existingFileUrl
      let uploadedFileType = existingFileType

      if (contentType === 'file') {
        if (!fileDoc && !existingFileUrl) {
          throw new Error('Silakan pilih file PDF/Word terlebih dahulu.')
        }

        if (fileDoc) {
          const fileExt =
            fileDoc.name.split('.').pop()?.toLowerCase() || ''

          if (!['pdf', 'doc', 'docx'].includes(fileExt)) {
            throw new Error('Format file harus PDF, DOC, atau DOCX.')
          }

          const filePath = `documents/${Date.now()}-${fileDoc.name.replace(
            /[^a-zA-Z0-9._-]/g,
            '-'
          )}`

          const { error: uploadError } = await supabase.storage
            .from('modules')
            .upload(filePath, fileDoc, { upsert: false })

          if (uploadError) throw uploadError

          const { data } = supabase.storage
            .from('modules')
            .getPublicUrl(filePath)

          uploadedFileUrl = data.publicUrl
          uploadedFileType = fileExt
        }
      }

      const modulePayload = {
        title: moduleTitle.trim(),
        content_text: contentType === 'text' ? moduleContent : '',
        audio_url: contentType === 'text' ? audioUrl.trim() || null : null,
        file_url: contentType === 'file' ? uploadedFileUrl : null,
        file_type: contentType === 'file' ? uploadedFileType : null,
        subject: normalizedSubjectName,
      }

      if (editingModuleId) {
        const { error } = await supabase
          .from('modules')
          .update(modulePayload)
          .eq('id', editingModuleId)

        if (error) throw error

        setStatus({
          success: true,
          msg: 'Materi berhasil diperbarui.',
        })
      } else {
        const { error } = await supabase
          .from('modules')
          .insert(modulePayload)

        if (error) throw error

        setStatus({
          success: true,
          msg: 'Materi berhasil diterbitkan.',
        })
      }

      await fetchModules()

      setTimeout(() => {
        resetForm()
      }, 1000)
    } catch (error) {
      console.error('handleSubmit error:', error)
      setStatus({
        success: false,
        msg: error instanceof Error
          ? error.message
          : 'Gagal menyimpan materi.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const filteredModulesList = useMemo(() => {
    if (!filterSubjectId) return modulesList

    const subject = subjectsList.find(
      (item) => item.id === filterSubjectId
    )

    if (!subject) return modulesList

    return modulesList.filter(
      (module) =>
        module.subject?.trim().toLowerCase() ===
        subject.name.trim().toLowerCase()
    )
  }, [filterSubjectId, modulesList, subjectsList])


  return (
    <div className="w-full min-h-screen bg-white text-slate-800 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6 pb-20">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() =>
              viewMode === 'form'
                ? resetForm()
                : router.push('/super-admin')
            }
            className="inline-flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-600 hover:text-purple-600 bg-slate-50 hover:bg-purple-50 border border-slate-200 rounded-xl transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {viewMode === 'form' ? 'Kembali ke Daftar Materi' : 'Kembali ke Dashboard'}
          </button>

          {viewMode === 'list' && (
            <button
              type="button"
              onClick={() => {
                setStatus({})
                setViewMode('form')
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-black text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              Buat Materi Baru
            </button>
          )}
        </div>

        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-950 via-purple-900 to-slate-900 p-6 sm:p-8 text-white shadow-lg">
          <div className="absolute right-0 bottom-0 translate-x-10 translate-y-10 opacity-10">
            <BookOpen className="w-64 h-64" />
          </div>

          <div className="relative z-10 space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/20 text-purple-200 text-[10px] font-black uppercase tracking-wider">
              <BookOpen className="w-3.5 h-3.5" />
              Manage Materi
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              {viewMode === 'form'
                ? editingModuleId
                  ? 'Edit Materi'
                  : 'Buat Materi Baru'
                : 'Manajemen Materi Pembelajaran'}
            </h1>

            <p className="text-sm text-purple-100/70 max-w-2xl">
              {viewMode === 'form'
                ? 'Kelola materi secara terpisah dari kuis. Data halaman ini hanya disimpan ke tabel modules.'
                : 'Kelola seluruh materi microlearning tanpa membuat atau mengubah kuis secara otomatis.'}
            </p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {viewMode === 'list' ? (
            <motion.div
              key="list"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-5"
            >
              <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                <div className="flex items-center gap-2">
                  <ListFilter className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-bold text-slate-500">
                    Filter Mapel
                  </span>
                </div>

                <select
                  value={filterSubjectId}
                  onChange={(e) => setFilterSubjectId(e.target.value)}
                  disabled={isFetchingSubjects}
                  className="flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold bg-slate-50 focus:bg-white focus:border-purple-500 focus:outline-none"
                >
                  <option value="">Semua Mata Pelajaran</option>
                  {subjectsList.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>

                <span className="text-xs text-slate-400 font-medium">
                  {filteredModulesList.length} materi
                </span>
              </div>

              {status.msg && (
                <div
                  className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                    status.success
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}
                >
                  {status.success ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <AlertCircle className="w-4 h-4" />
                  )}
                  {status.msg}
                </div>
              )}

              {isFetching ? (
                <div className="p-12 flex items-center justify-center gap-2 text-xs text-slate-400">
                  <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
                  Memuat materi...
                </div>
              ) : filteredModulesList.length === 0 ? (
                <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                  <BookOpen className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                  <p className="text-sm font-black text-slate-700">
                    Belum ada materi
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Klik &quot;Buat Materi Baru&quot; untuk menambahkan materi.
                  </p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {filteredModulesList.map((module) => (
                    <motion.div
                      key={module.id}
                      whileHover={{ y: -2 }}
                      className="border border-slate-200 rounded-2xl bg-white p-4 flex items-center justify-between gap-4 shadow-sm hover:shadow-md transition-all"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5 mb-2">
                          <span className="inline-flex items-center gap-1 text-[10px] font-black text-purple-700 bg-purple-50 px-2 py-1 rounded-md">
                            {module.file_url ? (
                              <FileText className="w-3 h-3" />
                            ) : (
                              <BookOpen className="w-3 h-3" />
                            )}
                            {module.file_url
                              ? `File ${module.file_type || ''}`
                              : 'Teks & Audio'}
                          </span>

                          {module.subject && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black text-blue-700 bg-blue-50 px-2 py-1 rounded-md">
                              <GraduationCap className="w-3 h-3" />
                              {module.subject}
                            </span>
                          )}

                        </div>

                        <h3 className="text-sm font-black text-slate-900 truncate">
                          {module.title}
                        </h3>

                        <p className="text-[10px] text-slate-400 mt-1">
                          {module.created_at
                            ? new Date(module.created_at).toLocaleDateString(
                                'id-ID',
                                {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                }
                              )
                            : '-'}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleEditClick(module)}
                          disabled={isLoading}
                          className="w-9 h-9 rounded-xl bg-slate-50 hover:bg-purple-50 text-slate-500 hover:text-purple-600 border border-slate-200 flex items-center justify-center transition-all"
                          title="Edit Materi"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteClick(module.id)}
                          disabled={isLoading}
                          className="w-9 h-9 rounded-xl bg-slate-50 hover:bg-red-50 text-slate-500 hover:text-red-600 border border-slate-200 flex items-center justify-center transition-all"
                          title="Hapus Materi"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.form
              key="form"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              onSubmit={handleSubmit}
              className="space-y-6"
            >
              <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-5 shadow-sm">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <BookOpen className="w-4 h-4 text-purple-600" />
                  <h2 className="text-sm font-black text-slate-900">
                    Informasi Materi
                  </h2>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700">
                    Mata Pelajaran <span className="text-red-500">*</span>
                  </label>

                  <div className="flex gap-2">
                    <select
                      value={selectedSubjectName}
                      onChange={(e) => {
                        const name = e.target.value
                        const subject = subjectsList.find(
                          (item) => item.name === name
                        )

                        setSelectedSubjectName(name)
                        setSelectedSubjectId(subject?.id || '')
                      }}
                      required
                      disabled={isFetchingSubjects || isSubjectLoading}
                      className="flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold bg-slate-50 focus:bg-white focus:border-purple-500 focus:outline-none"
                    >
                      <option value="">
                        {isFetchingSubjects
                          ? 'Memuat mata pelajaran...'
                          : '-- Pilih Mata Pelajaran --'}
                      </option>

                      {subjectsList.map((subject) => (
                        <option key={subject.id} value={subject.name}>
                          {subject.name}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={openAddSubjectModal}
                      className="w-11 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-600 border border-purple-200 flex items-center justify-center"
                      title="Tambah Mata Pelajaran"
                    >
                      <Plus className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={openManageSubjectModal}
                      disabled={!subjectsList.length}
                      className="px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 text-[11px] font-black disabled:opacity-50"
                    >
                      Kelola
                    </button>
                  </div>

                  <p className="text-[10px] text-slate-400">
                    Nilai yang disimpan ke modules.subject adalah nama mata pelajaran.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700">
                    Judul Materi <span className="text-red-500">*</span>
                  </label>

                  <input
                    type="text"
                    required
                    value={moduleTitle}
                    onChange={(e) => setModuleTitle(e.target.value)}
                    placeholder="Contoh: Greetings & Introduction"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold bg-slate-50 focus:bg-white focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setContentType('text')}
                    disabled={editingModuleId !== null}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold ${
                      contentType === 'text'
                        ? 'bg-white text-purple-600 shadow-sm'
                        : 'text-slate-500'
                    } disabled:opacity-50`}
                  >
                    <BookOpen className="w-3.5 h-3.5 inline mr-1" />
                    Teks & Audio
                  </button>

                  <button
                    type="button"
                    onClick={() => setContentType('file')}
                    disabled={editingModuleId !== null}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold ${
                      contentType === 'file'
                        ? 'bg-white text-purple-600 shadow-sm'
                        : 'text-slate-500'
                    } disabled:opacity-50`}
                  >
                    <FileText className="w-3.5 h-3.5 inline mr-1" />
                    File Dokumen
                  </button>
                </div>

                {contentType === 'text' ? (
                  <>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700">
                        Konten Materi
                      </label>

                      <textarea
                        rows={7}
                        value={moduleContent}
                        onChange={(e) => setModuleContent(e.target.value)}
                        placeholder="Tuliskan materi pembelajaran..."
                        className="w-full rounded-xl border border-slate-200 p-3 text-xs font-medium bg-slate-50 focus:bg-white focus:border-purple-500 focus:outline-none resize-y"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <Music className="w-3.5 h-3.5 text-slate-400" />
                        URL Audio
                      </label>

                      <input
                        type="url"
                        value={audioUrl}
                        onChange={(e) => setAudioUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold bg-slate-50 focus:bg-white focus:border-purple-500 focus:outline-none"
                      />
                    </div>
                  </>
                ) : (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700">
                      File PDF / Word
                    </label>

                    <div
                      onDragOver={(e) => {
                        e.preventDefault()
                        setIsDragActive(true)
                      }}
                      onDragLeave={() => setIsDragActive(false)}
                      onDrop={(e) => {
                        e.preventDefault()
                        setIsDragActive(false)

                        const file = e.dataTransfer.files?.[0]
                        if (file) setFileDoc(file)
                      }}
                      className={`border-2 border-dashed rounded-2xl p-8 text-center ${
                        isDragActive
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-slate-200 bg-slate-50/70'
                      }`}
                    >
                      <UploadCloud className="w-9 h-9 text-purple-500 mx-auto mb-2" />

                      <p className="text-xs font-bold text-slate-700">
                        {fileDoc
                          ? fileDoc.name
                          : existingFileUrl
                            ? 'File lama masih terpasang'
                            : 'Tarik & lepas file ke sini'}
                      </p>

                      <input
                        id="doc-upload-input"
                        type="file"
                        accept=".pdf,.doc,.docx"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) setFileDoc(file)
                        }}
                      />

                      <label
                        htmlFor="doc-upload-input"
                        className="inline-block mt-3 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black text-purple-600 cursor-pointer"
                      >
                        Pilih File
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {status.msg && (
                <div
                  className={`p-4 rounded-xl border text-xs font-bold flex items-center gap-2 ${
                    status.success
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                      : 'bg-red-50 border-red-200 text-red-700'
                  }`}
                >
                  {status.success ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <AlertCircle className="w-4 h-4" />
                  )}
                  {status.msg}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 py-3 rounded-xl border border-slate-200 text-xs font-black text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingModuleId ? 'Simpan Perubahan Materi' : 'Terbitkan Materi'}
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isSubjectModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4"
              onMouseDown={(e) => {
                if (e.target === e.currentTarget) closeSubjectModal()
              }}
            >
              <motion.div
                initial={{ opacity: 0, y: 15, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 15, scale: 0.98 }}
                className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
              >
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black text-slate-900">
                      {subjectModalMode === 'add' && !editingSubjectId
                        ? 'Tambah Mata Pelajaran'
                        : subjectModalMode === 'add'
                          ? 'Edit Mata Pelajaran'
                          : 'Kelola Mata Pelajaran'}
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Data berasal dari tabel subjects.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={closeSubjectModal}
                    disabled={isSubjectLoading}
                    className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-red-50 flex items-center justify-center"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-5 max-h-[75vh] overflow-y-auto">
                  {subjectModalMode === 'add' ? (
                    <form onSubmit={handleSaveSubject} className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-700">
                          Nama Mata Pelajaran
                        </label>

                        <input
                          autoFocus
                          type="text"
                          value={subjectName}
                          maxLength={100}
                          disabled={isSubjectLoading}
                          onChange={(e) => setSubjectName(e.target.value)}
                          placeholder="Contoh: IPA"
                          className="w-full rounded-xl border border-slate-200 px-3 py-3 text-xs font-semibold bg-slate-50 focus:bg-white focus:border-purple-500 focus:outline-none"
                        />
                      </div>

                      {subjectStatus.msg && (
                        <div
                          className={`p-3 rounded-xl text-[11px] font-bold ${
                            subjectStatus.success
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-red-50 text-red-700'
                          }`}
                        >
                          {subjectStatus.msg}
                        </div>
                      )}

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (editingSubjectId) {
                              setEditingSubjectId(null)
                              setSubjectName('')
                              setSubjectStatus({})
                              setSubjectModalMode('manage')
                            } else {
                              closeSubjectModal()
                            }
                          }}
                          className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-black"
                        >
                          Batal
                        </button>

                        <button
                          type="submit"
                          disabled={isSubjectLoading || !subjectName.trim()}
                          className="flex-1 py-2.5 rounded-xl bg-purple-600 text-white text-xs font-black flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {isSubjectLoading && (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          )}
                          {editingSubjectId ? 'Simpan Perubahan' : 'Tambah'}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-3">
                      {subjectStatus.msg && (
                        <div
                          className={`p-3 rounded-xl text-[11px] font-bold ${
                            subjectStatus.success
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-red-50 text-red-700'
                          }`}
                        >
                          {subjectStatus.msg}
                        </div>
                      )}

                      {subjectsList.map((subject) => (
                        <div
                          key={subject.id}
                          className="flex items-center gap-3 p-3 rounded-2xl border border-slate-200 bg-slate-50"
                        >
                          <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                            <GraduationCap className="w-4 h-4" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-black text-slate-800 truncate">
                              {subject.name}
                            </p>
                            <p className="text-[9px] text-slate-400 truncate">
                              ID: {subject.id}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleEditSubject(subject)}
                            className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-purple-600"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteSubject(subject)}
                            disabled={isSubjectLoading}
                            className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-red-600 disabled:opacity-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={openAddSubjectModal}
                        className="w-full py-2.5 border-2 border-dashed border-purple-200 text-purple-600 rounded-xl text-xs font-black"
                      >
                        + Tambah Mata Pelajaran
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
