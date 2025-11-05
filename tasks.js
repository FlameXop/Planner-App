// TaskManager – manages workspaces, tasks, notifications (localStorage)
const TaskManager = (function () {
  const STORAGE_KEY = "tezuka_state_v1";

  const defaultState = {
    workspaces: {
      1: { id: 1, name: "Workspace 1", tasks: [], notifications: [] },
    },
    activeWorkspace: 1,
    nextTaskId: 1,
  };

  // ---------- Persistence ----------
  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return JSON.parse(JSON.stringify(defaultState));
      const parsed = JSON.parse(raw);

      parsed.workspaces =
        parsed.workspaces ||
        { 1: { id: 1, name: "Workspace 1", tasks: [], notifications: [] } };
      parsed.activeWorkspace = parsed.activeWorkspace || 1;
      parsed.nextTaskId = parsed.nextTaskId || 1;

      return parsed;
    } catch (err) {
      console.warn("Failed loading state:", err);
      return JSON.parse(JSON.stringify(defaultState));
    }
  }

  let state = loadState();

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      console.warn("Failed saving state:", err);
    }
  }

  // ---------- Workspace ----------
  function getActiveWorkspace() {
    return state.workspaces[state.activeWorkspace];
  }

  function setActiveWorkspace(id) {
    if (!state.workspaces[id]) return false;
    state.activeWorkspace = id;
    saveState();
    return true;
  }

  function getNextWorkspaceId() {
    const ids = Object.keys(state.workspaces).map(Number);
    return ids.length ? Math.max(...ids) + 1 : 1;
  }

  function addWorkspace(name) {
    const id = getNextWorkspaceId();
    state.workspaces[id] = {
      id,
      name: name || `Workspace ${id}`,
      tasks: [],
      notifications: [],
    };
    saveState();
    return state.workspaces[id];
  }

  function deleteWorkspace(id) {
    // ❗ Workspace 1 cannot be deleted
    if (id === 1) return false;
    if (!state.workspaces[id]) return false;

    delete state.workspaces[id];

    // Fix active workspace if needed
    if (!state.workspaces[state.activeWorkspace]) {
      const keys = Object.keys(state.workspaces);
      state.activeWorkspace = keys.length ? parseInt(keys[0]) : 1;
    }

    // If somehow everything was removed (shouldn’t happen), recreate Workspace 1
    if (!Object.keys(state.workspaces).length) {
      state.workspaces[1] = { id: 1, name: "Workspace 1", tasks: [], notifications: [] };
      state.activeWorkspace = 1;
    }

    saveState();
    return true;
  }

  function getWorkspaces() {
    return Object.values(state.workspaces);
  }

  function getWorkspaceById(id) {
    return state.workspaces[id];
  }

  // ---------- Tasks ----------
  function addTask(payload) {
    const ws = getActiveWorkspace();
    const task = {
      id: state.nextTaskId++,
      title: payload.title || "Untitled",
      deadline: payload.deadline || "",
      assignedTo: payload.assignedTo || "",
      priority: payload.priority || "To Start",
      comment: payload.comment || "",
      attachment: payload.attachment || "",
      status:
        payload.status ||
        (payload.priority === "In Progress" ? "In Progress" : "To Start"),
      createdAt: new Date().toISOString(),
      createdBy: payload.createdBy || null, // admin who created/edited
      completed: !!payload.completed,
    };

    ws.tasks.unshift(task);

    // 🔔 Notify ONLY the assignee, not the admin/creator
    if (task.assignedTo && task.assignedTo !== task.createdBy) {
      ws.notifications.unshift({
        id: `n-${Date.now()}`,
        type: "assigned",
        taskId: task.id,
        title: `Task assigned: ${task.title}`,
        to: task.assignedTo,
        createdAt: new Date().toISOString(),
        read: false,
      });
    }

    saveState();
    return task;
  }

  function editTask(taskId, updates) {
    const ws = getActiveWorkspace();
    const t = ws.tasks.find((x) => x.id === taskId);
    if (!t) return null;

    const prevAssignee = t.assignedTo;
    Object.assign(t, updates);

    // If completed via edit → notify admin (creator)
    if (t.status === "Completed" && t.assignedTo !== t.createdBy) {
      ws.notifications.unshift({
        id: `n-${Date.now()}`,
        type: "completed",
        taskId: t.id,
        title: `Task completed: ${t.title}`,
        to: t.createdBy, // admin who created it
        createdAt: new Date().toISOString(),
        read: false,
      });
    }

    // If reassigned → notify new assignee only
    if (updates.assignedTo && updates.assignedTo !== prevAssignee) {
      ws.notifications.unshift({
        id: `n-${Date.now()}`,
        type: "reassigned",
        taskId: t.id,
        title: `Task reassigned: ${t.title}`,
        to: t.assignedTo,
        createdAt: new Date().toISOString(),
        read: false,
      });
    }

    saveState();
    return t;
  }

