# Task Dependency Tracker

A full-stack Task Management System that handles complex task dependencies, automatically detects circular references, and visualizes relationships in an interactive graph.

## 🚀 Features

- **Task Management**: Create, update, and delete tasks.
- **Dependency Tracking**: Link tasks together (e.g., Task B depends on Task A).
- **Circular Dependency Detection**: Prevents loops (A -> B -> C -> A) using DFS and returns the exact cycle path.
- **Auto-Status Updates**:
  - If a dependency is `blocked`, the dependent task becomes `blocked`.
  - If all dependencies are `completed`, the task moves to `in_progress`.
- **Graph Visualization**: Custom SVG-based dependency graph (No external libraries used).

## 🛠 Technical Stack

- **Backend**: Django 4.x, Django REST Framework, MySQL 8.0+
- **Frontend**: React 18 (Vite), Tailwind CSS, HTML5 SVG for Graphing
- **Database**: MySQL

---

## ⚙️ Setup Instructions

### Prerequisites
- Python 3.8+
- Node.js 16+
- MySQL Server running locally

### 1. Backend Setup (Django)

1.  **Navigate to the project root:**
    ```bash
    cd backend
    ```

2.  **Create and activate virtual environment:**
    ```bash
    python -m venv venv
    # Windows
    venv\Scripts\activate
    # Mac/Linux
    source venv/bin/activate
    ```

3.  **Install dependencies:**
    ```bash
    pip install django djangorestframework django-cors-headers mysqlclient
    ```

4.  **Configure Database:**
    - Open `backend/settings.py`
    - Update the `DATABASES` section with your MySQL credentials (USER, PASSWORD).
    - Ensure a database named `task_db` exists in your MySQL server:
      ```sql
      CREATE DATABASE task_db;
      ```

5.  **Run Migrations:**
    ```bash
    python manage.py makemigrations
    python manage.py migrate
    ```

6.  **Run Server:**
    ```bash
    python manage.py runserver
    ```
    *Backend will be running at http://localhost:8000*

### 2. Frontend Setup (React)

1.  **Open a new terminal and navigate to frontend:**
    ```bash
    cd frontend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run Development Server:**
    ```bash
    npm run dev
    ```
    *Frontend will be running at http://localhost:5173 (or similar)*

---

## 📡 API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/tasks/` | List all tasks |
| `POST` | `/api/tasks/` | Create a new task |
| `PATCH` | `/api/tasks/{id}/` | Update task status |
| `POST` | `/api/tasks/{id}/add_dependency/` | Add a dependency (Includes Cycle Check) |
| `DELETE` | `/api/tasks/{id}/` | Delete a task |

## 🧪 Testing the Application

1.  **Create Tasks**: Use the form on the left to create Task A, B, and C.
2.  **Add Dependencies**:
    - Make B depend on A.
    - Make C depend on B.
3.  **Test Cycle Detection**:
    - Try making A depend on C.
    - You should see an error: "Circular dependency detected. Path: [A, B, C, A]".
4.  **Test Status**:
    - Mark Task A as `blocked`. Observe Task B and C becoming `blocked`.
    - Mark Task A as `completed`. Observe Task B becoming `in_progress`.