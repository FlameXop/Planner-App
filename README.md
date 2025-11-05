# Planner App


Tezuka Planner is a web-based task management application designed for teams. It features role-based access control, multiple workspaces, and dual viewing modes (Grid and Kanban). The application is built with vanilla JavaScript and uses the browser's `localStorage` for all data persistence, allowing it to run entirely on the client-side.

## Key Features

*   **Role-Based Access Control**:
    *   **Admin**: Full permissions to create/edit/delete workspaces and tasks, and assign tasks to users.
    *   **Employee**: Can view tasks assigned to them and update their status (e.g., mark as complete).
*   **Multiple Workspaces**: Organize tasks into separate workspaces. Admins can create and delete workspaces.
*   **Dual Views**:
    *   **Grid View**: A compact, list-style view of all tasks.
    *   **Kanban View**: A drag-and-drop board to manage tasks by status (`To Start`, `In Progress`, `Completed`, etc.).
*   **Task Management**: Create tasks with titles, deadlines, assignees, priorities, comments, and attachments (links/URLs).
*   **In-App Notifications**: Users receive notifications for task assignments, re-assignments, and completions.
*   **Local Persistence**: All user, task, and workspace data is saved directly in the browser's `localStorage`, ensuring data is retained between sessions without a database.
*   **Cross-Tab Sync**: Changes made in one browser tab are automatically reflected in other open tabs of the application.
*   **Simple Authentication**: A straightforward login and sign-up system for Admins and Employees.

## Tech Stack

*   **Frontend**: HTML5, CSS3, Vanilla JavaScript
*   **Backend (Optional)**: A Node.js, Express, and Socket.IO server is included for demonstrating potential real-time capabilities, though the current stable version of the app relies solely on `localStorage`.

## Getting Started

This application is designed to run directly in the browser without any complex setup.

### Running Client-Side (Recommended)

Since the app uses `localStorage` for data, no server is required.

1.  Clone the repository:
    ```bash
    git clone https://github.com/flamexop/planner-app.git
    ```
2.  Navigate to the project directory:
    ```bash
    cd planner-app
    ```
3.  Open the `login.html` file in your preferred web browser.

### Running the Optional Real-time Server

The repository includes a Node.js server for real-time synchronization via WebSockets. Note that the primary application logic in `app.js` is configured for `localStorage` and does not connect to this server out-of-the-box.

1.  Ensure you have Node.js and npm installed.
2.  Clone the repository and navigate into the directory.
3.  Install the required dependencies:
    ```bash
    npm install
    ```
4.  Start the server:
    ```bash
    npm start
    ```
    The server will be running at `http://localhost:5000`.

## How to Use

1.  **Sign Up & Login**:
    *   Open `login.html`.
    *   Select the **Admin** tab and click "Sign up" to create your first admin account.
    *   After creating the account, you will be switched to the login view. Log in with your new credentials.
    *   You can create additional Admin or Employee accounts as needed.

2.  **Creating Workspaces & Tasks (Admin)**:
    *   Once logged in as an Admin, you can click **+ Add Workspace** to create new project boards.
    *   Click **+ Add Task** to open the task creation modal. Fill in the details and assign the task to a user via their email address.

3.  **Managing Tasks (Employee)**:
    *   Log in with an Employee account.
    *   The dashboard will display only the tasks assigned to you.
    *   In the Grid view, you can check "Mark Complete" to finish a task.
    *   In the Kanban view, you can drag and drop your tasks between columns to update their status. Completing a task will notify the admin who created it.

4.  **Switching Views**:
    *   Use the **Grid View** and **Kanban View** buttons on the left sidebar to switch between layouts.
