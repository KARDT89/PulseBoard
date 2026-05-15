import { useEffect } from 'react';
import { io } from 'socket.io-client';

const socket = io(import.meta.env.VITE_SOCKET_URL ?? 'http://localhost:3000');

export const usePollSocket = (
  pollId: string,
  onNewResponse: (data: { pollId: string; totalResponses: number }) => void,
  onViewersUpdate: (data: { pollId: string; count: number }) => void  // add this
) => {
  useEffect(() => {
    socket.emit('join-poll', pollId);
    socket.on('new-response', onNewResponse);
    socket.on('viewers-update', onViewersUpdate);  // add this

    return () => {
      socket.emit('leave-poll', pollId);
      socket.off('new-response', onNewResponse);
      socket.off('viewers-update', onViewersUpdate);  // add this
    };
  }, [pollId]);
};