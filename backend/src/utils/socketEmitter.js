/** Bridge between Express controllers and the Socket.io server. */
let io = null;
const setIO = (s) => { io = s; };
const emitToUser = (userId, event, payload) => { if (io) io.to(`user:${userId.toString()}`).emit(event, payload); };
const getIOStats = () => { if (!io) return { clients: 0 }; try { return { clients: io.engine?.clientsCount || 0 }; } catch { return { clients: 0 }; } };
module.exports = { setIO, emitToUser, getIOStats };
