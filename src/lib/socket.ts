import { Server as NetServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { NextApiRequest } from 'next';
import { NextApiResponse } from 'next';

export type NextApiResponseWithSocket = NextApiResponse & {
  socket: {
    server: NetServer & {
      io?: SocketIOServer;
    };
  };
};

export const config = {
  api: {
    bodyParser: false,
  },
};

export const initSocket = (req: NextApiRequest, res: NextApiResponseWithSocket) => {
  if (!res.socket.server.io) {
    const io = new SocketIOServer(res.socket.server, {
      path: '/api/socketio',
      addTrailingSlash: false,
    });

    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      socket.on('join-room', (roomId) => {
        socket.join(roomId);
        const otherUsers = Array.from(io.sockets.adapter.rooms.get(roomId) || [])
          .filter(id => id !== socket.id);
        socket.emit('all-users', otherUsers);
        socket.to(roomId).emit('user-joined', socket.id);
      });

      socket.on('offer', ({ target, sdp, roomId }) => {
        socket.to(target).emit('offer', {
          sdp,
          caller: socket.id
        });
      });

      socket.on('answer', ({ target, sdp, roomId }) => {
        socket.to(target).emit('answer', {
          sdp,
          answerer: socket.id
        });
      });

      socket.on('ice-candidate', ({ target, candidate, roomId }) => {
        socket.to(target).emit('ice-candidate', {
          candidate,
          sender: socket.id
        });
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        io.emit('user-disconnected', socket.id);
      });
    });

    res.socket.server.io = io;
  }
  return res.socket.server.io;
}; 