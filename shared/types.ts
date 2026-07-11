import { z } from 'zod';

export const DeviceSchema = z.object({
  deviceId: z.string(),
  userId: z.string(),
  computerName: z.string(),
  os: z.string(),
  agentVersion: z.string(),
  addedAt: z.number()
});
export type Device = z.infer<typeof DeviceSchema>;

export const DeviceStatusSchema = z.object({
  online: z.boolean(),
  lastSeen: z.number(),
  cpu: z.number().optional(),
  ram: z.number().optional(),
  disk: z.number().optional(),
  uptime: z.number().optional(),
  ip: z.string().optional(),
  osVersion: z.string().optional(),
  agentVersion: z.string().optional(),
  computerName: z.string().optional()
});
export type DeviceStatus = z.infer<typeof DeviceStatusSchema>;

export const CommandSchema = z.object({
  commandId: z.string().optional(),
  deviceId: z.string(),
  command: z.string(),
  params: z.record(z.unknown()).optional(),
  timestamp: z.number(),
  status: z.enum(['pending', 'completed', 'failed']),
  signature: z.string()
});
export type Command = z.infer<typeof CommandSchema>;

export const CommandResultSchema = z.object({
  commandId: z.string(),
  deviceId: z.string(),
  result: z.unknown().optional(),
  error: z.string().optional(),
  completedAt: z.number()
});
export type CommandResult = z.infer<typeof CommandResultSchema>;

export const NotificationSchema = z.object({
  notifId: z.string().optional(),
  type: z.enum(['battery_low', 'cpu_high', 'agent_offline', 'agent_online', 'storage_low', 'update_available', 'general']),
  message: z.string(),
  deviceId: z.string().optional(),
  read: z.boolean(),
  timestamp: z.number()
});
export type Notification = z.infer<typeof NotificationSchema>;

export const ActivityLogSchema = z.object({
  logId: z.string().optional(),
  deviceId: z.string(),
  action: z.string(),
  timestamp: z.number(),
  ip: z.string().optional()
});
export type ActivityLog = z.infer<typeof ActivityLogSchema>;

// IPC Channels whitelist (shared between agent main and preload)
export const IPC_CHANNELS = [
  'get-system-info',
  'execute-command',
  'file-operation',
  'audio-play'
] as const;

export type IpcChannel = typeof IPC_CHANNELS[number];
