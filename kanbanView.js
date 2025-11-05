// Simple Kanban renderer + HTML5 drag & drop, cards show same compact details as grid and include checkbox
(function () {
  const kanbanBoardEl = document.getElementById("kanban-board");

  const COLUMNS = [
    { key: "To Start", title: "To Start" },
    { key: "In Progress", title: "In Progress" },
    { key: "Completing", title: "Completing" },
    { key: "Completed", title: "Completed" },
    { key: "Unimportant", title: "Unimportant" },
  ];

  function formatDate(d) {
    if (!d) return "";
    const dt = new Date(d);
    if (isNaN(dt)) return d;
    return dt.toLocaleDateString(undefined, { day: "2-digit", month: "short" });
  }

  function createCardEl(task) {
    const el = document.createElement("div");
    el.className = "kanban-card";
    el.draggable = true;
    el.dataset.id = task.id;

    const badge = document.createElement("span");
    badge.className = "badge";
    badge.style.padding = "4px 8px";
    badge.textContent = `[${task.priority}]`;

    const title = document.createElement("div");
    title.className = "k-title";
    title.style.fontWeight = "700";
    title.style.marginTop = "6px";
    title.textContent = task.title;

    const meta = document.createElement("div");
    meta.className = "k-meta";
    meta.style.fontSize = "0.85rem";
    meta.style.marginTop = "8px";
    meta.style.color = "#9a9a9a";
    meta.textContent = `${task.assignedTo} • ${task.deadline ? formatDate(task.deadline) : "No deadline"}`;

    const comment = document.createElement("div");
    comment.style.marginTop = "8px";
    comment.style.color = "var(--accent)";
    comment.textContent = task.comment ? `💬 ${task.comment}` : "";

    const attach = document.createElement("div");
    attach.style.marginTop = "6px";
    if (task.attachment) {
      const a = document.createElement("a");
      a.href = task.attachment;
      a.target = "_blank";
      a.rel = "noreferrer noopener";
      a.textContent = "📎 Link / Attachment";
      attach.appendChild(a);
    }

    // header area (badge + title)
    const head = document.createElement("div");
    head.style.display = "flex";
    head.style.justifyContent = "space-between";
    head.appendChild(badge);
    head.appendChild(title);

    // checkbox
    const chkWrap = document.createElement("label");
    chkWrap.style.display = "block";
    chkWrap.style.marginTop = "8px";
    chkWrap.innerHTML = `<input type="checkbox" data-id="${task.id}" ${task.completed ? "checked" : ""} /> Mark Complete`;
    chkWrap.querySelector("input").addEventListener("change", (e) => {
      const id = parseInt(e.target.dataset.id, 10);
      TaskManager.toggleTaskComplete(id, e.target.checked);
      if (e.target.checked) TaskManager.updateTaskStatus(id, "Completed");
      else TaskManager.updateTaskStatus(id, "To Start");
      window.App.rerenderViews();
    });

    // click to open (avoid firing when dragging)
    el.addEventListener("click", (e) => {
      if (e.target && e.target.tagName === "INPUT") return;
      if (e.target.draggable) return;
      document.dispatchEvent(new CustomEvent("openTaskModal", { detail: { taskId: task.id } }));
    });

    el.appendChild(head);
    el.appendChild(meta);
    if (task.comment) el.appendChild(comment);
    if (task.attachment) el.appendChild(attach);
    el.appendChild(chkWrap);

    // drag events
    el.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", String(task.id));
      e.dataTransfer.effectAllowed = "move";
      requestAnimationFrame(() => el.classList.add("dragging"));
    });
    el.addEventListener("dragend", () => el.classList.remove("dragging"));

    // visual dim if completed
    if (task.completed) el.style.opacity = "0.6";

    return el;
  }

  function makeColumn(colKey) {
    const col = document.createElement("div");
    col.className = "kanban-column";
    col.dataset.key = colKey;

    const header = document.createElement("div");
    header.className = "col-header";
    const title = document.createElement("div");
    title.textContent = colKey;
    const count = document.createElement("div");
    count.className = "col-count";
    count.textContent = "0";

    header.appendChild(title);
    header.appendChild(count);

    const drop = document.createElement("div");
    drop.className = "col-drop";
    drop.dataset.key = colKey;

    drop.addEventListener("dragover", (e) => {
      e.preventDefault();
      drop.classList.add("drag-over");
      e.dataTransfer.dropEffect = "move";
    });
    drop.addEventListener("dragleave", () => drop.classList.remove("drag-over"));
    drop.addEventListener("drop", (e) => {
      e.preventDefault();
      drop.classList.remove("drag-over");
      const id = parseInt(e.dataTransfer.getData("text/plain"), 10);
      if (!isNaN(id)) {
        TaskManager.updateTaskStatus(id, colKey);
        window.App.rerenderViews();
      }
    });

    col.appendChild(header);
    col.appendChild(drop);
    return col;
  }

  function render(tasks) {
    kanbanBoardEl.innerHTML = "";
    const cols = {};
    COLUMNS.forEach((c) => {
      const el = makeColumn(c.key);
      kanbanBoardEl.appendChild(el);
      cols[c.key] = el.querySelector(".col-drop");
    });

    const groups = {};
    tasks.forEach((t) => {
      const key = t.status || "To Start";
      groups[key] = groups[key] || [];
      groups[key].push(t);
    });

    Object.keys(cols).forEach((k) => {
      const drop = cols[k];
      const arr = groups[k] || [];
      arr.forEach((task) => {
        const card = createCardEl(task);
        drop.appendChild(card);
      });
      const colEl = drop.closest(".kanban-column");
      const countEl = colEl.querySelector(".col-count");
      countEl.textContent = String(arr.length);
    });
  }

  window.KanbanView = { render };
})();
