import { createFileRoute, Link } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { pollsApi } from '@/api/polls.api'
import { useAuth } from '@/api/auth-context'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  IconChartBar,
  IconCopy,
  IconPlus,
  IconLoader2,
  IconClock,
  IconUsers,
  IconLock,
  IconWorld,
  IconCheck,
  IconFlame,
  IconHourglass,
} from '@tabler/icons-react'
import { IconTrash } from '@tabler/icons-react'

export const Route = createFileRoute('/_authenticated/dashboard')({
  component: DashboardPage,
})

function getStatus(expiresAt: string, isPublished: boolean): 'Published' | 'Live' | 'Expired' {
  if (isPublished) return 'Published'
  if (new Date() > new Date(expiresAt)) return 'Expired'
  return 'Live'
}

const statusConfig = {
  Live: {
    label: 'Live',
    icon: IconFlame,
    className: 'bg-green-950/40 text-green-400 border-green-900/60',
  },
  Published: {
    label: 'Published',
    icon: IconCheck,
    className: 'bg-blue-950/40 text-blue-400 border-blue-900/60',
  },
  Expired: {
    label: 'Expired',
    icon: IconHourglass,
    className: 'bg-zinc-900 text-zinc-600 border-zinc-800',
  },
}

function DashboardPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  console.log("user from dashnoard", user);
  

  const { data, isLoading } = useQuery({
    queryKey: ['my-polls'],
    queryFn: () => pollsApi.getMyPolls().then((r) => r.data.data),
  })

  const publishMutation = useMutation({
    mutationFn: (pollId: string) => pollsApi.publish(pollId),
    onSuccess: () => {
      toast.success('Results published')
      queryClient.invalidateQueries({ queryKey: ['my-polls'] })
    },
    onError: () => toast.error('Failed to publish'),
  })

  const deleteMutation = useMutation({
  mutationFn: (pollId: string) => pollsApi.delete(pollId),
  onSuccess: () => {
    toast.success('Poll deleted')
    queryClient.invalidateQueries({ queryKey: ['my-polls'] })
  },
  onError: () => toast.error('Failed to delete'),
})

  const copyLink = (pollId: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/polls/${pollId}`)
    toast.success('Link copied')
  }

  const polls = data?.polls ?? []
  console.log(polls)
  const livePolls = polls.filter((p: any) => !p.isPublished && new Date() < new Date(p.expiresAt))
  const publishedPolls = polls.filter((p: any) => p.isPublished)

  
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-10 space-y-10">

        {/* Page header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-end justify-between"
        >
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-600 mb-1">Overview</p>
            <h1 className="text-3xl font-bold text-white tracking-tight">Dashboard</h1>
            <p className="text-zinc-500 text-sm mt-1">
              Welcome back, <span className="text-zinc-300">{user?.name}</span>
            </p>
          </div>
          <Link to="/polls/create">
            <Button className="bg-red-600 hover:bg-red-500 text-white gap-2 rounded-xl">
              <IconPlus size={15} />
              New Poll
            </Button>
          </Link>
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="grid grid-cols-3 gap-4"
        >
          {[
            { label: 'Total Polls', value: polls.length, sub: 'all time' },
            { label: 'Live', value: livePolls.length, sub: 'accepting responses', accent: true },
            { label: 'Published', value: publishedPolls.length, sub: 'results visible' },
          ].map(({ label, value, sub, accent }) => (
            <div
              key={label}
              className={`relative bg-zinc-950 border rounded-2xl p-5 overflow-hidden ${
                accent ? 'border-red-900/50' : 'border-zinc-800/80'
              }`}
            >
              {accent && (
                <div className="absolute inset-0 bg-red-950/10 pointer-events-none" />
              )}
              <div className="h-px absolute top-0 left-0 right-0 bg-gradient-to-r from-transparent via-red-800/40 to-transparent" />
              <p className="text-[10px] uppercase tracking-wider text-zinc-600 mb-2">{label}</p>
              <p className={`text-3xl font-bold ${accent ? 'text-red-400' : 'text-white'}`}>{value}</p>
              <p className="text-xs text-zinc-700 mt-1">{sub}</p>
            </div>
          ))}
        </motion.div>

        {/* Polls list */}
        <div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="flex items-center gap-3 mb-5"
          >
            <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-600">Your polls</span>
            <div className="flex-1 h-px bg-zinc-900" />
            <span className="text-xs text-zinc-700">{polls.length} total</span>
          </motion.div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-3">
                <IconLoader2 className="animate-spin text-zinc-600" size={22} />
                <p className="text-zinc-700 text-xs uppercase tracking-widest">Loading</p>
              </div>
            </div>
          ) : polls.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="border border-dashed border-zinc-800 rounded-2xl p-12 text-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-4">
                <IconChartBar size={24} className="text-zinc-600" />
              </div>
              <p className="text-zinc-400 font-medium mb-1">No polls yet</p>
              <p className="text-zinc-600 text-sm mb-5">Create your first poll and start collecting responses.</p>
              <Link to="/polls/create">
                <Button className="bg-red-600 hover:bg-red-500 text-white gap-2 rounded-xl">
                  <IconPlus size={14} />
                  Create your first poll
                </Button>
              </Link>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {polls.map((poll: any, i: number) => {
                const status = getStatus(poll.expiresAt, poll.isPublished)
                const cfg = statusConfig[status]
                const StatusIcon = cfg.icon
                const responses = poll._count?.responses?.total ?? poll._count?.responses ?? 0

                return (
                  <motion.div
                    key={poll.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.05 }}
                    className="group bg-zinc-950 border border-zinc-800/80 rounded-2xl overflow-hidden hover:border-zinc-700 transition-colors"
                  >
                    <div className="h-px bg-gradient-to-r from-transparent via-zinc-800/60 to-transparent group-hover:via-red-900/30 transition-all" />

                    <div className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <span className={`inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border font-medium ${cfg.className}`}>
                              <StatusIcon size={9} />
                              {cfg.label}
                            </span>
                            {poll.isAnonymous ? (
                              <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-zinc-600 border border-zinc-800 rounded-full px-2 py-0.5">
                                <IconWorld size={9} /> Anonymous
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-zinc-600 border border-zinc-800 rounded-full px-2 py-0.5">
                                <IconLock size={9} /> Authenticated
                              </span>
                            )}
                          </div>

                          <h3 className="text-white font-semibold text-base leading-snug truncate">
                            {poll.title}
                          </h3>
                          {poll.description && (
                            <p className="text-zinc-500 text-sm mt-0.5 line-clamp-1">{poll.description}</p>
                          )}
                        </div>

                        {/* Right meta */}
                        <div className="shrink-0 text-right hidden sm:block">
                          <div className="flex items-center gap-1 justify-end text-zinc-500 text-xs mb-1">
                            <IconUsers size={11} />
                            <span>{responses} response{responses !== 1 ? 's' : ''}</span>
                          </div>
                          <div className="flex items-center gap-1 justify-end text-zinc-700 text-xs">
                            <IconClock size={11} />
                            <span>
                              {new Date() > new Date(poll.expiresAt)
                                ? 'Closed'
                                : formatDistanceToNow(new Date(poll.expiresAt), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Mobile meta */}
                      <div className="flex items-center gap-3 mt-2 sm:hidden text-xs text-zinc-600">
                        <span className="flex items-center gap-1"><IconUsers size={11} />{responses}</span>
                        <span className="flex items-center gap-1">
                          <IconClock size={11} />
                          {new Date() > new Date(poll.expiresAt)
                            ? 'Closed'
                            : formatDistanceToNow(new Date(poll.expiresAt), { addSuffix: true })}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-zinc-900">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyLink(poll.id)}
                          className="text-zinc-500 hover:text-white hover:bg-zinc-800 gap-1.5 rounded-lg h-8 px-3 text-xs"
                        >
                          <IconCopy size={13} />
                          Copy link
                        </Button>

                        <Link to="/polls/$pollId/analytics" params={{ pollId: poll.id }}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-zinc-500 hover:text-white hover:bg-zinc-800 gap-1.5 rounded-lg h-8 px-3 text-xs"
                          >
                            <IconChartBar size={13} />
                            Analytics
                          </Button>
                        </Link>
                         <Button
  variant="ghost"
  size="sm"
  onClick={() => {
    if (confirm('Delete this poll? This cannot be undone.')) {
      deleteMutation.mutate(poll.id)
    }
  }}
  disabled={deleteMutation.isPending}
  className="text-zinc-600 hover:text-red-400 hover:bg-red-950/20 gap-1.5 rounded-lg h-8 px-3 text-xs"
>
  {deleteMutation.isPending ? (
    <IconLoader2 size={13} className="animate-spin" />
  ) : (
    <IconTrash size={13} />
  )}
  Delete
</Button>
                        {poll.isPublished && (
                          <Link to="/polls/$pollId/results" params={{ pollId: poll.id }}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-zinc-500 hover:text-white hover:bg-zinc-800 gap-1.5 rounded-lg h-8 px-3 text-xs"
                            >
                              <IconChartBar size={13} />
                              View results
                            </Button>
                          </Link>
                        )}

                        {!poll.isPublished && (
                          <Button
                            size="sm"
                            onClick={() => publishMutation.mutate(poll.id)}
                            disabled={publishMutation.isPending}
                            className="ml-auto bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 gap-1.5 rounded-lg h-8 px-3 text-xs"
                          >
                            {publishMutation.isPending ? (
                              <IconLoader2 size={12} className="animate-spin" />
                            ) : (
                              <IconCheck size={12} />
                            )}
                            Publish results
                          </Button>
                        )}
                      </div>
                     
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}