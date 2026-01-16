import { Server, Socket } from 'socket.io';

class SocketService {
    private io: Server | null = null;

    init(io: Server) {
        this.io = io;
    }

    // Sender melding til alle enheter i brukerens "rom"
    sendToUser(userId: string, event: string, data: any) {
        if (this.io) {
            console.log(`[Socket] Sender '${event}' til rom 'user:${userId}'`);
            this.io.to(`user:${userId}`).emit(event, data);
            return true;
        }
        console.warn(`[Socket] Kunne ikke sende melding. Socket.io er ikke initialisert.`);
        return false;
    }
}

export const socketService = new SocketService();
