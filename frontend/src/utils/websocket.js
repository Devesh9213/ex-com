import { ref } from 'vue';
import { useAuthStore } from '@/stores/auth';

export function useWebSocket() {
  const socket = ref(null);
  const authStore = useAuthStore();
  const realTimeUpdates = ref([]);

  function connect() {
    const wsUrl = `ws://${window.location.hostname}:3001`;
    socket.value = new WebSocket(wsUrl);

    socket.value.onopen = () => {
      console.log('WebSocket connected');
      // Authenticate with JWT
      socket.value.send(JSON.stringify({
        type: 'auth',
        token: authStore.token
      }));
    };

    socket.value.onmessage = (event) => {
      const data = JSON.parse(event.data);
      realTimeUpdates.value.unshift(data);
      
      // Keep only last 50 updates
      if (realTimeUpdates.value.length > 50) {
        realTimeUpdates.value.pop();
      }
    };

    socket.value.onclose = () => {
      console.log('WebSocket disconnected');
      // Reconnect after 5 seconds
      setTimeout(connect, 5000);
    };
  }

  function disconnect() {
    if (socket.value) {
      socket.value.close();
    }
  }

  return {
    connect,
    disconnect,
    realTimeUpdates
  };
}