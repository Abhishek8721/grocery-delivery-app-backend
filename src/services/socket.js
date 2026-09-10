let io;

const initSocket = (server) => {
  const { Server } = require('socket.io');
  io = new Server(server, {
    cors: {
      origin: true,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE']
    }
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on('join_room', (room) => {
      socket.join(room);
      console.log(`Socket ${socket.id} joined room: ${room}`);
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io is not initialized!');
  }
  return io;
};

const emitOrderCreated = (order) => {
  if (io) {
    io.emit('order_created', order);
    io.to(`user_${order.userId}`).emit('my_order_created', order);
  }
};

const emitOrderStatusUpdated = (order) => {
  if (io) {
    io.emit('order_status_updated', order);
    io.to(`order_${order._id}`).emit('order_status_updated', order);
    io.to(`user_${order.userId}`).emit('order_status_updated', order);
  }
};

module.exports = {
  initSocket,
  getIO,
  emitOrderCreated,
  emitOrderStatusUpdated
};
