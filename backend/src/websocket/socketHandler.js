import { Server } from 'socket.io';
import { CanvasDataService, UserService } from '../config/dynamodb.js';

export class SocketHandler {
  constructor(server) {
    const FRONTEND_URL = process.env.FRONTEND_URL;
    const PRODUCTION_URL = "http://3.139.56.157";
    const allowedOrigins = [FRONTEND_URL, PRODUCTION_URL].filter(Boolean);
    
    this.io = new Server(server, {
      cors: {
        origin: allowedOrigins.length > 0 ? allowedOrigins : true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        credentials: true,
      },
    });

    this.canvasService = new CanvasDataService();
    this.userService = new UserService();

    this.setupEventHandlers();
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`Client connected: ${socket.id}`);

      // ---- SAVE / UPDATE CANVAS ----
      socket.on('canvas-change', async (data) => {
        try {
          const { userId, canvasId, canvasData, canvasName } = data || {};

          if (!userId || !canvasId || !canvasData) {
            socket.emit('canvas-save-error', {
              error: 'Missing required fields: userId, canvasId, or canvasData',
            });
            return;
          }

          // Optional: verify user exists (remove if not needed)
          const userExists = await this.userService.verifyUserExists(userId);
          if (!userExists) {
            socket.emit('canvas-save-error', {
              error: 'User not found in users table',
            });
            return;
          }

          console.log(
            `[socket] canvas-change → saving: userId=${userId} canvasId=${canvasId} name=${canvasName || '(none)'}`
          );

          await this.canvasService.saveCanvasData(userId, canvasId, canvasData, canvasName);

          socket.emit('canvas-saved', {
            userId,
            canvasId,
            name: canvasName || undefined,
            timestamp: new Date().toISOString(),
          });

          console.log(`[socket] canvas-change → saved OK: ${userId} / ${canvasId}`);
        } catch (error) {
          console.error('[socket] canvas-change → error:', error);
          socket.emit('canvas-save-error', {
            error: error?.message || 'Failed to save canvas data',
          });
        }
      });

      // ---- GET ONE CANVAS ----
      socket.on('get-canvas-data', async (data) => {
        try {
          const { userId, canvasId } = data || {};

          console.log(`[socket] get-canvas-data request: userId=${userId}, canvasId=${canvasId}`);

          if (!userId || !canvasId) {
            console.log('[socket] Missing required fields for get-canvas-data');
            socket.emit('canvas-data-error', {
              error: 'Missing required fields: userId or canvasId',
            });
            return;
          }

          const item = await this.canvasService.getCanvasData(userId, canvasId);
          console.log(`[socket] Canvas data retrieved:`, item ? 'Found' : 'Not found');
          
          const payload = {
            userId,
            canvasId,
            canvasData: item ? item.canvasData : null, // object already
            name: item?.name,
            timestamp: item?.timestamp,
            updatedAt: item?.updatedAt,
          };

          console.log(`[socket] Sending canvas data response:`, JSON.stringify(payload, null, 2));
          socket.emit('canvas-data-response', payload);
        } catch (error) {
          console.error('[socket] get-canvas-data → error:', error);
          socket.emit('canvas-data-error', {
            error: error?.message || 'Failed to get canvas data',
          });
        }
      });

      // ---- LIST ALL USER CANVASES ----
      socket.on('get-user-canvases', async (data) => {
        try {
          const { userId } = data || {};
          if (!userId) {
            socket.emit('user-canvases-error', {
              error: 'Missing required field: userId',
            });
            return;
          }

          console.log('[socket] get-user-canvases →', userId);

          const canvases = await this.canvasService.getUserCanvases(userId);
          const list = (canvases || [])
            .map((c) => ({
              id: c.canvasId,
              name: c.name || (c.canvasId ? `Canvas ${c.canvasId.slice(-8)}` : 'Canvas'),
              data: c.canvasData, // object
              timestamp: c.timestamp,
              updatedAt: c.updatedAt,
            }))
            .sort((a, b) => {
              const aKey = a.updatedAt || a.timestamp || '';
              const bKey = b.updatedAt || b.timestamp || '';
              return aKey < bKey ? 1 : aKey > bKey ? -1 : 0;
            });

          const response = { userId, canvases: list };
          socket.emit('user-canvases-response', response);
        } catch (error) {
          console.error('[socket] get-user-canvases → error:', error);
          socket.emit('user-canvases-error', {
            error: error?.message || 'Failed to get user canvases',
          });
        }
      });

      // ---- DELETE CANVAS ----
      socket.on('delete-canvas', async (data) => {
        try {
          const { userId, canvasId } = data || {};
          if (!userId || !canvasId) {
            socket.emit('canvas-delete-error', {
              error: 'Missing required fields: userId or canvasId',
            });
            return;
          }

          await this.canvasService.deleteCanvasData(userId, canvasId);

          socket.emit('canvas-deleted', {
            userId,
            canvasId,
            timestamp: new Date().toISOString(),
          });

          console.log(`[socket] delete-canvas → OK: ${userId} / ${canvasId}`);
        } catch (error) {
          console.error('[socket] delete-canvas → error:', error);
          socket.emit('canvas-delete-error', {
            error: error?.message || 'Failed to delete canvas data',
          });
        }
      });

      // ---- DISCONNECT ----
      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
      });
    });
  }

  getIO() {
    return this.io;
  }
}
