import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useUserStore } from '../stores/userStore';
import { BASE_URL } from '../api/api';

interface SocketContextData {
    socket: Socket | null;
}

const SocketContext = createContext<SocketContextData>({ socket: null });

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
    const { accessToken } = useUserStore();
    const [socket, setSocket] = useState<Socket | null>(null);

    useEffect(() => {
        if (!accessToken) {
            if (socket) {
                socket.disconnect();
                setSocket(null);
            }
            return;
        }

        const socketInstance = io(BASE_URL, {
            auth: {
                token: accessToken,
            },
            // Ensure we use websocket transport for better performance if possible
            transports: ['websocket', 'polling'],
        });

        socketInstance.on('connect', () => {
            console.log('Socket connected successfully with ID:', socketInstance.id);
        });

        socketInstance.on('connect_error', (err) => {
            console.error('Socket connection error:', err);
        });

        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
            console.log('Socket disconnected');
        };
    }, [accessToken]);

    return (
        <SocketContext.Provider value={{ socket }}>
            {children}
        </SocketContext.Provider>
    );
};
