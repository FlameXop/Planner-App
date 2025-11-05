// app.js — stable localStorage version with working header UI, notifications,
// role rules, workspace tabs, grid/kanban switching, and cross-tab updates.
(function () {
  // --------- AUTH ----------
  const roleKey = "tezukaUserRole";
  const emailKey = "tezukaUserEmail";
  const userRole = localStorage.getItem(roleKey);
  const userEmail = localStorage.getItem(emailKey);

  if (!userRole || !userEmail) {
    window.location.href = "login.html";
    return;
  }

  const currentUser = {
    name: localStorage.getItem("userName") || userEmail.split("@")[0],
    email: userEmail,
    role: userRole, // "admin" | "employee"
    pic: localStorage.getItem("tezukaUserPic") || "👤",
  };

  // --------- DOM ----------
  const roleDisplay = document.getElementById("roleDisplay");
  const tabsContainer = document.getElementById("workspace-tabs");
  const addTaskBtn = document.getElementById("add-task-btn");
  const addWorkspaceBtn = document.getElementById("add-workspace-btn");
  const gridBtn = document.getElementById("grid-view-btn");
  const kanbanBtn = document.getElementById("kanban-view-btn");
  const gridView = document.getElementById("grid-view");
  const kanbanView = document.getElementById("kanban-view");
  const taskModal = document.getElementById("task-modal");
  const taskForm = document.getElementById("task-form");
  const cancelTaskBtn = document.getElementById("cancel-task");
  const toast = document.getElementById("toast");

  if (roleDisplay) roleDisplay.textContent = `Role: ${currentUser.role}`;

  function showToast(msg, ms = 1800) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.remove("hidden");
    setTimeout(() => toast.classList.add("hidden"), ms);
  }

  const canEdit = () => currentUser.role === "admin";

  // disable creation for employees
  window.addEventListener("DOMContentLoaded", () => {
    if (!canEdit()) {
      [addTaskBtn, addWorkspaceBtn].forEach((b) => {
        if (!b) return;
        b.disabled = true;
        b.classList.add("opacity-50", "cursor-not-allowed");
      });
    }
  });

  // --------- HEADER (inject Notification + Profile UI) ----------
  const headerRight = document.querySelector(".header-right");
  if (headerRight) {
    headerRight.innerHTML = `
      <div style="display:flex;align-items:center;gap:18px;position:relative;">
        <div id="notif-wrap" style="position:relative;">
          <span id="notifications-btn" style="cursor:pointer;font-size:1.3rem;">🔔</span>
          <span id="notif-count" class="hidden"
                style="position:absolute;top:-6px;right:-8px;background:#e00;color:#fff;
                       font-size:0.75rem;font-weight:700;border-radius:999px;padding:1px 6px;">0</span>
          <div id="notif-panel" class="notif-dropdown hidden"
               style="position:absolute;right:0;top:28px;background:#111;border:1px solid #333;
                      border-radius:8px;padding:10px;width:260px;z-index:999;box-shadow:0 6px 16px rgba(0,0,0,.5);">
            <div id="notif-list" style="max-height:220px;overflow:auto;"></div>
            <button id="clear-notifs" class="clear-btn" style="margin-top:8px;">Clear Notifications</button>
          </div>
        </div>
        <div id="profile-wrap" style="position:relative;">
          <span id="profile-btn" style="cursor:pointer;font-size:1.4rem;">${currentUser.pic}</span>
          <div id="profile-dropdown" class="notif-dropdown hidden"
               style="position:absolute;right:0;top:28px;background:#111;border:1px solid #333;
                      border-radius:8px;padding:12px;width:240px;z-index:999;box-shadow:0 6px 16px rgba(0,0,0,.5);">
            <div style="display:flex;gap:10px;align-items:center;margin-bottom:10px;">
              <span style="font-size:2rem;">${currentUser.pic}</span>
              <div>
                <div style="font-weight:700">${currentUser.name}</div>
                <div style="font-size:.85rem;color:#aaa">${currentUser.email}</div>
              </div>
            </div>
            <button id="update-pic" class="clear-btn" style="margin-bottom:6px;">Update Profile</button>
            <button id="logout-btn" class="clear-btn">Logout</button>
          </div>
        </div>
      </div>
    `;
  }

  // header refs after injection
  const notifBtn = document.getElementById("notifications-btn");
  const notifCount = document.getElementById("notif-count");
  const notifPanel = document.getElementById("notif-panel");
  const notifList = document.getElementById("notif-list");
  const clearNotifsBtn = document.getElementById("clear-notifs");
  const profileBtn = document.getElementById("profile-btn");
  const profileDropdown = document.getElementById("profile-dropdown");
  const logoutBtn = document.getElementById("logout-btn");
  const updatePicBtn = document.getElementById("update-pic");

  // profile dropdown
  if (profileBtn) {
    profileBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      profileDropdown.classList.toggle("hidden");
      if (!notifPanel.classList.contains("hidden")) notifPanel.classList.add("hidden");
    });
  }
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem(roleKey);
      localStorage.removeItem(emailKey);
      window.location.href = "login.html";
    });
  }
  if (updatePicBtn) {
    updatePicBtn.addEventListener("click", () => {
      const newName = prompt("Enter display name:", currentUser.name);
      const newPic = prompt("Enter emoji or image URL:", currentUser.pic);
      if (newName) localStorage.setItem("userName", newName);
      if (newPic) localStorage.setItem("tezukaUserPic", newPic);
      showToast("Profile updated");
      setTimeout(() => location.reload(), 400);
    });
  }
  document.addEventListener("click", (e) => {
    if (profileDropdown && !profileDropdown.classList.contains("hidden")) {
      const inside = profileDropdown.contains(e.target) || (profileBtn && profileBtn.contains(e.target));
      if (!inside) profileDropdown.classList.add("hidden");
    }
    if (notifPanel && !notifPanel.classList.contains("hidden")) {
      const inside = notifPanel.contains(e.target) || (notifBtn && notifBtn.contains(e.target));
      if (!inside) notifPanel.classList.add("hidden");
    }
  });

  // --------- VIEWS (grid/kanban) ----------
  function setActiveView(view) {
    if (!gridView || !kanbanView) return;
    if (view === "grid") {
      gridBtn.classList.add("active");
      kanbanBtn.classList.remove("active");
      gridView.classList.add("active-view");
      kanbanView.classList.remove("active-view");
    } else {
      kanbanBtn.classList.add("active");
      gridBtn.classList.remove("active");
      kanbanView.classList.add("active-view");
      gridView.classList.remove("active-view");
    }
  }
  if (gridBtn) gridBtn.addEventListener("click", () => setActiveView("grid"));
  if (kanbanBtn) kanbanBtn.addEventListener("click", () => setActiveView("kanban"));

  // --------- WORKSPACES ----------
  function createWorkspaceTab(ws) {
    const tab = document.createElement("div");
    tab.className = "workspace-tab";
    tab.dataset.ws = ws.id;
    tab.style.display = "flex";
    tab.style.alignItems = "center";
    tab.style.gap = "6px";
    tab.innerHTML = `<span>${ws.name}</span>`;

    // delete button (admin only, not Workspace 1)
    if (canEdit() && ws.id !== 1) {
      const del = document.createElement("button");
      del.textContent = "🗑️";
      del.style.border = "none";
      del.style.background = "transparent";
      del.style.cursor = "pointer";
      del.title = "Delete Workspace";
      del.addEventListener("click", (e) => {
        e.stopPropagation();
        if (confirm(`Delete ${ws.name}?`)) {
          TaskManager.deleteWorkspace(ws.id);
          renderWorkspaces();
          App.rerenderViews();
          renderNotifList();
          showToast("Workspace deleted");
        }
      });
      tab.appendChild(del);
    }

    tab.addEventListener("click", () => {
      document.querySelectorAll(".workspace-tab").forEach((b) => b.classList.remove("active"));
      tab.classList.add("active");
      TaskManager.setActiveWorkspace(ws.id);
      App.rerenderViews();
      renderNotifList();
    });

    return tab;
  }

  function renderWorkspaces() {
    if (!tabsContainer) return;
    tabsContainer.innerHTML = "";
    TaskManager.getWorkspaces().forEach((ws) => tabsContainer.appendChild(createWorkspaceTab(ws)));
    const active = TaskManager.getActiveWorkspace();
    if (active) {
      const btn = document.querySelector(`.workspace-tab[data-ws="${active.id}"]`);
      if (btn) btn.classList.add("active");
    }
  }

  if (addWorkspaceBtn) {
    addWorkspaceBtn.addEventListener("click", () => {
      if (!canEdit()) return showToast("Only admins can create workspaces.");
      // name from TaskManager (it may already handle numbering)
      const ws = TaskManager.addWorkspace();
      tabsContainer.appendChild(createWorkspaceTab(ws));
      TaskManager.setActiveWorkspace(ws.id);
      App.rerenderViews();
      renderNotifList();
    });
  }

  // --------- TASK MODAL ----------
  if (addTaskBtn) {
    addTaskBtn.addEventListener("click", () => {
      if (!canEdit()) return showToast("Only admins can create tasks.");
      if (!taskForm) return;
      taskForm.reset();
      const idInput = taskForm.querySelector('[name="taskId"]');
      if (idInput) idInput.value = "";
      document.getElementById("modal-title").textContent = "Create Task";
      taskModal.classList.remove("hidden");
    });
  }

  if (cancelTaskBtn) {
    cancelTaskBtn.addEventListener("click", () => {
      taskModal.classList.add("hidden");
      taskForm.reset();
    });
  }

  // open modal from views
  document.addEventListener("openTaskModal", (ev) => {
    const { taskId } = ev.detail || {};
    const ws = TaskManager.getActiveWorkspace();
    const task = ws && ws.tasks ? ws.tasks.find((t) => t.id === taskId) : null;
    if (!task) return;

    if (currentUser.role === "employee" && task.assignedTo !== currentUser.email) {
      showToast("You can only view tasks assigned to you.");
      return;
    }

    taskForm.querySelector('[name="taskId"]').value = task.id;
    taskForm.querySelector('[name="title"]').value = task.title || "";
    taskForm.querySelector('[name="deadline"]').value = task.deadline || "";
    taskForm.querySelector('[name="assignedTo"]').value = task.assignedTo || "";
    taskForm.querySelector('[name="priority"]').value = task.priority || "To Start";
    taskForm.querySelector('[name="comment"]').value = task.comment || "";
    taskForm.querySelector('[name="attachment"]').value = task.attachment || "";
    document.getElementById("modal-title").textContent = canEdit() ? "Edit Task" : "View Task";
    taskModal.classList.remove("hidden");
  });

  if (taskForm) {
    taskForm.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!canEdit()) {
        showToast("You cannot edit tasks.");
        taskModal.classList.add("hidden");
        return;
      }

      const fd = new FormData(taskForm);
      const id = fd.get("taskId");
      const payload = {
        title: (fd.get("title") || "").trim(),
        deadline: fd.get("deadline") || "",
        assignedTo: (fd.get("assignedTo") || "").trim(),
        priority: fd.get("priority") || "To Start",
        comment: (fd.get("comment") || "").trim(),
        attachment: (fd.get("attachment") || "").trim(),
        status: fd.get("priority") === "In Progress" ? "In Progress" : "To Start",
        createdBy: currentUser.email,
      };

      if (!payload.title || !payload.assignedTo) {
        showToast("Title and assigned email required");
        return;
      }

      if (!id) {
        TaskManager.addTask(payload); // TaskManager will push notification to assignee (not admin)
        showToast("Task added");
      } else {
        const tid = parseInt(id, 10);
        const updated = TaskManager.editTask(tid, payload);
        showToast(updated ? "Task updated" : "Update failed");
      }

      taskForm.reset();
      taskModal.classList.add("hidden");
      App.rerenderViews();
      renderNotifList();
    });
  }

  // --------- NOTIFICATIONS ----------
  // Ask permission once for native notifications
  if ("Notification" in window && Notification.permission === "default") {
    try { Notification.requestPermission(); } catch (_) {}
  }

  function renderNotifList() {
    if (!notifList) return;
    notifList.innerHTML = "";

    // Filter notifications belonging to this user (by email)
    const all = TaskManager.getNotificationsForActive() || [];
    const items = all.filter((n) => n.to === currentUser.email);

    if (items.length === 0) {
      const el = document.createElement("div");
      el.className = "no-notifs";
      el.textContent = "No notifications";
      notifList.appendChild(el);
      if (notifCount) notifCount.classList.add("hidden");
      if (clearNotifsBtn) clearNotifsBtn.style.display = "none";
      return;
    }

    if (clearNotifsBtn) clearNotifsBtn.style.display = "";

    items.forEach((n) => {
      const el = document.createElement("div");
      el.className = "notif-item";
      el.innerHTML = `
        <div class="notif-title">${n.title}</div>
        <div class="notif-meta">${new Date(n.createdAt).toLocaleString()}</div>
      `;
      notifList.appendChild(el);
    });

    renderNotifCount(items);
  }

  function renderNotifCount(itemsMaybe) {
    if (!notifCount) return;
    const all = itemsMaybe || (TaskManager.getNotificationsForActive() || []).filter(n => n.to === currentUser.email);
    const unread = all.filter((i) => !i.read).length;
    if (unread > 0) {
      notifCount.textContent = String(unread);
      notifCount.classList.remove("hidden");
    } else {
      notifCount.classList.add("hidden");
    }
  }

  if (notifBtn) {
    notifBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const hidden = notifPanel.classList.contains("hidden");
      if (hidden) {
        TaskManager.markNotificationsRead(); // mark all read
        renderNotifList();                   // refresh (badge will hide)
        notifPanel.classList.remove("hidden");
      } else {
        notifPanel.classList.add("hidden");
      }
    });
  }

  if (clearNotifsBtn) {
    clearNotifsBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const ws = TaskManager.getActiveWorkspace();
      if (ws) ws.notifications = (ws.notifications || []).filter(n => n.to !== currentUser.email);
      TaskManager.markNotificationsRead(); // persist
      renderNotifList();
      notifPanel.classList.add("hidden");
    });
  }

  // --------- CROSS-TAB LIVE UPDATE ----------
  // When any other tab modifies localStorage state, re-render here.
  window.addEventListener("storage", (e) => {
    if (e.key === "tezuka_state_v1") {
      App.rerenderViews();
      renderNotifList();
    }
  });

  // --------- INIT ----------
  window.addEventListener("load", () => {
    renderWorkspaces();
    App.rerenderViews();
    renderNotifList();
    // default visible view is Grid (as per your HTML)
    setActiveView("grid");
  });

  // --------- APP GLOBAL ----------
  window.App = {
    rerenderViews: function () {
      const tasks = TaskManager.getTasksForActive();
      const viewTasks =
        currentUser.role === "employee"
          ? tasks.filter((t) => t.assignedTo === currentUser.email)
          : tasks;
      GridView.render(viewTasks);
      KanbanView.render(viewTasks);
      renderNotifCount(); // update count on any rerender
    },
  };
})();
