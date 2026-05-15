import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useState } from 'react'
import { pollsApi } from '@/api/polls.api'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import {
  IconArrowLeft,
  IconPlus,
  IconTrash,
  IconLoader2,
  IconCheck,
} from '@tabler/icons-react'

export const Route = createFileRoute('/_authenticated/polls/create')({
  component: CreatePollPage,
})

interface QuestionDraft {
  id: string
  text: string
  isMandatory: boolean
  options: string[]
}

const newQuestion = (): QuestionDraft => ({
  id: crypto.randomUUID(),
  text: '',
  isMandatory: true,
  options: ['', ''],
})

// ── Shared input class ────────────────────────────────────────
const inputCls =
  'w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-700 transition-colors'

function CreatePollPage() {
  const navigate = useNavigate()
  const [questions, setQuestions] = useState<QuestionDraft[]>([newQuestion()])

  const mutation = useMutation({
    mutationFn: pollsApi.create,
    onSuccess: () => {
      toast.success('Poll created')
      navigate({ to: '/dashboard' })
    },
    onError: () => toast.error('Failed to create poll'),
  })

  const form = useForm({
    defaultValues: { title: '', description: '', isAnonymous: false, expiresAt: '' },
    onSubmit: async ({ value }) => {
      if (!value.title.trim()) return toast.error('Poll title is required')
      if (!value.expiresAt) return toast.error('Expiry date is required')

      for (const q of questions) {
        if (!q.text.trim()) return toast.error('All questions must have text')
        if (q.options.filter((o) => o.trim()).length < 2)
          return toast.error('Each question needs at least 2 options')
      }

      mutation.mutate({
        title: value.title,
        description: value.description || undefined,
        isAnonymous: value.isAnonymous,
        expiresAt: new Date(value.expiresAt).toISOString(),
        questions: questions.map((q) => ({
          text: q.text,
          isMandatory: q.isMandatory,
          options: q.options.filter((o) => o.trim()),
        })),
      })
    },
  })

  const addQuestion = () => setQuestions((p) => [...p, newQuestion()])
  const removeQuestion = (id: string) => {
    if (questions.length === 1) return toast.error('At least one question required')
    setQuestions((p) => p.filter((q) => q.id !== id))
  }
  const updateQuestion = (id: string, updates: Partial<QuestionDraft>) =>
    setQuestions((p) => p.map((q) => (q.id === id ? { ...q, ...updates } : q)))
  const addOption = (qId: string) =>
    setQuestions((p) => p.map((q) => (q.id === qId ? { ...q, options: [...q.options, ''] } : q)))
  const removeOption = (qId: string, idx: number) =>
    setQuestions((p) =>
      p.map((q) => (q.id === qId ? { ...q, options: q.options.filter((_, i) => i !== idx) } : q)),
    )
  const updateOption = (qId: string, idx: number, val: string) =>
    setQuestions((p) =>
      p.map((q) =>
        q.id === qId ? { ...q, options: q.options.map((o, i) => (i === idx ? val : o)) } : q,
      ),
    )

  const minDate = new Date(Date.now() + 60_000).toISOString().slice(0, 16)

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-6 py-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 text-zinc-600 hover:text-white transition-colors text-sm mb-5"
          >
            <IconArrowLeft size={14} />
            Dashboard
          </Link>
          <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-600 mb-1">New</p>
          <h1 className="text-3xl font-bold text-white tracking-tight">Create Poll</h1>
          <p className="text-zinc-500 text-sm mt-1">Configure your poll and add questions.</p>
        </motion.div>

        <form
          onSubmit={(e) => { e.preventDefault(); form.handleSubmit() }}
          className="space-y-6"
        >
          {/* ── Poll details card ── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="bg-zinc-950 border border-zinc-800/80 rounded-2xl overflow-hidden"
          >
            <div className="h-px bg-linear-to-r from-transparent via-red-800/40 to-transparent" />
            <div className="p-6 space-y-5">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-600">Poll details</span>
              </div>

              {/* Title */}
              <form.Field name="title">
                {(field) => (
                  <div className="space-y-1.5">
                    <label className="text-xs text-zinc-500 uppercase tracking-wider">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="What's your poll about?"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                )}
              </form.Field>

              {/* Description */}
              <form.Field name="description">
                {(field) => (
                  <div className="space-y-1.5">
                    <label className="text-xs text-zinc-500 uppercase tracking-wider">
                      Description <span className="text-zinc-700">optional</span>
                    </label>
                    <textarea
                      placeholder="Give respondents some context…"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      rows={2}
                      className={`${inputCls} resize-none`}
                    />
                  </div>
                )}
              </form.Field>

              {/* Expires at */}
              <form.Field name="expiresAt">
                {(field) => (
                  <div className="space-y-1.5">
                    <label className="text-xs text-zinc-500 uppercase tracking-wider">
                      Closes at <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      min={minDate}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className={`${inputCls} [color-scheme:dark]`}
                    />
                  </div>
                )}
              </form.Field>

              {/* Anonymous toggle */}
              <form.Field name="isAnonymous">
                {(field) => (
                  <button
                    type="button"
                    onClick={() => field.handleChange(!field.state.value)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-colors ${
                      field.state.value
                        ? 'bg-red-950/20 border-red-900/50 text-white'
                        : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <div className="text-left">
                      <p className="text-sm font-medium">Anonymous responses</p>
                      <p className="text-xs text-zinc-600 mt-0.5">Respondents don't need to log in</p>
                    </div>
                    <div className={`w-9 h-5 rounded-full border flex items-center transition-colors px-0.5 ${
                      field.state.value ? 'bg-red-600 border-red-500 justify-end' : 'bg-zinc-800 border-zinc-700 justify-start'
                    }`}>
                      <div className="w-3.5 h-3.5 rounded-full bg-white shadow" />
                    </div>
                  </button>
                )}
              </form.Field>
            </div>
          </motion.div>

          {/* ── Questions ── */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-600">Questions</span>
              <div className="flex-1 h-px bg-zinc-900" />
              <span className="text-xs text-zinc-700">{questions.length}</span>
            </div>

            <AnimatePresence initial={false}>
              {questions.map((q, qi) => (
                <motion.div
                  key={q.id}
                  initial={{ opacity: 0, y: 10, scale: 0.99 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.15 } }}
                  transition={{ delay: qi * 0.04 }}
                  className="bg-zinc-950 border border-zinc-800/80 rounded-2xl overflow-hidden"
                >
                  <div className="h-px bg-linear-to-r from-transparent via-zinc-800/60 to-transparent" />
                  <div className="p-5 space-y-4">
                    {/* Question header */}
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
                        <span className="text-[10px] font-mono text-zinc-500">{String(qi + 1).padStart(2, '0')}</span>
                      </div>
                      <span className="text-xs text-zinc-600 uppercase tracking-wider flex-1">Question</span>
                      <button
                        type="button"
                        onClick={() => removeQuestion(q.id)}
                        className="p-1.5 rounded-lg text-zinc-700 hover:text-red-400 hover:bg-red-950/20 transition-colors"
                      >
                        <IconTrash size={14} />
                      </button>
                    </div>

                    {/* Question text */}
                    <input
                      type="text"
                      placeholder="Ask something…"
                      value={q.text}
                      onChange={(e) => updateQuestion(q.id, { text: e.target.value })}
                      className={inputCls}
                    />

                    {/* Mandatory toggle */}
                    <button
                      type="button"
                      onClick={() => updateQuestion(q.id, { isMandatory: !q.isMandatory })}
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs transition-colors ${
                        q.isMandatory
                          ? 'bg-red-950/20 border-red-900/50 text-red-400'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                      }`}
                    >
                      <div className={`w-3 h-3 rounded border flex items-center justify-center transition-colors ${
                        q.isMandatory ? 'bg-red-600 border-red-500' : 'border-zinc-600'
                      }`}>
                        {q.isMandatory && <IconCheck size={8} className="text-white" />}
                      </div>
                      Required
                    </button>

                    {/* Options */}
                    <div className="space-y-2 pt-1">
                      <p className="text-[10px] uppercase tracking-wider text-zinc-700">Options</p>
                      <AnimatePresence initial={false}>
                        {q.options.map((opt, oi) => (
                          <motion.div
                            key={oi}
                            initial={{ opacity: 0, x: -6 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -6 }}
                            className="flex gap-2 items-center"
                          >
                            <div className="w-5 h-5 rounded-full border border-zinc-800 shrink-0 flex items-center justify-center">
                              <span className="text-[9px] text-zinc-700 font-mono">
                                {String.fromCharCode(65 + oi)}
                              </span>
                            </div>
                            <input
                              type="text"
                              placeholder={`Option ${oi + 1}`}
                              value={opt}
                              onChange={(e) => updateOption(q.id, oi, e.target.value)}
                              className={inputCls}
                            />
                            {q.options.length > 2 && (
                              <button
                                type="button"
                                onClick={() => removeOption(q.id, oi)}
                                className="p-1.5 shrink-0 rounded-lg text-zinc-700 hover:text-red-400 hover:bg-red-950/20 transition-colors"
                              >
                                <IconTrash size={13} />
                              </button>
                            )}
                          </motion.div>
                        ))}
                      </AnimatePresence>

                      <button
                        type="button"
                        onClick={() => addOption(q.id)}
                        className="flex items-center gap-2 text-xs text-zinc-600 hover:text-zinc-300 transition-colors mt-1 px-1"
                      >
                        <IconPlus size={12} />
                        Add option
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Add question */}
            <button
              type="button"
              onClick={addQuestion}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border border-dashed border-zinc-800 text-zinc-600 hover:text-zinc-300 hover:border-zinc-700 transition-colors text-sm"
            >
              <IconPlus size={15} />
              Add question
            </button>
          </div>

          {/* Submit */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-center justify-between pt-2"
          >
            <Link to="/dashboard">
              <Button
                type="button"
                variant="ghost"
                className="text-zinc-600 hover:text-white hover:bg-zinc-900 rounded-xl"
              >
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={mutation.isPending}
              className="bg-red-600 hover:bg-red-500 text-white px-8 rounded-xl gap-2"
            >
              {mutation.isPending ? (
                <>
                  <IconLoader2 size={15} className="animate-spin" />
                  Creating…
                </>
              ) : (
                <>
                  <IconCheck size={15} />
                  Create poll
                </>
              )}
            </Button>
          </motion.div>
        </form>
      </div>
    </div>
  )
}