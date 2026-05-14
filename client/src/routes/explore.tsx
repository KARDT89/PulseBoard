import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { pollsApi } from '@/api/polls.api'
import { Button } from '@/components/ui/button'
import {
  IconLoader2,
  IconClock,
  IconUsers,
  IconLock,
  IconWorld,
  IconFlame,
  IconChartBar,
  IconArrowLeft,
  IconArrowRight,
} from '@tabler/icons-react'
import { formatDistanceToNow } from 'date-fns'

export const Route = createFileRoute('/explore')({
  component: ExplorePage,
})

function ExplorePage() {
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState<'newest' | 'popular'>('newest')

  const { data, isLoading } = useQuery({
    queryKey: ['feed', page, sort],
    queryFn: () => pollsApi.getFeed(page, sort).then((r) => r.data.data),
  })

  const polls = data?.polls ?? []
  const pagination = data?.pagination

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-1"
        >
          <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-600">Discover</p>
          <h1 className="text-3xl font-bold text-white tracking-tight">Explore Polls</h1>
          <p className="text-zinc-500 text-sm">Browse and respond to polls from the community.</p>
        </motion.div>

        {/* Sort toggle */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.08 }}
          className="flex items-center gap-2"
        >
          <button
            onClick={() => { setSort('newest'); setPage(1) }}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
              sort === 'newest'
                ? 'bg-zinc-800 border-zinc-700 text-white'
                : 'border-zinc-800 text-zinc-500 hover:text-white'
            }`}
          >
            <IconFlame size={11} className="inline mr-1.5" />
            Newest
          </button>
          <button
            onClick={() => { setSort('popular'); setPage(1) }}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
              sort === 'popular'
                ? 'bg-zinc-800 border-zinc-700 text-white'
                : 'border-zinc-800 text-zinc-500 hover:text-white'
            }`}
          >
            <IconChartBar size={11} className="inline mr-1.5" />
            Most popular
          </button>
        </motion.div>

        {/* Feed */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <IconLoader2 className="animate-spin text-zinc-600" size={22} />
          </div>
        ) : polls.length === 0 ? (
          <div className="border border-dashed border-zinc-800 rounded-2xl p-12 text-center">
            <p className="text-zinc-500 text-sm">No polls available yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {polls.map((poll: any, i: number) => {
              const isExpired = new Date() > new Date(poll.expiresAt)
              const responses = poll._count?.responses ?? 0

              return (
                <motion.div
                  key={poll.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="group bg-zinc-950 border border-zinc-800/80 rounded-2xl overflow-hidden hover:border-zinc-700 transition-colors"
                >
                  <div className="h-px bg-gradient-to-r from-transparent via-zinc-800/60 to-transparent group-hover:via-red-900/30 transition-all" />

                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          {poll.isAnonymous ? (
                            <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-zinc-600 border border-zinc-800 rounded-full px-2 py-0.5">
                              <IconWorld size={9} /> Anonymous
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-zinc-600 border border-zinc-800 rounded-full px-2 py-0.5">
                              <IconLock size={9} /> Login required
                            </span>
                          )}
                          {isExpired && (
                            <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-zinc-600 border border-zinc-800 rounded-full px-2 py-0.5">
                              Closed
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

                      <div className="shrink-0 text-right hidden sm:block">
                        <div className="flex items-center gap-1 justify-end text-zinc-500 text-xs mb-1">
                          <IconUsers size={11} />
                          <span>{responses} response{responses !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="flex items-center gap-1 justify-end text-zinc-700 text-xs">
                          <IconClock size={11} />
                          <span>
                            {isExpired
                              ? 'Closed'
                              : formatDistanceToNow(new Date(poll.expiresAt), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-zinc-900">
                      <Link to="/polls/$pollId" params={{ pollId: poll.id }}>
                        <Button
                          size="sm"
                          className="bg-red-600 hover:bg-red-500 text-white gap-1.5 rounded-lg h-8 px-3 text-xs"
                        >
                          {poll.isPublished ? 'View results' : isExpired ? 'View' : 'Respond'}
                        </Button>
                      </Link>
                      {poll.isPublished && (
                        <Link to="/polls/$pollId/results" params={{ pollId: poll.id }}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-zinc-500 hover:text-white hover:bg-zinc-800 gap-1.5 rounded-lg h-8 px-3 text-xs"
                          >
                            <IconChartBar size={13} />
                            Results
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-between pt-4"
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPage((p) => p - 1)}
              disabled={page === 1}
              className="text-zinc-500 hover:text-white gap-1.5"
            >
              <IconArrowLeft size={14} />
              Previous
            </Button>
            <span className="text-zinc-600 text-xs">
              Page {page} of {pagination.totalPages}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={page === pagination.totalPages}
              className="text-zinc-500 hover:text-white gap-1.5"
            >
              Next
              <IconArrowRight size={14} />
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  )
}