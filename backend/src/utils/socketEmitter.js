/**
 * Bridge between Express controllers and the Socket.io server.
 * Controllers call emitToUser(userId, event, payload); the singleton `io`
 * (set by initSocket in socket/index.js) fans it out to the user's room.
 */
let io = null;
const setIO = (socketServer) => {
  io = socketServer;
};

const emitToUser = (userId, event, payload) => {
  if (!io) return;
  io.to(`user:${userId.toString()}`).emit(event, payload);
};

module.exports = { setIO, emitToUser };
