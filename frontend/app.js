const apiUrl = 'https://ulu5qou3ya.execute-api.us-east-1.amazonaws.com/dev';

async function createTask() {
  const title = document.getElementById('taskTitle').value;
  const description = document.getElementById('taskDescription').value;

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title, description }),
  });

  if (response.ok) {
    const responseData = await response.json();
    console.log('Task created:', responseData);
    alert('Task created successfully');
    getTasks(); // Refresh the list of tasks
  } else {
    alert('Failed to create task');
  }
}

async function getTasks() {
  const response = await fetch(apiUrl, {
    method: 'GET',
  });

  if (response.ok) {
    const tasks = await response.json();
    const tasksListDiv = document.getElementById('tasksList');
    tasksListDiv.innerHTML = '';

    tasks.forEach(task => {
      const taskElement = document.createElement('div');
      taskElement.innerHTML = `
                <strong>${task.title}</strong> - ${task.description}
                <button onclick="deleteTask('${task.taskId}')">Delete</button>
            `;
      tasksListDiv.appendChild(taskElement);
    });
  } else {
    alert('Failed to retrieve tasks');
  }
}

async function deleteTask(taskId) {
  const response = await fetch(`${apiUrl}/${taskId}`, {
    method: 'DELETE',
  });

  if (response.ok) {
    alert('Task deleted successfully');
    getTasks(); // Refresh the list of tasks
  } else {
    alert('Failed to delete task');
  }
}
