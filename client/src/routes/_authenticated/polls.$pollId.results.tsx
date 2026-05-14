import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { pollsApi } from '@/api/polls.api'
import { Button } from '@/components/ui/button'
import {
  IconLoader2,
  IconLock,
  IconWorld,
  IconUsers,
  IconArrowLeft,
  IconClock,
} from '@tabler/icons-react'
import { formatDistanceToNow } from 'date-fns'

export const Route = createFileRoute('/_authenticated/polls/$pollId/results')({
  component: ResultsPage,
})

function ResultsPage() {
  const { pollId } = Route.useParams()
  const navigate = useNavigate()

  const { data, isLoading, error } = useQuery({
    queryKey: ['poll-results', pollId],
    queryFn: () => pollsApi.getResults(pollId).then((r) => r.data.data),
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <IconLoader2 className="animate-spin text-zinc-600" size={24} />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-zinc-500 text-sm">Results not available yet.</p>
          <Button
            variant="ghost"
            className="mt-4 text-zinc-500"
            onClick={() => navigate({ to: '/dashboard' })}
          >
            Back to dashboard
          </Button>
        </div>
      </div>
    )
  }

  const { poll, results } = data
  const totalResponses = poll._count?.responses ?? 0

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="border-b border-zinc-900 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <p className="text-xs tracking-[0.3em] text-red-500 uppercase">Pollify</p>
          <div className="flex items-center gap-2 text-zinc-500 text-xs">
            <IconClock size={12} />
            Closed {formatDistanceToNow(new Date(poll.expiresAt), { addSuffix: true })}
          </div>
        </div>
      </div>

      {/* Full progress bar (closed) */}
      <div className="h-0.5 bg-red-600" />

      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate({ to: '/dashboard' })}
            className="text-zinc-600 hover:text-white gap-1.5 mb-6 -ml-2"
          >
            <IconArrowLeft size={14} />
            Dashboard
          </Button>

          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-zinc-600 border border-zinc-800 rounded-full px-2 py-0.5">
              {poll.isAnonymous ? <><IconWorld size={9} /> Anonymous</> : <><IconLock size={9} /> Authenticated</>}
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-zinc-600 border border-zinc-800 rounded-full px-2 py-0.5">
              Results published
            </span>
          </div>

          <h1 className="text-2xl font-bold text-white mb-2">{poll.title}</h1>
          {poll.description && <p className="text-zinc-400 text-sm mb-4">{poll.description}</p>}

          <div className="flex items-center gap-1.5 text-zinc-500 text-sm">
            <IconUsers size={14} />
            <span>{totalResponses} total response{totalResponses !== 1 ? 's' : ''}</span>
          </div>
        </motion.div>

        {/* Results per question */}
        <div className="space-y-6">
          {results.map((q: any, qi: number) => (
            <motion.div
              key={q.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: qi * 0.08 }}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-6"
            >
              <div className="flex items-start gap-3 mb-5">
                <span className="text-xs font-mono text-zinc-600 mt-0.5">0{qi + 1}</span>
                <p className="text-white font-medium flex-1">{q.text}</p>
              </div>

              <div className="space-y-3">
                {q.options
                  .sort((a: any, b: any) => b.count - a.count)
                  .map((opt: any) => {
                    const pct = totalResponses > 0
                      ? Math.round((opt.count / totalResponses) * 100)
                      : 0
                    const isTop = opt.count === Math.max(...q.options.map((o: any) => o.count)) && opt.count > 0

                    return (
                      <div key={opt.id} className="space-y-1.5">
                        <div className="flex items-center justify-between text-sm">
                          <span className={isTop ? 'text-white font-medium' : 'text-zinc-400'}>
                            {opt.text}
                          </span>
                          <span className={`text-xs tabular-nums ${isTop ? 'text-red-400' : 'text-zinc-600'}`}>
                            {pct}% · {opt.count}
                          </span>
                        </div>
                        <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                          <motion.div
                            className={`h-full rounded-full ${isTop ? 'bg-red-600' : 'bg-zinc-700'}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.6, delay: qi * 0.08 + 0.2 }}
                          />
                        </div>
                      </div>
                    )
                  })}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}