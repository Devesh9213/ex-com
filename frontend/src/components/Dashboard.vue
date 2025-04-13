<template>
  <div class="dashboard-container">
    <h2>Welcome to your Dashboard</h2>
    <p v-if="authStore.user">Hello, {{ authStore.user.username }} ({{ authStore.user.role }})</p>

    <AdminPanel v-if="authStore.user?.role === 'admin'" />

    <!-- Time Tracking Section -->
    <div class="time-tracking">
      <div class="status-card" :class="{ 'active': currentStatus !== 'logged_in' }">
        <h3>Current Status</h3>
        <p class="status">{{ currentStatus }}</p>
        <p class="duration">{{ formattedDuration }}</p>
      </div>

      <div class="action-buttons">
        <button v-if="currentStatus === 'logged_in'" @click="startWorking" class="btn-primary">Start Work</button>
        <button v-if="currentStatus === 'working'" @click="takeBreak" class="btn-secondary">Take Break</button>
        <button v-if="currentStatus === 'break'" @click="endBreak" class="btn-primary">End Break</button>
      </div>
    </div>

    <!-- Today's Summary -->
    <div class="daily-summary">
      <h3>Today's Activity</h3>
      <div class="summary-grid">
        <div class="summary-item">
          <span class="label">Login Time</span>
          <span class="value">{{ formatTime(loginTime) }}</span>
        </div>
        <div class="summary-item">
          <span class="label">Work Duration</span>
          <span class="value">{{ formatDuration(workDuration) }}</span>
        </div>
        <div class="summary-item">
          <span class="label">Break Duration</span>
          <span class="value">{{ formatDuration(breakDuration) }}</span>
        </div>
        <div class="summary-item">
          <span class="label">Break Count</span>
          <span class="value">{{ breakCount }}</span>
        </div>
      </div>
    </div>

    <button @click="authStore.logout" class="btn-danger">Logout</button>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { io } from 'socket.io-client';
import AdminPanel from '@/components/AdminPanel.vue';

const authStore = useAuthStore();
const currentStatus = ref('logged_in');
const statusStartTime = ref(new Date());
const currentDuration = ref(0);
const loginTime = ref(new Date());
const workDuration = ref(0);
const breakDuration = ref(0);
const breakCount = ref(0);
let timerInterval = null;

const socket = io('http://localhost:3001');

onMounted(() => {
  // Emit initial presence
  socket.emit('user-online', {
    id: authStore.user.id,
    username: authStore.user.username,
    role: authStore.user.role,
    status: currentStatus.value,
  });

  startTimer();
});

onBeforeUnmount(() => {
  clearInterval(timerInterval);
  socket.disconnect();
});

const startTimer = () => {
  timerInterval = setInterval(() => {
    currentDuration.value = Math.floor((new Date() - statusStartTime.value) / 1000);
  }, 1000);
};

const formatDuration = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
};

const formatTime = (date) => {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formattedDuration = computed(() => formatDuration(currentDuration.value));

const startWorking = () => updateStatus('working');
const takeBreak = () => {
  updateStatus('break');
  breakCount.value++;
};
const endBreak = () => updateStatus('working');

// ✅ FIXED: Now emits full user data on status update
const updateStatus = (newStatus) => {
  const now = new Date();
  const duration = Math.floor((now - statusStartTime.value) / 1000);

  if (currentStatus.value === 'working') workDuration.value += duration;
  else if (currentStatus.value === 'break') breakDuration.value += duration;

  currentStatus.value = newStatus;
  statusStartTime.value = now;
  currentDuration.value = 0;

  socket.emit('status-update', {
    id: authStore.user.id,
    username: authStore.user.username,
    role: authStore.user.role,
    status: newStatus,
  });
};
</script>


<style scoped>
.dashboard-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.time-tracking {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 30px 0;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.status-card {
  padding: 15px;
  border-radius: 8px;
  background-color: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  min-width: 200px;
}

.status-card.active {
  background-color: #e3f2fd;
  border-left: 4px solid #2196f3;
}

.status {
  font-size: 1.5rem;
  font-weight: bold;
  margin: 5px 0;
}

.duration {
  font-size: 1.2rem;
  color: #666;
}

.action-buttons {
  display: flex;
  gap: 10px;
}

.btn-primary, .btn-secondary, .btn-danger {
  padding: 10px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.3s;
}

.btn-primary {
  background-color: #2196f3;
  color: white;
}

.btn-secondary {
  background-color: #ffc107;
  color: #333;
}

.btn-danger {
  background-color: #f44336;
  color: white;
  margin-top: 20px;
}

.daily-summary {
  margin: 30px 0;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
}

.summary-item {
  background-color: white;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.label {
  display: block;
  font-size: 0.9rem;
  color: #666;
}

.value {
  display: block;
  font-size: 1.2rem;
  font-weight: bold;
}

.admin-section {
  margin-top: 20px;
  padding: 15px;
  background-color: #f0f0f0;
  border-radius: 5px;
}
</style>