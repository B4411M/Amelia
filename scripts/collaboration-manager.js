/**
 * ============================================
 * AMELIA AI - COLLABORATION MANAGER
 * Real-time collaboration features
 * ============================================
 */

class CollaborationManager {
    constructor() {
        this.rooms = new Map();
        this.users = new Map();
        this.currentRoom = null;
        this.currentUser = null;
        this.ws = null;
        this.connected = false;
        
        // Settings
        this.settings = {
            autoConnect: false,
            maxUsersPerRoom: 10,
            enableWhiteboard: true,
            enableCursor: true
        };
        
        // Callbacks
        this.onUserJoin = null;
        this.onUserLeave = null;
        this.onMessage = null;
        this.onCursorUpdate = null;
        this.onWhiteboardUpdate = null;
    }

    // ========== INITIALIZATION ==========

    async init() {
        console.log('[Collaboration] Initializing...');
        
        // Check WebSocket support
        if (typeof WebSocket !== 'undefined') {
            this.wsSupported = true;
            console.log('[Collaboration] WebSocket supported');
        } else {
            this.wsSupported = false;
            console.warn('[Collaboration] WebSocket not supported');
        }
        
        return this;
    }

    // ========== USER MANAGEMENT ==========

    setUser(userData) {
        this.currentUser = {
            id: userData.id || this.generateId(),
            name: userData.name || 'Anonymous',
            color: userData.color || this.generateColor(),
            avatar: userData.avatar || null,
            joinedAt: Date.now()
        };
        
        this.users.set(this.currentUser.id, this.currentUser);
        console.log(`[Collaboration] User set: ${this.currentUser.name}`);
        return this.currentUser;
    }

    getCurrentUser() {
        return this.currentUser;
    }

    getUser(userId) {
        return this.users.get(userId);
    }

    // ========== ROOM MANAGEMENT ==========

    createRoom(roomData = {}) {
        const roomId = roomData.id || this.generateRoomId();
        const room = {
            id: roomId,
            name: roomData.name || 'New Room',
            createdBy: this.currentUser?.id,
            createdAt: Date.now(),
            users: new Map(),
            messages: [],
            whiteboard: [],
            settings: {
                isPrivate: roomData.isPrivate || false,
                allowGuests: roomData.allowGuests !== false,
                maxUsers: roomData.maxUsers || this.settings.maxUsersPerRoom
            }
        };
        
        this.rooms.set(roomId, room);
        console.log(`[Collaboration] Room created: ${roomId}`);
        return room;
    }

    joinRoom(roomId) {
        const room = this.rooms.get(roomId);
        if (!room) {
            return { success: false, error: 'Room not found' };
        }
        
        if (room.users.size >= room.settings.maxUsers) {
            return { success: false, error: 'Room is full' };
        }
        
        if (!this.currentUser) {
            this.setUser({});
        }
        
        // Add user to room
        room.users.set(this.currentUser.id, this.currentUser);
        this.currentRoom = roomId;
        
        // Broadcast join event
        this.broadcastToRoom(roomId, {
            type: 'user:join',
            user: this.currentUser,
            timestamp: Date.now()
        });
        
        console.log(`[Collaboration] Joined room: ${roomId}`);
        return {
            success: true,
            room: this.getRoomInfo(roomId)
        };
    }

    leaveRoom() {
        if (!this.currentRoom) {
            return { success: false, error: 'Not in a room' };
        }
        
        const room = this.rooms.get(this.currentRoom);
        if (room) {
            room.users.delete(this.currentUser.id);
            
            // Broadcast leave event
            this.broadcastToRoom(this.currentRoom, {
                type: 'user:leave',
                user: this.currentUser,
                timestamp: Date.now()
            });
        }
        
        this.currentRoom = null;
        console.log('[Collaboration] Left room');
        return { success: true };
    }

    getRoom(roomId) {
        return this.rooms.get(roomId);
    }

    getRoomInfo(roomId) {
        const room = this.rooms.get(roomId);
        if (!room) return null;
        
        return {
            id: room.id,
            name: room.name,
            userCount: room.users.size,
            maxUsers: room.settings.maxUsers,
            createdAt: room.createdAt,
            isPrivate: room.settings.isPrivate
        };
    }

    getAllRooms() {
        const rooms = [];
        this.rooms.forEach((room, id) => {
            rooms.push(this.getRoomInfo(id));
        });
        return rooms;
    }

    // ========== MESSAGING ==========

    sendMessage(content, type = 'text') {
        if (!this.currentRoom) {
            return { success: false, error: 'Not in a room' };
        }
        
        const message = {
            id: this.generateId(),
            type: type,
            content: content,
            sender: this.currentUser,
            timestamp: Date.now()
        };
        
        const room = this.rooms.get(this.currentRoom);
        if (room) {
            room.messages.push(message);
            
            // Broadcast message
            this.broadcastToRoom(this.currentRoom, {
                type: 'message',
                message: message
            });
        }
        
        return { success: true, message };
    }

    getMessages(roomId, limit = 50) {
        const room = this.rooms.get(roomId);
        if (!room) return [];
        
        const messages = room.messages;
        return messages.slice(-limit);
    }

