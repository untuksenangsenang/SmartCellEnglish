'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

interface ModuleType {
  id: string
  title: string
  created_at: string
}

export default function ModulesListPage() {
  const router = useRouter()
  const supabase = createClient()
  const [modules, setModules] = useState<ModuleType[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchModules = async () => {
      const { data, error } = await supabase
        .from('modules')
        .select('id, title, created_at')
        .order('created_at', { ascending: false })

      if (!error && data) {
        setModules(data)
      }
      setIsLoading(false)
    }

    fetchModules()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <button 
          onClick={() => router.push('/user')}
          className="mb-4 text-sm text-green-600 hover:underline font-semibold"
        >
          ← Kembali ke Dashboard
        </button>

        <h2 className="text-2xl font-bold text-gray-800 mb-2">📚 Modul Pembelajaran Mandiri</h2>
        <p className="text-sm text-gray-500 mb-6">Pilih modul di bawah ini untuk mulai membaca materi dan menguji pemahamanmu melalui kuis.</p>

        {isLoading ? (
          <p className="text-gray-500 text-sm">Sedang memuat daftar modul...</p>
        ) : modules.length === 0 ? (
          <div className="bg-white p-6 rounded-lg border text-center text-gray-500">
            Belum ada modul materi yang diterbitkan oleh Admin.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {modules.map((mod) => (
              <div 
                key={mod.id} 
                className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <h3 className="font-bold text-gray-800 text-lg mb-2">{mod.title}</h3>
                  <p className="text-xs text-gray-400 mb-4">
                    Diterbitkan pada: {new Date(mod.created_at).toLocaleDateString('id-ID')}
                  </p>
                </div>
                <button
                  onClick={() => router.push(`/user/modules/${mod.id}`)}
                  className="w-full py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition text-center"
                >
                  Mulai Belajar & Kuis →
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}