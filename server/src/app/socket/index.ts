import { Server } from 'socket.io';
import type { Server as HttpServer } from 'http';

let io: Server;

// track viewers per poll in memory
const pollViewers = new Map<string, Set<string>>();

export const initSocket = (httpServer: HttpServer) => {
  io = new Server(httpServer, {
    cors: { origin: '*' },
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id)

    // join a specific poll room (respond + results page)
    socket.on('join-poll', (pollId: string) => {
      socket.join(`poll:${pollId}`)

      // presence tracking
      if (!pollViewers.has(pollId)) pollViewers.set(pollId, new Set())
      pollViewers.get(pollId)!.add(socket.id)

      // broadcast updated viewer count to the room
      io.to(`poll:${pollId}`).emit('viewers-update', {
        pollId,
        count: pollViewers.get(pollId)!.size,
      })
    })

    socket.on('leave-poll', (pollId: string) => {
      socket.leave(`poll:${pollId}`)
      pollViewers.get(pollId)?.delete(socket.id)

      io.to(`poll:${pollId}`).emit('viewers-update', {
        pollId,
        count: pollViewers.get(pollId)?.size ?? 0,
      })
    })

    // join global feed room (explore page)
    socket.on('join-feed', () => {
      socket.join('feed')
    })

    socket.on('leave-feed', () => {
      socket.leave('feed')
    })

    // cleanup on disconnect
    socket.on('disconnect', () => {
      pollViewers.forEach((viewers, pollId) => {
        if (viewers.has(socket.id)) {
          viewers.delete(socket.id)
          io.to(`poll:${pollId}`).emit('viewers-update', {
            pollId,
            count: viewers.size,
          })
        }
      })
    })
  })

  return io
}

export const getIo = () => {
  if (!io) throw new Error('Socket.io not initialized')
  return io
}