import { Router } from 'express';

const io = req.app.locals.io;
if (io) {
io.to(`user:${userId}`).emit('notification:new', n);

io.to(`user:${userId}`).emit('notification:badge', { unreadCount: await Notification.countDocuments({ userId, read: false }) });
}


return res.status(201).json(n);
} catch (err) {
console.error(err);
return res.status(500).json({ message: 'server error' });
}
});



router.get('/', async (req, res) => {
try {
const userId = req.query.userId as string; 
if (!userId) return res.status(400).json({ message: 'userId query param required' });


const page = Math.max(1, Number(req.query.page) || 1);
const limit = Math.min(50, Number(req.query.limit) || 20);


const notifications = await Notification.find({ userId }).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean();
const unreadCount = await Notification.countDocuments({ userId, read: false });


return res.json({ notifications, unreadCount });
} catch (err) {
console.error(err);
return res.status(500).json({ message: 'server error' });
}
});



router.post('/:id/read', async (req, res) => {
try {
const id = req.params.id;
const n = await Notification.findByIdAndUpdate(id, { read: true }, { new: true });
if (!n) return res.status(404).json({ message: 'not found' });


const io = req.app.locals.io;
if (io) {
io.to(`user:${n.userId}`).emit('notification:read', { id });
io.to(`user:${n.userId}`).emit('notification:badge', { unreadCount: await Notification.countDocuments({ userId: n.userId, read: false }) });
}


return res.json(n);
} catch (err) {
console.error(err);
return res.status(500).json({ message: 'server error' });
}
});



router.post('/mark-all-read', async (req, res) => {
try {
const { userId } = req.body;
if (!userId) return res.status(400).json({ message: 'userId required' });


await Notification.updateMany({ userId, read: false }, { read: true });
const io = req.app.locals.io;
if (io) io.to(`user:${userId}`).emit('notification:badge', { unreadCount: 0 });


return res.json({ ok: true });
} catch (err) {
console.error(err);
return res.status(500).json({ message: 'server error' });
}
});


export default router;
