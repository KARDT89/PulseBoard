import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation } from '@tanstack/react-query'
import { motion} from 'framer-motion'
import { toast } from 'sonner'
import { useState, useEffect } from 'react'
import { pollsApi } from '@/api/polls.api'
import { useAuth } from '@/api/auth-context'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  IconClock,
  IconLoader2,
  IconLock,
  IconCheck,
  IconAlertTriangle,
} from '@tabler/icons-react'
import { formatDistanceToNow } from 'date-fns'
import { socket } from '@/lib/socket'
import { IconUser } from '@tabler/icons-react'

export const Route = createFileRoute('/polls/$pollId')({
  component: RespondPollPage,
})

function RespondPollPage() {
  const { pollId } = Route.useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [totalResponses, setTotalResponses] = useState<number | null>(null)
const [viewers, setViewers] = useState<number>(1)

useEffect(() => {
  socket.emit('join-poll', pollId)

  socket.on('new-response', (data) => {
    setTotalResponses(data.totalResponses)
  })

  socket.on('viewers-update', (data) => {
    setViewers(data.count)
  })

  return () => {
    socket.emit('leave-poll', pollId)
    socket.off('new-response')
    socket.off('viewers-update')
  }
}, [pollId])

  const { data, isLoading, error } = useQuery({
    queryKey: ['poll', pollId],
   queryFn: () => pollsApi.getById(pollId).then(r => ({ poll: r.data.data })),

  })

  const mutation = useMutation({
    mutationFn: () =>
      pollsApi.respond(pollId, {
        answers: Object.entries(answers).map(([questionId, optionId]) => ({
          questionId,
          optionId,
        })),
      }),
    onSuccess: () => {
      setSubmitted(true)
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Submission failed.')
    },
  })

  const handleSubmit = () => {
    if (!data?.poll) return
    const mandatoryIds = data.poll.questions
      .filter((q: any) => q.isMandatory)
      .map((q: any) => q.id)

    const unanswered = mandatoryIds.filter((id: string) => !answers[id])
    if (unanswered.length > 0) {
      toast.error('Please answer all mandatory questions.')
      return
    }
    mutation.mutate()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <IconLoader2 className="animate-spin text-zinc-600" size={24} />
      </div>
    )
  }

  if (error || !data?.poll) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-zinc-500 text-sm">Poll not found.</p>
        </div>
      </div>
    )
  }

  const poll = data.poll
  console.log(poll)
  const isExpired = new Date() > new Date(poll.expiresAt)
  const requiresAuth = !poll.isAnonymous && !user

  // Submitted state
  if (submitted) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-sm"
        >
          <div className="w-16 h-16 rounded-full bg-red-950 border border-red-900 flex items-center justify-center mx-auto mb-6">
            <IconCheck size={28} className="text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Response submitted</h2>
          <p className="text-zinc-500 text-sm">Thanks for your feedback.</p>
          {poll.isPublished && (
            <Button
              onClick={() => navigate({ to: '/polls/$pollId/results', params: { pollId: poll.id } })}
              className="mt-6 bg-zinc-800 hover:bg-zinc-700 text-white"
            >
              View results
            </Button>
          )}
        </motion.div>
      </div>
    )
  }

  if (poll.isPublished) {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-8">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-6">
          <IconCheck size={28} className="text-zinc-500" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Results are in</h2>
        <p className="text-zinc-500 text-sm mb-6">This poll has been closed and results are published.</p>
        <Button
          onClick={() => navigate({ to: '/polls/$pollId/results', params: { pollId: pollId } })}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          View results
        </Button>
      </div>
    </div>
  )
}

  // Expired state
  if (isExpired) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-8">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-6">
            <IconAlertTriangle size={28} className="text-zinc-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Poll expired</h2>
          <p className="text-zinc-500 text-sm">This poll is no longer accepting responses.</p>
        </div>
      </div>
    )
  }

  // Auth required state
  if (requiresAuth) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-8">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-6">
            <IconLock size={28} className="text-zinc-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Login required</h2>
          <p className="text-zinc-500 text-sm mb-6">This poll requires authentication.</p>
          <Button
            onClick={() => navigate({ to: '/login' })}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Sign in to respond
          </Button>
        </div>
      </div>
    )
  }

  const answeredCount = Object.keys(answers).length
  const totalMandatory = poll.questions.filter((q: any) => q.isMandatory).length
  const progress = totalMandatory > 0 ? (
    poll.questions.filter((q: any) => q.isMandatory && answers[q.id]).length / totalMandatory
  ) : 1

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="border-b border-zinc-900 px-6 py-4">
        <div className="flex items-center gap-4 text-xs">
  <div className="flex items-center gap-1.5 text-zinc-500">
    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
    <span>{viewers} viewing</span>
  </div>
  <div className="flex items-center gap-1.5 text-zinc-500">
    <IconClock size={12} />
    Closes {formatDistanceToNow(new Date(poll.expiresAt), { addSuffix: true })}
  </div>
  {totalResponses !== null && (
    <div className="flex items-center gap-1.5 text-zinc-500">
      <IconUser size={12} />
      {totalResponses} responses
    </div>
  )}