function updateTaskStatus(taskId, newStatus) {
  const ws = getActiveWorkspace();
  const t = ws.tasks.find((x) => x.id === taskId);
  if (!t) return null;

  // Update task state
  t.status = newStatus;
  t.completed = newStatus === "Completed";

  // 🔔 Notify ADMIN when task is completed by employee
  // Ensure we only notify the admin who created it, not the employee themselves
  if (t.completed && t.createdBy && t.assignedTo !== t.createdBy) {
    ws.notifications.unshift({
      id: `n-${Date.now()}`,
      type: "completed",
      title: `Task "${t.title}" has been completed`,
      to: t.createdBy, // Admin's email
      createdAt: new Date().toISOString(),
      read: false,
    });

    // Optional browser notification for admin
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("Task Completed", {
        body: `Task "${t.title}" has been marked completed by ${t.assignedTo}`,
      });
    }
  }

  saveState();

  // 🔄 Trigger live re-render across tabs (admin sees instantly)
  try {
    const evt = new Event("storage");
    evt.key = "tezuka_state_v1";
    window.dispatchEvent(evt);
  } catch (err) {
    console.warn("Storage event dispatch failed", err);
  }

  return t;
}


  function toggleTaskComplete(taskId, completed) {
    return editTask(taskId, {
      completed,
      status: completed ? "Completed" : "To Start",
    });
  }

  function deleteTask(taskId) {
    const ws = getActiveWorkspace();
    const idx = ws.tasks.findIndex((x) => x.id === taskId);
    if (idx >= 0) {
      ws.tasks.splice(idx, 1);
      saveState();
      return true;
    }
    return false;
  }

  function getTasksForActive() {
    const ws = getActiveWorkspace();
    return ws ? ws.tasks : [];
  }

  // ---------- Notifications ----------
  function getNotificationsForActive() {
    const ws = getActiveWorkspace();
    return ws ? ws.notifications : [];
  }

  function markNotificationsRead() {
    const ws = getActiveWorkspace();
    ws.notifications.forEach((n) => (n.read = true));
    saveState();
  }

  function clearNotifications() {
    const ws = getActiveWorkspace();
    ws.notifications = [];
    saveState();
  }

  function addNotification(email, title) {
    const ws = getActiveWorkspace();
    ws.notifications.unshift({
      id: `n-${Date.now()}`,
      title,
      to: email,
      createdAt: new Date().toISOString(),
      read: false,
    });
    saveState();
  }

  // ---------- Export / Import (optional) ----------
  function exportState() {
    return JSON.stringify(state);
  }

  function importState(json) {
    try {
      const parsed = JSON.parse(json);
      if (parsed) {
        state = parsed;
        saveState();
        return true;
      }
    } catch (e) {
      console.warn("Import failed:", e);
    }
    return false;
  }

  // ---------- Public API ----------
  return {
    // workspaces
    getActiveWorkspace,
    setActiveWorkspace,
    getNextWorkspaceId,
    addWorkspace,
    deleteWorkspace,
    getWorkspaces,
    getWorkspaceById,

    // tasks
    addTask,
    editTask,
    updateTaskStatus,
    toggleTaskComplete,
    deleteTask,
    getTasksForActive,

    // notifications
    getNotificationsForActive,
    markNotificationsRead,
    clearNotifications,
    addNotification,

    // debugging
    exportState,
    importState,
  };
})();
