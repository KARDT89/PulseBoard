import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { pollsApi } from '@/api/polls.api'
import { Button } from '@/components/ui/button'
import {
  IconArrowLeft,
  IconLoader2,
  IconAlertTriangle,
  IconLock,
  IconWifi,
  IconClock,
  IconCheck,
  IconShare,
  IconUsers,
} from '@tabler/icons-react'
import { formatDistanceToNow } from 'date-fns'
import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { toast } from 'sonner'
import { analyticsApi } from '@/api/analytics.api'

export const Route = createFileRoute('/_authenticated/polls/$pollId/analytics')({
  component: AnalyticsPage,
})

function ResponseRing({ count }: { count: number }) {
  const goal = Math.max(count, 10)
  const pct = Math.min(count / goal, 1)
  const r = 52
  const circ = 2 * Math.PI * r

  return (
    <div className="relative flex items-center justify-center w-32 h-32">
      <svg width="128" height="128" viewBox="0 0 128 128" className="-rotate-90">
        <circle cx="64" cy="64" r={r} fill="none" stroke="#18181b" strokeWidth="7" />
        <motion.circle
          cx="64" cy="64" r={r}
          fill="none" stroke="#dc2626" strokeWidth="7" strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - pct * circ }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-bold text-white leading-none">{count}</span>
        <span className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">responses</span>
      </div>
    </div>
  )
}

