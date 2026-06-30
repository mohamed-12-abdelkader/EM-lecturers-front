import React, { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import baseUrl from '../../api/baseUrl'
import UserType from '../../Hooks/auth/userType'
import ScrollToTop from '../../components/scollToTop/ScrollToTop'
import BrandLoadingScreen from '../../components/loading/BrandLoadingScreen'

const Match = () => {
  const { id } = useParams()
  const [userData, isAdmin, isTeacher] = UserType()
  const [matchData, setMatchData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Questions state
  const [questions, setQuestions] = useState([])
  const [qLoading, setQLoading] = useState(false)
  const [qError, setQError] = useState('')
  const [showBulkForm, setShowBulkForm] = useState(false)
  const [bulkText, setBulkText] = useState('')
  const [creatingBulk, setCreatingBulk] = useState(false)
  const [showSingleForm, setShowSingleForm] = useState(false)
  const [singleDraft, setSingleDraft] = useState({ text: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_answer: '' })
  const [creatingSingle, setCreatingSingle] = useState(false)
  const [showImageForm, setShowImageForm] = useState(false)
  const [selectedImages, setSelectedImages] = useState([])
  const [uploadingImages, setUploadingImages] = useState(false)
  const [editing, setEditing] = useState(null) // { id, text, option_a.. }
  const [savingEdit, setSavingEdit] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [uploadingId, setUploadingId] = useState(null)
  const [settingCorrectId, setSettingCorrectId] = useState(null)
  const [studentIndex, setStudentIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState({}) // { [questionId]: 'A'|'B'|'C'|'D' }
  const [submittingSolve, setSubmittingSolve] = useState(false)
  const [solveError, setSolveError] = useState('')
  const [resultData, setResultData] = useState(null)
  const [resultLoading, setResultLoading] = useState(false)
  const [resultError, setResultError] = useState('')

  const authHeader = useMemo(() => ({
    Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
  }), [])

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })
    } catch { return dateStr }
  }

  const formatDateTime = (dateStr) => {
    if (!dateStr) return ''
    try {
      const d = new Date(dateStr)
      return d.toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' })
    } catch { return dateStr }
  }

  const buildDateFromParts = (date, time) => {
    if (!date || !time) return null
    try { return new Date(`${date}T${time}:00`) } catch { return null }
  }

  const isAvailableNow = (m) => {
    if (!m) return false
    if (m.is_ended) return false
    const start = buildDateFromParts(m.start_date, m.start_time)
    const end = buildDateFromParts(m.start_date, m.end_time)
    if (!start || !end) return false
    const now = new Date()
    return now >= start && now <= end
  }

  const fetchMatch = async () => {
    if (!id) return
    try {
      setLoading(true)
      setError('')
      const { data } = await baseUrl.get(`/api/leagues/matches/${id}`, { headers: authHeader })
      setMatchData(data?.data ?? data)
    } catch (e) {
      setError('فشل في جلب تفاصيل المباراة')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchMatch() }, [id, authHeader])

  const fetchQuestions = async () => {
    if (!id) return
    try {
      setQLoading(true)
      setQError('')
      const { data } = await baseUrl.get(`/api/leagues/matches/${id}/questions`, { headers: authHeader })
      // البيانات تأتي كمصفوفة مباشرة
      const list = Array.isArray(data) ? data : []
      setQuestions(list)
    } catch {
      setQError('فشل في جلب أسئلة المباراة')
    } finally {
      setQLoading(false)
    }
  }

  useEffect(() => { fetchQuestions() }, [id, authHeader])
  useEffect(() => {
    setStudentIndex((prev) => {
      if (!Array.isArray(questions) || questions.length === 0) return 0
      return Math.min(prev, Math.max(0, questions.length - 1))
    })
  }, [questions])

  const handleSelectOption = (questionId, letter) => {
    setSelectedAnswers(prev => ({ ...prev, [questionId]: letter }))
  }

  const handleSubmitAnswers = async () => {
    try {
      setSolveError('')
      setSubmittingSolve(true)
      const answers = questions
        .filter(q => selectedAnswers[q.id])
        .map(q => ({ question_id: q.id, selected_answer: selectedAnswers[q.id] }))
      if (answers.length === 0) {
        setSolveError('اختر إجابة واحدة على الأقل')
        setSubmittingSolve(false)
        return
      }
      await baseUrl.post(`/api/leagues/matches/${id}/solve`, { answers }, { headers: { ...authHeader, 'Content-Type': 'application/json' } })
      await fetchStudentResult()
    } catch {
      setSolveError('تعذر إرسال الإجابات')
    } finally {
      setSubmittingSolve(false)
    }
  }

  const fetchStudentResult = async () => {
    try {
      setResultLoading(true)
      setResultError('')
      const { data } = await baseUrl.get(`/api/leagues/matches/${id}/student-result`, { headers: authHeader })
      setResultData(data?.data ?? data)
    } catch {
      setResultError('تعذر جلب نتيجة الطالب')
    } finally {
      setResultLoading(false)
    }
  }

  const handleCreateBulk = async () => {
    if (!bulkText.trim()) return
    try {
      setCreatingBulk(true)
      const body = { text: bulkText }
      const { data } = await baseUrl.post(`/api/leagues/matches/${id}/questions/bulk`, body, { headers: { ...authHeader, 'Content-Type': 'application/json' } })
      const created = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : [])
      setQuestions(prev => [...created, ...prev])
      setBulkText('')
      setShowBulkForm(false)
    } catch {
      setQError('تعذر إضافة الأسئلة بالنص الحر')
    } finally {
      setCreatingBulk(false)
    }
  }

  const handleCreateSingle = async () => {
    if (!singleDraft.text.trim()) return
    try {
      setCreatingSingle(true)
      // تحضير البيانات - إزالة correct_answer إذا كان فارغاً
      const payload = { ...singleDraft }
      if (!payload.correct_answer || payload.correct_answer.trim() === '') {
        delete payload.correct_answer
      }
      const { data } = await baseUrl.post(`/api/leagues/matches/${id}/questions`, payload, { headers: { ...authHeader, 'Content-Type': 'application/json' } })
      const created = data?.data ?? data
      setQuestions(prev => [created, ...prev])
      setSingleDraft({ text: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_answer: '' })
      setShowSingleForm(false)
      await fetchQuestions() // إعادة جلب الأسئلة للتأكد من التحديث
    } catch {
      setQError('تعذر إضافة السؤال')
    } finally {
      setCreatingSingle(false)
    }
  }

  const startEdit = (q) => {
    setEditing({ 
      id: q.id, 
      text: q.text || '', 
      option_a: q.option_a || q.options?.[0] || '', 
      option_b: q.option_b || q.options?.[1] || '', 
      option_c: q.option_c || q.options?.[2] || '', 
      option_d: q.option_d || q.options?.[3] || '',
      correct_answer: q.correct_answer || ''
    })
  }

  const saveEdit = async () => {
    if (!editing) return
    try {
      setSavingEdit(true)
      const { id: qid, ...payload } = editing
      // إزالة correct_answer إذا كان فارغاً
      if (!payload.correct_answer || payload.correct_answer.trim() === '') {
        delete payload.correct_answer
      }
      const { data } = await baseUrl.put(`/api/leagues/questions/${qid}`, payload, { headers: { ...authHeader, 'Content-Type': 'application/json' } })
      const updated = data?.data ?? data
      setQuestions(prev => prev.map(q => q.id === qid ? { ...q, ...updated } : q))
      setEditing(null)
      await fetchQuestions() // إعادة جلب الأسئلة للتأكد من التحديث
    } catch {
      setQError('تعذر حفظ التعديلات')
    } finally {
      setSavingEdit(false)
    }
  }

  const handleDeleteQuestion = async () => {
    if (!deletingId) return
    try {
      setDeleting(true)
      await baseUrl.delete(`/api/leagues/questions/${deletingId}`, { headers: authHeader })
      setQuestions(prev => prev.filter(q => q.id !== deletingId))
      setDeletingId(null)
      await fetchQuestions() // إعادة جلب الأسئلة للتأكد من التحديث
    } catch {
      setQError('تعذر حذف السؤال')
    } finally {
      setDeleting(false)
    }
  }

  const handleUploadImage = async (qid, file) => {
    if (!file) return
    try {
      setUploadingId(qid)
      const form = new FormData()
      form.append('image', file)
      const { data } = await baseUrl.post(`/api/leagues/questions/${qid}/image`, form, { headers: { ...authHeader, 'Content-Type': 'multipart/form-data' } })
      const updated = data?.data ?? data
      setQuestions(prev => prev.map(q => q.id === qid ? { ...q, ...updated } : q))
    } catch {
      setQError('تعذر رفع الصورة')
    } finally {
      setUploadingId(null)
    }
  }

  const handleSetCorrect = async (qid, letter) => {
    try {
      setSettingCorrectId(qid)
      const body = { correct_answer: letter || null }
      const { data } = await baseUrl.post(`/api/leagues/questions/${qid}/correct-answer`, body, { headers: { ...authHeader, 'Content-Type': 'application/json' } })
      const updated = data?.data ?? data
      setQuestions(prev => prev.map(q => q.id === qid ? { ...q, ...updated } : q))
      await fetchQuestions() // إعادة جلب الأسئلة للتأكد من التحديث
    } catch {
      setQError('تعذر تحديد الإجابة الصحيحة')
    } finally {
      setSettingCorrectId(null)
    }
  }

  const handleUploadImages = async () => {
    if (!selectedImages || selectedImages.length === 0) return
    if (selectedImages.length > 10) {
      setQError('يمكن رفع حتى 10 صور فقط')
      return
    }
    try {
      setUploadingImages(true)
      const formData = new FormData()
      selectedImages.forEach((file) => {
        formData.append('images', file)
      })
      const { data } = await baseUrl.post(`/api/leagues/matches/${id}/questions/images`, formData, { 
        headers: { 
          ...authHeader,
          'Content-Type': 'multipart/form-data'
        } 
      })
      const created = Array.isArray(data?.questions) ? data.questions : []
      setQuestions(prev => [...created, ...prev])
      setSelectedImages([])
      setShowImageForm(false)
      await fetchQuestions() // إعادة جلب الأسئلة للتأكد من التحديث
    } catch {
      setQError('تعذر رفع الصور')
    } finally {
      setUploadingImages(false)
    }
  }

  if (loading) {
    return <BrandLoadingScreen />
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-[100px] pb-12 flex items-center justify-center" dir="rtl">
        <div className="bg-white dark:bg-gray-800 border border-red-200 dark:border-red-800 rounded-2xl p-6 max-w-md mx-4 shadow-lg">
          <div className="flex items-center justify-center flex-col gap-3">
            <span className="text-red-600 dark:text-red-400 font-semibold">{error}</span>
            <Link to="/leagues" className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium">
              العودة للدوريات
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!matchData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-[100px] pb-12 flex items-center justify-center" dir="rtl">
        <div className="text-center bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-lg">
          <h3 className="text-xl font-semibold text-slate-700 dark:text-gray-200 mb-4">المباراة غير موجودة</h3>
          <Link to="/leagues" className="inline-block px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium">
            العودة للدوريات
          </Link>
        </div>
      </div>
    )
  }

  const available = isAvailableNow(matchData)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-[72px]" dir="rtl">
      {/* Header - براند */}
      <div className="bg-white dark:bg-gray-800 backdrop-blur-sm border-b border-slate-200 dark:border-gray-700 sticky top-[72px] z-40">
        <div className="h-1 w-full bg-gradient-to-r from-blue-500 to-orange-500" />
        <div className="max-w-6xl mx-auto px-4 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 space-x-reverse">
              <Link to={`/league/${matchData.league_id}`} className="p-2 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition-colors" title="عودة للدوري">
                <svg className="w-6 h-6 text-slate-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div className="w-11 h-11 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">{matchData.name}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${available ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-700 border border-slate-200'}`}>
                    {available ? 'متاحة الآن' : 'غير متاحة'}
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${matchData.is_visible ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'bg-gray-100 text-gray-700 border border-gray-200'}`}>
                    {matchData.is_visible ? 'ظاهرة للطلاب' : 'مخفية'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 backdrop-blur-sm border border-slate-200 dark:border-gray-700 rounded-2xl shadow-md overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-blue-500 to-orange-500" />
          {/* Image Section */}
          <div className="relative h-[260px] md:h-[360px] overflow-hidden">
            {matchData.image_url ? (
              <img src={matchData.image_url} alt={matchData.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-blue-100 to-orange-100 dark:from-blue-900/30 dark:to-orange-900/30 flex items-center justify-center">
                <svg className="w-14 h-14 text-blue-300 dark:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
            )}

            {/* Badges */}
            <div className="absolute top-4 left-4 space-y-2">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm ${available ? 'bg-emerald-500/90 text-white' : 'bg-slate-500/90 text-white'}`}>
                {available ? 'متاحة الآن' : 'غير متاحة'}
              </span>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm ${matchData.is_visible ? 'bg-blue-500/90 text-white' : 'bg-gray-500/90 text-white'}`}>
                {matchData.is_visible ? 'ظاهرة' : 'مخفية'}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 md:p-8">
            {matchData.description && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-slate-700 mb-2">الوصف</h3>
                <p className="text-slate-600 leading-relaxed">{matchData.description}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-50/80 rounded-xl p-4">
                <div className="text-sm text-slate-500 mb-1">تاريخ المباراة</div>
                <div className="text-base font-semibold text-slate-800">{formatDate(matchData.start_date)}</div>
              </div>
              <div className="bg-slate-50/80 rounded-xl p-4">
                <div className="text-sm text-slate-500 mb-1">الوقت</div>
                <div className="text-base font-semibold text-slate-800">{matchData.start_time} → {matchData.end_time}</div>
              </div>
              <div className="bg-slate-50/80 rounded-xl p-4">
                <div className="text-sm text-slate-500 mb-1">الحالة</div>
                <div className="text-base font-semibold text-slate-800">{matchData.is_ended ? 'منتهية' : (available ? 'متاحة الآن' : 'غير متاحة')}</div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-50/60 rounded-xl p-4">
                <div className="text-xs text-slate-500 mb-1">أُنشئت في</div>
                <div className="text-sm text-slate-700">{formatDateTime(matchData.created_at)}</div>
              </div>
              <div className="bg-slate-50/60 rounded-xl p-4">
                <div className="text-xs text-slate-500 mb-1">آخر تحديث</div>
                <div className="text-sm text-slate-700">{formatDateTime(matchData.updated_at)}</div>
              </div>
            </div>

            <div className="mt-8 flex items-center gap-3">
              <Link to={`/league/${matchData.league_id}`} className="px-5 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-white">
                العودة للدوري
              </Link>
              {available && matchData.is_visible && !matchData.is_ended && (
                <button className="px-6 py-2 bg-gradient-to-r from-blue-500 to-orange-500 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                  ابدأ الآن
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Questions Section */}
        <div className="mt-8 bg-white/70 backdrop-blur-sm border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200/60 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800">أسئلة المباراة ({questions.length})</h2>
            {(isAdmin || isTeacher) && (
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setShowBulkForm(v => !v)} 
                  className="px-3 py-1.5 bg-blue-500 text-white rounded-xl text-sm hover:bg-blue-600"
                >
                  إضافة نص حر
                </button>
                <button 
                  onClick={() => setShowSingleForm(v => !v)} 
                  className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700"
                >
                  إضافة سؤال
                </button>
                <button 
                  onClick={() => setShowImageForm(v => !v)} 
                  className="px-3 py-1.5 bg-orange-500 text-white rounded-xl text-sm hover:bg-orange-600"
                >
                  إضافة صور
                </button>
              </div>
            )}
          </div>
          <div className="p-6">
            {qError && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">{qError}</div>
            )}

            {qLoading ? (
              <div className="text-center py-8">جارِ تحميل الأسئلة...</div>
            ) : (
              <>
                {(isAdmin || isTeacher) && (
                  <>
                    {showBulkForm && (
                      <div className="mb-6">
                    <label className="block text-sm font-medium text-slate-700 mb-2">أدخل النص (سطر للسؤال، والأسطر التالية للاختيارات A-D)</label>
                    <textarea
                      value={bulkText}
                      onChange={(e) => setBulkText(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={6}
                      placeholder={"السؤال الأول؟\nA) الخيار الأول\nB) الخيار الثاني\nC) الخيار الثالث\nD) الخيار الرابع\n\nالسؤال الثاني؟\nA) الخيار الأول\nB) الخيار الثاني\nC) الخيار الثالث\nD) الخيار الرابع"}
                    />
                    <div className="mt-3 flex items-center justify-end gap-2">
                      <button onClick={() => setShowBulkForm(false)} className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700">إلغاء</button>
                      <button onClick={handleCreateBulk} disabled={creatingBulk} className="px-5 py-2 bg-blue-500 text-white rounded-xl disabled:opacity-50 hover:bg-blue-600">
                        {creatingBulk ? 'جارٍ الإضافة...' : 'إضافة'}
                      </button>
                    </div>
                  </div>
                )}

                {showSingleForm && (
                  <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1">نص السؤال</label>
                      <textarea
                        value={singleDraft.text}
                        onChange={(e) => setSingleDraft(prev => ({ ...prev, text: e.target.value }))}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        rows={3}
                        placeholder="اكتب نص السؤال هنا"
                      />
                    </div>
                    {(['option_a','option_b','option_c','option_d']).map((key, i) => (
                      <div key={key}>
                        <label className="block text-sm font-medium text-slate-700 mb-1">خيار {String.fromCharCode(65 + i)}</label>
                        <input
                          value={singleDraft[key]}
                          onChange={(e) => setSingleDraft(prev => ({ ...prev, [key]: e.target.value }))}
                          className="w-full px-4 py-3 border border-slate-300 rounded-xl bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          placeholder={`اكتب خيار ${String.fromCharCode(65 + i)}`}
                        />
                      </div>
                    ))}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1">الإجابة الصحيحة (اختياري)</label>
                      <select
                        value={singleDraft.correct_answer}
                        onChange={(e) => setSingleDraft(prev => ({ ...prev, correct_answer: e.target.value }))}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="">-- اختر الإجابة الصحيحة --</option>
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="C">C</option>
                        <option value="D">D</option>
                      </select>
                    </div>
                    <div className="md:col-span-2 flex items-center justify-end gap-2">
                      <button onClick={() => setShowSingleForm(false)} className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700">إلغاء</button>
                      <button onClick={handleCreateSingle} disabled={creatingSingle} className="px-5 py-2 bg-emerald-600 text-white rounded-lg disabled:opacity-50">{creatingSingle ? 'جارٍ الإضافة...' : 'إضافة السؤال'}</button>
                    </div>
                  </div>
                )}

                {showImageForm && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-slate-700 mb-2">اختر الصور (حتى 10 صور)</label>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => {
                        const files = Array.from(e.target.files || [])
                        if (files.length > 10) {
                          setQError('يمكن رفع حتى 10 صور فقط')
                          return
                        }
                        setSelectedImages(files)
                      }}
                      className="w-full px-4 py-3 border border-slate-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    {selectedImages.length > 0 && (
                      <div className="mt-3">
                        <div className="text-sm text-slate-600 mb-2">الصور المحددة: {selectedImages.length}</div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {selectedImages.map((file, idx) => (
                            <div key={idx} className="relative">
                              <img src={URL.createObjectURL(file)} alt={`Preview ${idx + 1}`} className="w-full h-24 object-cover rounded-lg border border-slate-200" />
                              <button
                                onClick={() => setSelectedImages(prev => prev.filter((_, i) => i !== idx))}
                                className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="mt-3 flex items-center justify-end gap-2">
                      <button onClick={() => { setShowImageForm(false); setSelectedImages([]); }} className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700">إلغاء</button>
                      <button onClick={handleUploadImages} disabled={uploadingImages || selectedImages.length === 0} className="px-5 py-2 bg-orange-500 text-white rounded-xl disabled:opacity-50 hover:bg-orange-600">
                        {uploadingImages ? 'جارٍ الرفع...' : 'رفع الصور'}
                      </button>
                    </div>
                  </div>
                )}

                {questions.length === 0 && !showBulkForm && !showSingleForm && !showImageForm && (
                  <div className="text-center text-slate-600 py-8">لا توجد أسئلة حتى الآن</div>
                )}

                {questions.length > 0 && (
                  <div className="grid grid-cols-1 gap-4 mt-6">
                    {questions.map((q) => {
                      const options = [q.option_a ?? q.options?.[0], q.option_b ?? q.options?.[1], q.option_c ?? q.options?.[2], q.option_d ?? q.options?.[3]]
                      return (
                        <div key={q.id} className="bg-white/60 border border-slate-200 rounded-xl p-4">
                          {editing?.id === q.id ? (
                            <div className="space-y-3">
                              <textarea value={editing.text} onChange={(e) => setEditing(prev => ({ ...prev, text: e.target.value }))} className="w-full px-3 py-2 border border-slate-300 rounded-lg" rows={3} />
                              {(['option_a','option_b','option_c','option_d']).map((k, idx) => (
                                <div key={k} className="grid grid-cols-[36px_1fr] items-center gap-2">
                                  <div className="text-sm font-semibold text-slate-600">{String.fromCharCode(65+idx)})</div>
                                  <input value={editing[k]} onChange={(e) => setEditing(prev => ({ ...prev, [k]: e.target.value }))} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                                </div>
                              ))}
                              <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">الإجابة الصحيحة (اختياري)</label>
                                <select
                                  value={editing.correct_answer || ''}
                                  onChange={(e) => setEditing(prev => ({ ...prev, correct_answer: e.target.value }))}
                                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                >
                                  <option value="">-- اختر الإجابة الصحيحة --</option>
                                  <option value="A">A</option>
                                  <option value="B">B</option>
                                  <option value="C">C</option>
                                  <option value="D">D</option>
                                </select>
                              </div>
                              <div className="flex items-center justify-end gap-2">
                                <button onClick={() => setEditing(null)} className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700">إلغاء</button>
                                <button onClick={saveEdit} disabled={savingEdit} className="px-5 py-2 bg-blue-500 text-white rounded-xl disabled:opacity-50 hover:bg-blue-600">{savingEdit ? 'جارٍ الحفظ...' : 'حفظ'}</button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1">
                                  <p className="text-slate-800 font-medium mb-2 whitespace-pre-wrap">{q.text}</p>
                                  <div className="space-y-2">
                                    {options.map((opt, idx) => {
                                      const letter = String.fromCharCode(65+idx)
                                      return (
                                        <div key={idx} className={`px-3 py-2 rounded-lg border text-sm ${(isAdmin || isTeacher) && q.correct_answer && q.correct_answer === letter ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                                          <span className="font-semibold mr-2">{letter})</span>
                                          <span>{opt}</span>
                                        </div>
                                      )
                                    })}
                                  </div>
                                  {q.image && (
                                    <div className="mt-3">
                                      <img src={q.image} alt="question" className="max-h-48 rounded-lg border border-slate-200" />
                                    </div>
                                  )}
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                  <button onClick={() => startEdit(q)} className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-200 rounded-xl text-sm hover:bg-blue-100 dark:hover:bg-blue-900/50">تعديل</button>
                                  <button onClick={() => setDeletingId(q.id)} className="px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-sm hover:bg-red-100">حذف</button>
                                  <label className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-sm hover:bg-slate-200 cursor-pointer">
                                    رفع صورة
                                    <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUploadImage(q.id, f); e.target.value=''; }} style={{ display: 'none' }} />
                                  </label>
                                  <div className="mt-1 text-xs text-slate-500">الإجابة الصحيحة</div>
                                  <div className="grid grid-cols-4 gap-1">
                                    {['A','B','C','D'].map(letter => (
                                      <button key={letter} onClick={() => handleSetCorrect(q.id, letter)} disabled={settingCorrectId===q.id} className={`px-2 py-1 rounded-md text-xs ${q.correct_answer === letter ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'}`}>{letter}</button>
                                    ))}
                                    <button onClick={() => handleSetCorrect(q.id, null)} disabled={settingCorrectId===q.id} className="px-2 py-1 rounded-md text-xs bg-slate-100 text-slate-600">مسح</button>
                                  </div>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      {/* Student view section */}
      {!qLoading && !(isAdmin || isTeacher) && (
        <div className="mt-8 bg-white/70 backdrop-blur-sm border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6">
            <div className="max-w-3xl mx-auto space-y-4">
                {resultLoading ? (
                  <div className="text-center py-8">جارِ تحميل النتيجة...</div>
                ) : resultData ? (
                  <div className="bg-white/70 border border-slate-200 rounded-2xl shadow p-6">
                    <h3 className="text-xl font-bold text-slate-800 mb-4">نتيجة المباراة</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                      <div className="bg-slate-50 rounded-xl p-3 text-center">
                        <div className="text-sm text-slate-500">النقاط</div>
                        <div className="text-lg font-semibold text-slate-800">{resultData.score}</div>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-3 text-center">
                        <div className="text-sm text-slate-500">عدد الأسئلة</div>
                        <div className="text-lg font-semibold text-slate-800">{resultData.total_questions}</div>
                      </div>
                      <div className="bg-emerald-50 rounded-xl p-3 text-center border border-emerald-200">
                        <div className="text-sm text-emerald-700">إجابات صحيحة</div>
                        <div className="text-lg font-semibold text-emerald-800">{resultData.correct_answers}</div>
                      </div>
                      <div className="bg-red-50 rounded-xl p-3 text-center border border-red-200">
                        <div className="text-sm text-red-700">إجابات خاطئة</div>
                        <div className="text-lg font-semibold text-red-800">{resultData.wrong_answers}</div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      {Array.isArray(resultData.answers) && resultData.answers.map((a) => (
                        <div key={a.question_id} className="bg-white/60 border border-slate-200 rounded-xl p-4">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-medium text-slate-800">{a.question_text}</p>
                            <span className={`px-2 py-1 rounded-md text-xs font-semibold ${a.is_correct ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-red-100 text-red-700 border border-red-200'}`}>{a.is_correct ? 'صحيح' : 'خطأ'}</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {(a.options || []).map((opt, idx) => {
                              const letter = String.fromCharCode(65 + idx)
                              const isSelected = a.selected_answer === letter
                              const isCorrect = a.correct_answer === letter
                              return (
                                <div key={idx} className={`px-3 py-2 rounded-lg border text-sm ${isCorrect ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : isSelected ? 'bg-slate-100 border-slate-300 text-slate-800' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                                  <span className="font-semibold mr-2">{letter})</span>
                                  <span>{opt}</span>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  (() => {
                    const answeredCount = questions.filter(qq => !!selectedAnswers[qq.id]).length
                    const total = questions.length
                    const allAnswered = total > 0 && answeredCount === total
                    const progress = total > 0 ? Math.round((answeredCount / total) * 100) : 0
                    const q = questions[studentIndex]
                    const options = [q.option_a ?? q.options?.[0], q.option_b ?? q.options?.[1], q.option_c ?? q.options?.[2], q.option_d ?? q.options?.[3]]
                    const currentSelected = selectedAnswers[q.id]
                    return (
                      <>
                        {/* Progress header (enhanced) */}
                        <div className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-2xl p-5 shadow-sm">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-sm text-slate-600">تمت الإجابة</div>
                              <div className="text-base font-semibold text-slate-800">{answeredCount} من {total}</div>
                            </div>
                            <div className="relative w-14 h-14 rounded-full bg-slate-200 overflow-hidden">
                              <div className="absolute inset-0" style={{ background: `conic-gradient(#6366f1 ${progress}%, #e5e7eb ${progress}%)` }}></div>
                              <div className="absolute inset-1 bg-white rounded-full flex items-center justify-center text-xs font-bold text-slate-700">{progress}%</div>
                            </div>
                          </div>
                          {/* Quick nav */}
                          <div className="mt-4 flex flex-wrap gap-2">
                            {questions.map((qq, idx) => {
                              const isCurrent = idx === studentIndex
                              const isAnswered = !!selectedAnswers[qq.id]
                              return (
                                <button key={qq.id} onClick={() => setStudentIndex(idx)} className={`w-8 h-8 rounded-lg text-xs font-semibold border transition-all flex items-center justify-center ${isCurrent ? 'bg-blue-500 text-white border-blue-500 shadow' : isAnswered ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-700' : 'bg-white dark:bg-gray-800 text-slate-700 dark:text-gray-200 border-slate-300 dark:border-gray-600 hover:bg-slate-50 dark:hover:bg-gray-700'}`}>
                                  {isAnswered ? (
                                    <svg className={`w-4 h-4 ${isCurrent ? 'text-white' : 'text-emerald-600'}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4A1 1 0 014.707 9.293L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                                  ) : (
                                    idx + 1
                                  )}
                                </button>
                              )
                            })}
                          </div>
                        </div>

                        {/* Question card (enhanced) */}
                        <div className="bg-white/70 backdrop-blur-sm border border-slate-200 rounded-2xl shadow p-6">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">سؤال {studentIndex + 1}</h3>
                            <span className="text-xs md:text-sm text-slate-500">{studentIndex + 1} / {total}</span>
                          </div>
                          <p className="text-slate-800 font-medium leading-relaxed mb-4 whitespace-pre-wrap">{q.text}</p>
                          {q.image && (
                            <div className="mb-4 overflow-hidden rounded-xl border border-slate-200">
                              <img src={q.image} alt="question" className="max-h-64 w-full object-contain bg-slate-50" />
                            </div>
                          )}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {options.map((opt, idx) => {
                              const letter = String.fromCharCode(65 + idx)
                              const isSelected = currentSelected === letter
                              return (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => handleSelectOption(q.id, letter)}
                                  className={`group text-right px-4 py-3 rounded-xl border text-sm transition-all flex items-center justify-between hover:-translate-y-0.5 ${isSelected ? 'bg-gradient-to-r from-blue-50 to-orange-50 dark:from-blue-900/20 dark:to-orange-900/20 border-blue-300 dark:border-blue-600 text-blue-900 dark:text-blue-100 ring-2 ring-blue-300 dark:ring-blue-600 shadow' : 'bg-white dark:bg-gray-800 border-slate-200 dark:border-gray-600 text-slate-800 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-gray-700'}`}
                                >
                                  <span className="flex items-start gap-3">
                                    <span className={`mt-0.5 inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold border ${isSelected ? 'bg-blue-500 text-white border-blue-500' : 'bg-slate-100 dark:bg-gray-700 text-slate-700 dark:text-gray-300 border-slate-200 dark:border-gray-600 group-hover:bg-slate-200 dark:group-hover:bg-gray-600'}`}>{letter}</span>
                                    <span className="leading-6">{opt}</span>
                                  </span>
                                  {isSelected ? (
                                    <svg className="w-5 h-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4A1 1 0 014.707 9.293L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                                  ) : (
                                    <span className="w-5 h-5 rounded-full border border-slate-300"></span>
                                  )}
                                </button>
                              )
                            })}
                          </div>
                          {solveError && (
                            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-2 text-sm text-red-700">{solveError}</div>
                          )}
                          {/* Sticky action bar */}
                          <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between">
                            <button onClick={() => setStudentIndex((i) => Math.max(0, i - 1))} disabled={studentIndex === 0} className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 disabled:opacity-50 hover:bg-white">السابق</button>
                            <div className="flex items-center gap-2">
                              <button onClick={() => setStudentIndex((i) => Math.min(total - 1, i + 1))} disabled={studentIndex >= total - 1} className="px-4 py-2 rounded-xl bg-slate-200 text-slate-900 disabled:opacity-50 hover:bg-slate-300">التالي</button>
                              {allAnswered && (
                                <button onClick={handleSubmitAnswers} disabled={submittingSolve} className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-orange-500 text-white font-medium shadow-lg hover:shadow-xl disabled:opacity-50">
                                  {submittingSolve ? 'جارِ الإرسال...' : 'إرسال الإجابات'}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </>
                    )
                  })()
                )}
                {resultError && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">{resultError}</div>
                )}
            </div>
          </div>
        </div>
      )}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[100px]">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeletingId(null)} />
          <div className="relative bg-white/95 backdrop-blur-sm w-full max-w-md rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
            <div className="bg-gradient-to-r from-red-600 to-pink-600 px-6 py-4 text-white">
              <h3 className="text-lg font-bold">تأكيد حذف السؤال</h3>
            </div>
            <div className="px-6 py-5 text-slate-700">هل أنت متأكد من حذف هذا السؤال؟ هذا الإجراء لا يمكن التراجع عنه.</div>
            <div className="bg-slate-50/50 px-6 py-4 border-t border-slate-200/50 flex items-center justify-end gap-3">
              <button onClick={() => setDeletingId(null)} className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-white">إلغاء</button>
              <button onClick={handleDeleteQuestion} disabled={deleting} className="px-6 py-2 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-lg font-medium shadow-lg hover:shadow-xl disabled:opacity-50">
                {deleting ? 'جارٍ الحذف...' : 'حذف نهائي'}
              </button>
            </div>
          </div>
        </div>
      )}
      <ScrollToTop/>
    </div>
  )
}

export default Match