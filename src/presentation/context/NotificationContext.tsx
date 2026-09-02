import React, { createContext, useContext, useEffect, useState } from 'react';
import { signalRService } from '../../data/signalrService';
import { useToast } from './ToastContext';
import { isTokenValid } from '../../data/api';

interface OrderStatusPayload {
    orderId: string;
    status: string;
    message: string;
}

interface NotificationContextType {
    lastStatusUpdate: OrderStatusPayload | null;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [lastStatusUpdate, setLastStatusUpdate] = useState<OrderStatusPayload | null>(null);
    const { showToast } = useToast();

    useEffect(() => {
        const checkLoginAndConnect = () => {
            const loggedIn = isTokenValid();
            if (!loggedIn) {
                signalRService.stop();
                return;
            }

            console.log('[SignalR] User logged in, starting connection...');
            signalRService.start();

            // Listen for status updates
            const unsubscribe = signalRService.onStatusUpdate((payload: OrderStatusPayload) => {
                setLastStatusUpdate(payload);

                switch (payload.status) {
                    case "Preparing":
                        showToast("Your order is being prepared!", "success");
                        break;

                    case "ReadyForPickup":
                        showToast("Order is ready — rider is on the way.", "info");
                        break;

                    case "PickedUp":
                        showToast("Rider collected your order! Heading your way.", "success");
                        break;

                    case "Delivered":
                        showToast("Enjoy your meal!", "success");
                        break;

                    case "Cancelled":
                    case "Rejected":
                        showToast(payload.message, "info");
                        break;
                    
                    case "RefundInitiated":
                        showToast(payload.message, "success");
                        break;

                    case "RefundFailed":
                        showToast(payload.message, "error");
                        break;

                    default:
                        console.log(`[SignalR] Status update: ${payload.status}`);
                        break;
                }
            });

            return unsubscribe;
        };

        const unsubscribe = checkLoginAndConnect();

        return () => {
            if (unsubscribe) unsubscribe();
            signalRService.stop();
        };
    }, [showToast]);

    return (
        <NotificationContext.Provider value={{ lastStatusUpdate }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};