function OptionBar({ text, votes, pct, isTop, delay }: {
  text: string; votes: number; pct: number; isTop: boolean; delay: number
}) {
  return (
    <div>
      <div className="flex justify-between items-baseline mb-2">
        <div className="flex items-center gap-2">
          {isTop && votes > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: delay + 0.5, type: 'spring', stiffness: 300 }}
              className="w-4 h-4 rounded-full bg-red-600 flex items-center justify-center shrink-0"
            >
              <IconCheck size={9} className="text-white" />
            </motion.div>
          )}
          <span className={`text-sm ${isTop && votes > 0 ? 'text-white font-medium' : 'text-zinc-400'}`}>
            {text}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-600 tabular-nums">{votes} votes</span>
          <span className={`text-sm font-mono font-bold w-10 text-right ${isTop && votes > 0 ? 'text-red-400' : 'text-zinc-600'}`}>
            {pct.toFixed(0)}%
          </span>
        </div>
      </div>
      <div className="relative h-7 bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800/50">
        <motion.div
          className={`absolute inset-y-0 left-0 rounded-lg ${isTop && votes > 0 ? 'bg-gradient-to-r from-red-700 to-red-500' : 'bg-zinc-800'}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
        />
        {[25, 50, 75].map((mark) => (
          <div key={mark} className="absolute top-0 bottom-0 w-px bg-zinc-800/50" style={{ left: `${mark}%` }} />
        ))}
      </div>
    </div>
  )
}

function QuestionCard({ question, index, countMap }: {
  question: any; index: number; countMap: Record<string, number>
}) {
  const questionTotal = question.options.reduce(
    (sum: number, opt: any) => sum + (countMap[opt.id] ?? 0), 0,
  )
  const maxVotes = Math.max(...question.options.map((o: any) => countMap[o.id] ?? 0), 0)

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 + index * 0.08 }}
      className="relative bg-zinc-950 border border-zinc-800/80 rounded-2xl overflow-hidden"
    >
      <div className="h-px bg-gradient-to-r from-transparent via-red-800/50 to-transparent" />
      <div className="p-6">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 mt-0.5">
            <span className="text-xs font-mono text-zinc-500">{String(index + 1).padStart(2, '0')}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold leading-snug">{question.text}</p>
            <div className="flex items-center gap-3 mt-1.5">
              <span className="text-xs text-zinc-600">{questionTotal} response{questionTotal !== 1 ? 's' : ''}</span>
              {question.isMandatory
                ? <span className="text-[10px] uppercase tracking-wider text-red-500/60">required</span>
                : <span className="text-[10px] uppercase tracking-wider text-zinc-700">optional</span>
              }
            </div>
          </div>
        </div>
        <div className="space-y-4">
          {question.options.map((opt: any, oi: number) => {
            const votes = countMap[opt.id] ?? 0
            const pct = questionTotal > 0 ? (votes / questionTotal) * 100 : 0
            return (
              <OptionBar
                key={opt.id}
                text={opt.text}
                votes={votes}
                pct={pct}
                isTop={votes === maxVotes}
                delay={0.3 + index * 0.08 + oi * 0.06}
              />
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}

export default function AnalyticsPage() {
  const { pollId } = Route.useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const socketRef = useRef<Socket | null>(null)
  const [newResponseFlash, setNewResponseFlash] = useState(false)

  const { data: pollData, isLoading: pollLoading } = useQuery({
    queryKey: ['poll', pollId],
    queryFn: () => pollsApi.getById(pollId).then((r) => r.data.data),
  })

  const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
    queryKey: ['analytics', pollId],
    queryFn: () => analyticsApi.get(pollId).then((r) => r.data.data),
    // Fallback polling every 30s in case socket misses something
    refetchInterval: 30_000,
  })

  useEffect(() => {
    const socket = io(import.meta.env.VITE_API_URL ?? 'http://localhost:3000', {
      withCredentials: true,
    })
    socketRef.current = socket
    socket.emit('join-poll', pollId)

    socket.on('new-response', () => {
      // Always refetch from server — never trust socket payload for counts
      queryClient.invalidateQueries({ queryKey: ['analytics', pollId] })
      setNewResponseFlash(true)
      setTimeout(() => setNewResponseFlash(false), 2500)
    })

    return () => {
      socket.emit('leave-poll', pollId)
      socket.disconnect()
    }
  }, [pollId, queryClient])

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/polls/${pollId}`)
    toast.success('Poll link copied')
  }

  if (pollLoading || analyticsLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <IconLoader2 className="animate-spin text-zinc-600" size={24} />
          <p className="text-zinc-700 text-[10px] uppercase tracking-widest">Loading analytics</p>
        </div>
      </div>
    )
  }

  if (!pollData || !analyticsData) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-6">
            <IconAlertTriangle size={28} className="text-zinc-500" />
          </div>
          <p className="text-zinc-500 text-sm">Failed to load analytics.</p>
          <Button onClick={() => navigate({ to: '/dashboard' })} className="mt-4 bg-zinc-800 hover:bg-zinc-700 text-white">
            Back to dashboard
          </Button>
        </div>
      </div>
    )
  }

  const poll = pollData
  const { totalResponses, optionCounts } = analyticsData

  // Handle both camelCase (optionId) and snake_case (option_id) — Drizzle can return either
  const countMap: Record<string, number> = {}
  for (const row of optionCounts) {
    const id: string | undefined = row.optionId ?? row.option_id
    if (id) countMap[id] = Number(row.count)
  }

  const total = Number(totalResponses?.total ?? 0)
  const isExpired = new Date() > new Date(poll.expiresAt)

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-3xl mx-auto px-6 py-10 space-y-10">

        {/* Top row: back + share */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <button
            onClick={() => navigate({ to: '/dashboard' })}
            className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-sm"
          >
            <IconArrowLeft size={15} />
            Dashboard
          </button>
          <div className="flex items-center gap-3">
            {!isExpired && (
              <motion.div
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ repeat: Infinity, duration: 2.5 }}
                className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-green-500"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                Live
              </motion.div>
            )}
            <button
              onClick={copyLink}
              className="flex items-center gap-1.5 text-zinc-500 hover:text-white transition-colors text-sm"
            >
              <IconShare size={14} />
              <span className="text-xs">Share</span>
            </button>
          </div>
        </motion.div>

        {/* Poll header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {!poll.isAnonymous && (
              <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-zinc-500 border border-zinc-800 rounded-full px-2.5 py-0.5">
                <IconLock size={9} /> Authenticated
              </span>
            )}
            <span className={`text-[10px] uppercase tracking-wider rounded-full px-2.5 py-0.5 border ${
              isExpired
                ? 'text-zinc-600 border-zinc-800'
                : 'text-green-600 border-green-900/60 bg-green-950/30'
            }`}>
              {isExpired ? 'Closed' : 'Accepting responses'}
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{poll.title}</h1>
          {poll.description && (
            <p className="text-zinc-400 text-sm mt-2 leading-relaxed max-w-xl">{poll.description}</p>
          )}
          <div className="flex items-center gap-1.5 mt-3 text-zinc-600 text-xs">
            <IconClock size={11} />
            {isExpired ? 'Closed' : 'Closes'}{' '}
            {formatDistanceToNow(new Date(poll.expiresAt), { addSuffix: true })}
          </div>
        </motion.div>

        {/* Hero stats */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-zinc-950 border border-zinc-800/80 rounded-2xl overflow-hidden"
        >
          <div className="h-px bg-gradient-to-r from-transparent via-red-800/50 to-transparent" />
          <div className="p-8 flex flex-col sm:flex-row items-center gap-8">
            <ResponseRing count={total} />
            <div className="flex-1 grid grid-cols-2 gap-3 w-full">
              {[
                { label: 'Questions', value: poll.questions?.length ?? 0 },
                { label: 'Status', value: isExpired ? 'Closed' : 'Live', color: isExpired ? 'text-zinc-500' : 'text-green-500' },
                { label: 'Type', value: poll.isAnonymous ? 'Anonymous' : 'Authenticated' },
                { label: 'Results', value: poll.isPublished ? 'Published' : 'Private', color: poll.isPublished ? 'text-green-500' : 'text-zinc-500' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-4">
                  <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-1.5">{label}</p>
                  <p className={`text-sm font-semibold ${color ?? 'text-white'}`}>{value}</p>
                </div>
              ))}
            </div>
          </div>
          <AnimatePresence>
            {newResponseFlash && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="border-t border-green-900/40 px-6 py-2.5 flex items-center gap-2 bg-green-950/20"
              >
                <IconWifi size={13} className="text-green-500" />
                <span className="text-xs text-green-500">New response just came in</span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Breakdown */}
        <div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-3 mb-5"
          >
            <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-600">Breakdown</span>
            <div className="flex-1 h-px bg-zinc-900" />
            <span className="text-xs text-zinc-700">{poll.questions?.length} questions</span>
          </motion.div>
          <div className="space-y-5">
            {poll.questions
              ?.sort((a: any, b: any) => a.order - b.order)
              .map((q: any, qi: number) => (
                <QuestionCard key={q.id} question={q} index={qi} countMap={countMap} />
              ))}
          </div>
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex items-center justify-between pt-4 border-t border-zinc-900"
        >
          <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-800">Pollify</p>
          <button
            onClick={copyLink}
            className="flex items-center gap-1.5 text-xs text-zinc-600 hover:text-white transition-colors"
          >
            <IconUsers size={12} />
            Copy poll link
          </button>
        </motion.div>
      </div>
    </div>
  )
}