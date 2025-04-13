<template>
  <div class="admin-section">
    <h3>Admin Panel</h3>
    <div class="live-status-container">
      <h4>🟢 Live Employee Status</h4>
      <table class="live-status">
        <thead>
          <tr>
            <th>Username</th>
            <th>Status</th>
            <th>Last Updated</th>
            <th>Role</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in liveUsers" :key="user.username">
            <td>{{ user.username }}</td>
            <td>{{ user.status }}</td>
            <td>{{ formatTime(user.time) }}</td>
            <td>{{ user.role }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { io } from 'socket.io-client';

const authStore = useAuthStore();
const liveUsers = ref([]);
let socket = null;

const formatTime = (timestamp) => {
  if (!timestamp) return '-';
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

onMounted(() => {
  socket = io('http://localhost:3001'); // ✅ Match your backend port

  socket.on('connect', () => {
    console.log('✅ Admin connected to socket');

    socket.emit('user-online', {
      id: authStore.user.id,
      username: authStore.user.username,
      role: authStore.user.role,
      status: 'admin',
    });
  });

  socket.on('live-users', (users) => {
    console.log('📡 Received live users:', users);
    liveUsers.value = users;
  });

  socket.on('disconnect', () => {
    console.log('🔌 Disconnected from socket');
  });
});

onBeforeUnmount(() => {
  if (socket) socket.disconnect();
});
</script>

<style scoped>
.admin-section {
  margin-top: 30px;
  padding: 20px;
  background: #f4f6f9;
  border-radius: 8px;
  border-left: 4px solid #4a6fa5;
}

.live-status-container {
  margin-top: 20px;
}

.live-status {
  width: 100%;
  border-collapse: collapse;
  background: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  border-radius: 8px;
  overflow: hidden;
}

.live-status th,
.live-status td {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.live-status th {
  background-color: #f1f1f1;
  font-weight: 600;
}
</style>
