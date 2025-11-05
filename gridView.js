// Renders list-style compact cards for current workspace tasks (with complete checkbox)
(function () {
  const taskListEl = document.getElementById("task-list");

  function initialsFromEmail(email) {
    if (!email) return "U";
    const name = email.split("@")[0];
    const parts = name.split(/[._\-]/).filter(Boolean);
    if (parts.length === 0) return name.slice(0, 1).toUpperCase();
    if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  function formatDate(d) {
    if (!d) return "";
    const dt = new Date(d);
    if (isNaN(dt)) return d;
    return dt.toLocaleDateString(undefined, { day: "2-digit", month: "short" });
  }

  function makeTaskCard(task) {
    const root = document.createElement("div");
    root.className = "task-card";
    root.dataset.taskId = task.id;

    // avatar
    const avatar = document.createElement("div");
    avatar.className = "avatar";
    avatar.textContent = initialsFromEmail(task.assignedTo);

    // main body (compact format)
    const main = document.createElement("div");
    main.className = "task-main";

    const titleRow = document.createElement("div");
    titleRow.className = "task-title";

    const badge = document.createElement("div");
    badge.className = "badge";
    badge.textContent = `[${task.priority}]`;

    const title = document.createElement("div");
    title.textContent = task.title;

    titleRow.appendChild(badge);
    titleRow.appendChild(title);

    const meta = document.createElement("div");
    meta.className = "task-meta";
    meta.innerHTML = `<span>Assigned to: <strong>${task.assignedTo}</strong></span>
                      <span>|</span>
                      <span>Deadline: <strong>${formatDate(task.deadline)}</strong></span>`;

    const comment = document.createElement("div");
    comment.className = "task-comment";
    comment.innerHTML = `💬 ${task.comment || ""}`;

    const attach = document.createElement("div");
    attach.className = "task-attachment";
    if (task.attachment) {
      const a = document.createElement("a");
      a.href = task.attachment;
      a.target = "_blank";
      a.rel = "noreferrer noopener";
      a.textContent = "📎 Link / Attachment";
      attach.appendChild(a);
    }

    main.appendChild(titleRow);
    main.appendChild(meta);
    if (task.comment) main.appendChild(comment);
    if (task.attachment) main.appendChild(attach);

    // actions (edit button for managers)
    const actions = document.createElement("div");
    actions.className = "task-actions";

    const statusBtn = document.createElement("button");
    statusBtn.className = "small-btn";
    statusBtn.textContent = task.status;
    actions.appendChild(statusBtn);

    const editBtn = document.createElement("button");
    editBtn.className = "small-btn";
    editBtn.textContent = "Open";
    editBtn.title = "Open task (view / edit)";
    actions.appendChild(editBtn);
// Delete button (admin only)
if (localStorage.getItem("tezukaUserRole") === "admin") {
  const delBtn = document.createElement("button");
  delBtn.className = "small-btn";
  delBtn.textContent = "Delete";
  delBtn.title = "Delete this task";
  delBtn.addEventListener("click", () => {
    if (confirm(`Delete task: "${task.title}"?`)) {
      TaskManager.deleteTask(task.id);
      window.App.rerenderViews();
    }
  });
  actions.appendChild(delBtn);
}

    // checkbox for completed
    const checkboxWrap = document.createElement("label");
    checkboxWrap.style.marginTop = "8px";
    checkboxWrap.innerHTML = `<input type="checkbox" ${task.completed ? "checked" : ""} data-id="${task.id}" /> Mark Complete`;
    actions.appendChild(checkboxWrap);

    // open on click (delegated)
    editBtn.addEventListener("click", () => {
      document.dispatchEvent(new CustomEvent("openTaskModal", { detail: { taskId: task.id } }));
    });

    // checkbox toggle
    checkboxWrap.querySelector("input").addEventListener("change", (e) => {
      const id = parseInt(e.target.dataset.id, 10);
      TaskManager.toggleTaskComplete(id, e.target.checked);
      // if checked -> ensure status is Completed
      if (e.target.checked) TaskManager.updateTaskStatus(id, "Completed");
      else TaskManager.updateTaskStatus(id, "To Start");
      window.App.rerenderViews();
    });

    // visual dim for completed
    if (task.completed) {
      root.style.opacity = "0.65";
    }

    root.appendChild(avatar);
    root.appendChild(main);
    root.appendChild(actions);

    return root;
  }

  function render(tasks) {
    taskListEl.innerHTML = "";
    if (!tasks || tasks.length === 0) {
      const p = document.createElement("div");
      p.className = "task-card";
      p.style.justifyContent = "center";
      p.textContent = "No tasks yet — click + Add Task";
      taskListEl.appendChild(p);
      return;
    }
    tasks.forEach((t) => {
      const card = makeTaskCard(t);
      taskListEl.appendChild(card);
    });
  }

  window.GridView = { render };
})();
