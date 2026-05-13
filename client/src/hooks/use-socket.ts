import { useEffect } from 'react';
import { io } from 'socket.io-client';

const socket = io(import.meta.env.VITE_SOCKET_URL ?? 'http://localhost:3000');

export const usePollSocket = (
  pollId: string,
  onNewResponse: (data: { pollId: string; totalResponses: number }) => void
) => {
  useEffect(() => {
    socket.emit('join-poll', pollId);
    socket.on('new-response', onNewResponse);

    return () => {
      socket.emit('leave-poll', pollId);
      socket.off('new-response', onNewResponse);
    };
  }, [pollId]);
};