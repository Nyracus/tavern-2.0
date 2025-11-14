import mongoose from 'mongoose';
const { Schema, model } = mongoose;


export type NotificationDoc = mongoose.Document & {
userId: string; // recipient user id
title: string;
message: string;
type: string; // e.g. 'quest', 'payment', 'system'
data?: Record<string, any>; // arbitrary payload (e.g. questId)
read: boolean;
createdAt: Date;
};


const NotificationSchema = new Schema<NotificationDoc>({
userId: { type: String, required: true, index: true },
title: { type: String, required: true },
message: { type: String, required: true },
type: { type: String, default: 'system' },
data: { type: Schema.Types.Mixed },
read: { type: Boolean, default: false },
}, { timestamps: { createdAt: 'createdAt', updatedAt: false } });


export const Notification = model<NotificationDoc>('Notification', NotificationSchema);
