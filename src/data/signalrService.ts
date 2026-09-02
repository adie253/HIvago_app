import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';

const BASE_URL = 'https://rally-staging-9ae8.up.railway.app';

const HUB_URL = `${BASE_URL}/hubs/notifications`;

class SignalRService {
    private connection: HubConnection | null = null;
    private onStatusUpdateCallbacks: Array<(payload: any) => void> = [];

    public async start(): Promise<void> {
        if (this.connection && this.connection.state !== 'Disconnected') return;

        const token = localStorage.getItem('customer_token');
        if (!token) {
            console.warn('[SignalR] No customer_token found, skipping connection.');
            return;
        }

        this.connection = new HubConnectionBuilder()
            .withUrl(HUB_URL, {
                accessTokenFactory: () => localStorage.getItem('customer_token') || ''
            })
            .withAutomaticReconnect([2000, 5000, 10000, 30000]) // Removed 0 for immediate retry
            .configureLogging(LogLevel.Warning)
            .build();

        this.connection.on('OrderStatusUpdate', (payload) => {
            console.log('[SignalR] OrderStatusUpdate received:', payload);
            this.onStatusUpdateCallbacks.forEach(cb => cb(payload));
        });

        try {
            await this.connection.start();
            console.log('[SignalR] Connected successfully');
        } catch (err: any) {
            console.error('[SignalR] Connection failed: ', err);
            
            // If it's a 401 Unauthorized, don't retry automatically
            if (err.statusCode === 401) {
                console.error('[SignalR] Unauthorized (401). Stopping retries.');
                return;
            }

            // Retry after 10s if other initial start fails
            setTimeout(() => this.start(), 10000);
        }
    }

    public onStatusUpdate(callback: (payload: any) => void) {
        this.onStatusUpdateCallbacks.push(callback);
        return () => {
            this.onStatusUpdateCallbacks = this.onStatusUpdateCallbacks.filter(cb => cb !== callback);
        };
    }

    public stop() {
        if (this.connection) {
            this.connection.stop();
            this.connection = null;
        }
    }
}

export const signalRService = new SignalRService();
