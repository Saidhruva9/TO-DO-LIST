let recognition = null;
if ('webkitSpeechRecognition' in window) {
    recognition = new webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
}

document.getElementById('voiceInput').addEventListener('click', () => {
    if (recognition) {
        recognition.start();
        document.getElementById('voiceInput').classList.add('listening');
    }
});

recognition.onresult = (event) => {
    const voiceText = event.results[0][0].transcript;
    document.getElementById('taskInput').value = voiceText;
    document.getElementById('voiceInput').classList.remove('listening');
};

recognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error);
    document.getElementById('voiceInput').classList.remove('listening');
};

// Request notification permission when page loads
document.addEventListener('DOMContentLoaded', () => {
    if (Notification.permission !== 'granted') {
        Notification.requestPermission();
    }
});

let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

function addTask() {
    const taskInput = document.getElementById('taskInput');
    const taskDate = document.getElementById('taskDate');
    const taskPriority = document.getElementById('taskPriority');
    
    if (taskInput.value.trim() === '' || taskDate.value === '') {
        showNotification('Please enter both task and date!', 'error');
        return;
    }

    const taskText = taskInput.value.trim();
    const taskDueDate = new Date(taskDate.value).getTime();

    if (taskText && taskDueDate > Date.now()) {
        const task = {
            text: taskText,
            dueDate: taskDueDate,
            priority: taskPriority.value,
            completed: false
        };

        tasks.push(task);
        localStorage.setItem("tasks", JSON.stringify(tasks));
        taskInput.value = "";
        taskDate.value = "";
        renderTasks();
        scheduleReminder(task);
        showNotification('Task added successfully!', 'success');
    } else {
        alert("Please enter a valid task and future date/time.");
    }
}

function renderTasks() {
    const taskList = document.getElementById("taskList");
    taskList.innerHTML = "";

    // Sort tasks by priority
    const sortedTasks = tasks.sort((a, b) => {
        const priorityOrder = { high: 1, medium: 2, low: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    sortedTasks.forEach((task, index) => {
        const taskElem = document.createElement("div");
        taskElem.className = `task task-${task.priority}`;
        const dueDate = new Date(task.dueDate).toLocaleString();
        taskElem.innerHTML = `
        <span>${task.text} (Due: ${dueDate})</span>
        <button onclick="removeTask(${index})">X</button>
      `;
        taskList.appendChild(taskElem);
    });
}

function removeTask(index) {
    tasks.splice(index, 1);
    localStorage.setItem("tasks", JSON.stringify(tasks));
    renderTasks();
    showNotification('Task completed and removed!', 'success');
}

function playReminderSound() {
    const reminderSound = document.getElementById('reminderSound');
    
    // Reset sound to start
    reminderSound.currentTime = 0;
    
    // Play with error handling
    reminderSound.play().catch(error => {
        console.error("Error playing sound:", error);
    });
}

function scheduleReminder(task) {
    const now = new Date().getTime();
    const timeUntilDue = task.dueDate - now;
    
    if (timeUntilDue > 0) {
        setTimeout(() => {
            // Play sound
            playReminderSound();
            
            // Browser notification
            if (Notification.permission === 'granted') {
                new Notification('Task Reminder', {
                    body: `Task Due: ${task.text}`,
                    icon: '/icon.png',
                    silent: true // Prevent default notification sound
                });
            }
            
            // In-app notification
            showNotification(`Task Due: ${task.text}`, 'reminder');
            
            // Auto-remove task
            const taskIndex = tasks.findIndex(t => 
                t.text === task.text && 
                t.dueDate === t.dueDate
            );
            if (taskIndex !== -1) {
                tasks[taskIndex].completed = true;
                removeTask(taskIndex);
            }
        }, timeUntilDue);
    }
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.style.backgroundColor = type === 'error' ? '#ff4444' : '#00C851';
    
    // Position at bottom
    notification.style.position = 'fixed';
    notification.style.bottom = '20px';
    notification.style.left = '50%';
    notification.style.transform = 'translateX(-50%)';
    notification.style.padding = '15px 30px';
    notification.style.borderRadius = '5px';
    notification.style.color = 'white';
    notification.style.textAlign = 'center';
    notification.style.zIndex = '1000';
    notification.style.animation = 'slideUp 0.5s ease-out';
    
    // Play sound for reminders
    if (type === 'reminder') {
        playReminderSound();
    }
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideDown 0.5s ease-out';
        setTimeout(() => notification.remove(), 500);
    }, 3000);
}

renderTasks();
