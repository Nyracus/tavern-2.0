
import express from 'express';
import http from 'http';
import { Server as SocketIO } from 'socket.io';
import mongoose from 'mongoose';
import apiRoutes from './routes'; // existing routes


const app = express();
const server = http.createServer(app);
const io = new SocketIO(server, { cors: { origin: '*' } });



app.locals.io = io;



io.use((socket, next) => {

const token = socket.handshake.auth?.token;

socket.data.userId = socket.handshake.auth?.userId;
next();
});


io.on('connection', (socket) => {
const userId = socket.data.userId;
if (userId) socket.join(`user:${userId}`);


socket.on('disconnect', () => {

});
});



app.use('/api', apiRoutes);


const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Backend listening ${PORT}`));