</div>
      </div>

      {/* Progress bar */}
      <div className="h-0.5 bg-zinc-900">
        <motion.div
          className="h-full bg-red-600"
          initial={{ width: 0 }}
          animate={{ width: `${progress * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Poll header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <div className="flex items-center gap-2 mb-4">
            {poll.isAnonymous ? (
              <Badge className="bg-zinc-900 text-zinc-400 border-zinc-800 text-[10px] tracking-wider uppercase">
                Anonymous
              </Badge>
            ) : (
              <Badge className="bg-zinc-900 text-zinc-400 border-zinc-800 text-[10px] tracking-wider uppercase flex items-center gap-1">
                <IconLock size={10} />
                Authenticated
              </Badge>
            )}
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">{poll.title}</h1>
          {poll.description && <p className="text-zinc-400 text-sm">{poll.description}</p>}
        </motion.div>

        {/* Questions */}
        <div className="space-y-6">
          {poll.questions
            .sort((a: any, b: any) => a.order - b.order)
            .map((q: any, qi: number) => (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: qi * 0.08 }}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-6"
              >
                <div className="flex items-start gap-3 mb-5">
                  <span className="text-xs font-mono text-zinc-600 mt-0.5">0{qi + 1}</span>
                  <div className="flex-1">
                    <p className="text-white font-medium">{q.text}</p>
                    {q.isMandatory ? (
                      <span className="text-red-500 text-xs">* Required</span>
                    ) : (
                      <span className="text-zinc-600 text-xs">Optional</span>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  {q.options.map((opt: any) => {
                    const selected = answers[q.id] === opt.id
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setAnswers(prev => ({ ...prev, [q.id]: opt.id }))}
                        className={`w-full text-left px-4 py-3 rounded-lg border transition-all flex items-center gap-3 ${
                          selected
                            ? 'border-red-600 bg-red-950/30 text-white'
                            : 'border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                          selected ? 'border-red-500 bg-red-600' : 'border-zinc-700'
                        }`}>
                          {selected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                        <span className="text-sm">{opt.text}</span>
                      </button>
                    )
                  })}
                </div>
              </motion.div>
            ))}
        </div>

        {/* Submit */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8 flex items-center gap-4"
        >
          <Button
            onClick={handleSubmit}
            disabled={mutation.isPending}
            className="bg-red-600 hover:bg-red-700 text-white px-8"
          >
            {mutation.isPending ? (
              <IconLoader2 className="animate-spin" size={16} />
            ) : (
              'Submit response'
            )}
          </Button>
          <p className="text-zinc-600 text-xs">
            {answeredCount} of {poll.questions.length} answered
          </p>
        </motion.div>
      </div>
    </div>
  )
}