    // ========== WHITEBOARD ==========

    drawOnWhiteboard(action, data) {
        if (!this.currentRoom || !this.settings.enableWhiteboard) {
            return { success: false, error: 'Cannot draw' };
        }
        
        const room = this.rooms.get(this.currentRoom);
        if (!room) return { success: false, error: 'Room not found' };
        
        const drawAction = {
            id: this.generateId(),
            type: action,
            data: data,
            userId: this.currentUser.id,
            timestamp: Date.now()
        };
        
        room.whiteboard.push(drawAction);
        
        // Broadcast draw action
        this.broadcastToRoom(this.currentRoom, {
            type: 'whiteboard:draw',
            action: drawAction
        });
        
        return { success: true, action: drawAction };
    }

    getWhiteboardHistory(roomId) {
        const room = this.rooms.get(roomId);
        if (!room) return [];
        return room.whiteboard;
    }

    clearWhiteboard() {
        if (!this.currentRoom) return { success: false };
        
        const room = this.rooms.get(this.currentRoom);
        if (room) {
            room.whiteboard = [];
            
            this.broadcastToRoom(this.currentRoom, {
                type: 'whiteboard:clear'
            });
        }
        
        return { success: true };
    }

    // ========== CURSOR PRESENCE ==========

    updateCursor(position) {
        if (!this.currentRoom || !this.settings.enableCursor) return;
        
        this.broadcastToRoom(this.currentRoom, {
            type: 'cursor:update',
            userId: this.currentUser.id,
            position: position,
            timestamp: Date.now()
        });
    }

    // ========== WEBSOCKET CONNECTION (Optional) ==========

    async connectToServer(serverUrl) {
        if (!this.wsSupported) {
            return { success: false, error: 'WebSocket not supported' };
        }
        
        try {
            this.ws = new WebSocket(serverUrl);
            
            this.ws.onopen = () => {
                this.connected = true;
                console.log('[Collaboration] Connected to server');
                
                // Send user info
                if (this.currentUser) {
                    this.ws.send(JSON.stringify({
                        type: 'user:info',
                        user: this.currentUser
                    }));
                }
            };
            
            this.ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                this.handleServerMessage(data);
            };
            
            this.ws.onclose = () => {
                this.connected = false;
                console.log('[Collaboration] Disconnected from server');
            };
            
            this.ws.onerror = (error) => {
                console.error('[Collaboration] WebSocket error:', error);
            };
            
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    disconnectFromServer() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
            this.connected = false;
        }
    }

    handleServerMessage(data) {
        switch (data.type) {
            case 'user:join':
                if (this.onUserJoin) this.onUserJoin(data.user);
                break;
            case 'user:leave':
                if (this.onUserLeave) this.onUserLeave(data.user);
                break;
            case 'message':
                if (this.onMessage) this.onMessage(data.message);
                break;
            case 'cursor:update':
                if (this.onCursorUpdate) this.onCursorUpdate(data);
                break;
            case 'whiteboard:draw':
                if (this.onWhiteboardUpdate) this.onWhiteboardUpdate(data.action);
                break;
        }
    }

    // ========== BROADCASTING ==========

    broadcastToRoom(roomId, data) {
        // In a real implementation, this would send via WebSocket
        // For demo, we use local event system
        this.emit(`room:${roomId}`, data);
    }

    // ========== EVENTS ==========

    on(event, callback) {
        if (!this.eventListeners) {
            this.eventListeners = new Map();
        }
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(callback);
    }

    off(event, callback) {
        if (this.eventListeners && this.eventListeners.has(event)) {
            const listeners = this.eventListeners.get(event);
            const index = listeners.indexOf(callback);
            if (index !== -1) {
                listeners.splice(index, 1);
            }
        }
    }

    emit(event, data) {
        if (this.eventListeners && this.eventListeners.has(event)) {
            this.eventListeners.get(event).forEach(callback => callback(data));
        }
    }

    // ========== UTILITY ==========

    generateId() {
        return 'id_' + Math.random().toString(36).substr(2, 9);
    }

    generateRoomId() {
        return 'room_' + Math.random().toString(36).substr(2, 6);
    }

    generateColor() {
        const colors = [
            '#ef4444', '#f97316', '#f59e0b', '#84cc16', 
            '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6',
            '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
            '#ec4899', '#f43f5e'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    // ========== STATUS ==========

    getStatus() {
        return {
            inRoom: this.currentRoom !== null,
            roomId: this.currentRoom,
            userCount: this.currentRoom ? 
                this.rooms.get(this.currentRoom)?.users.size || 0 : 0,
            connected: this.connected,
            wsSupported: this.wsSupported
        };
    }

    // ========== CLEANUP ==========

    destroy() {
        this.leaveRoom();
        this.disconnectFromServer();
        this.rooms.clear();
        this.users.clear();
        this.currentUser = null;
        this.eventListeners?.clear();
        console.log('[Collaboration] Destroyed');
    }
}

// Export
window.CollaborationManager = CollaborationManager;

