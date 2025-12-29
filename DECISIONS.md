# Architectural Decisions & Algorithms

This document outlines the key technical decisions made during the development of the Task Dependency Tracker, specifically focusing on the circular dependency algorithm and graph visualization strategy.

## 1. Circular Dependency Detection Algorithm

### The Problem
When a user attempts to add a dependency where `Task A` depends on `Task B`, we must ensure that `Task B` does not already depend on `Task A` (directly or indirectly). Allowing this would create an infinite loop (A -> B -> C -> A), making it impossible to ever complete the tasks.

### The Solution: Depth-First Search (DFS)
I chose **DFS (Depth-First Search)** over BFS for cycle detection.

**Why DFS?**
- **Path Reconstruction**: DFS is naturally suited for "backtracking." When we find a cycle, the recursion stack contains the exact path of the cycle. This allows us to return a user-friendly error message like `Path: [1, 3, 5, 1]`, satisfying the requirement to show the user exactly where the loop occurs.
- **Simplicity**: The recursive implementation of DFS for path finding is cleaner and more intuitive than maintaining parent pointers in BFS.

### Algorithm Steps
When adding a dependency `Source -> Target`:
1.  We essentially need to check if there is already a path from `Target` back to `Source`.
2.  We initiate a DFS starting from `Target`.
3.  We maintain a `visited` set to avoid reprocessing nodes.
4.  We maintain a `path` stack.
5.  If we encounter `Source` during the traversal, a cycle exists.
6.  We return `True` and the `path`.

### Time Complexity
- **Worst Case**: O(V + E), where V is the number of tasks (vertices) and E is the number of dependencies (edges).
- Since we run this only when adding a specific edge, and the graph size for a typical project management board is moderate (N < 1000), this performance is well within acceptable limits for a real-time API response.

---

## 2. Auto-Status Update Logic

I implemented a recursive status propagation mechanism.

**Logic:**
- **Trigger**: Whenever a task is updated (e.g., marked `completed` or `blocked`).
- **Action**: The system fetches all tasks that depend on the updated task (reverse lookup).
- **Rule Evaluation**:
  - If *any* dependency is `blocked` -> Dependent task becomes `blocked`.
  - If *all* dependencies are `completed` -> Dependent task becomes `in_progress`.
  - Otherwise -> Task remains `pending`.
- **Recursion**: If a dependent task's status changes, the function calls itself recursively to update tasks further down the chain.

---

## 3. Graph Visualization (No External Libraries)

### Constraint
The assignment strictly forbade libraries like D3.js or Cytoscape.

### Solution: SVG + Level-Based Layout
I implemented a custom graph visualizer using React and SVG.

**Layout Algorithm (Naive Topological Layering):**
1.  **Level Calculation**: I calculate a "level" for each task.
    - Tasks with no dependencies are Level 0.
    - Tasks dependending on Level 0 are Level 1, and so on.
2.  **Positioning**:
    - **Y-Axis**: Determined by the Level (Level 0 at top, Level 1 below).
    - **X-Axis**: Tasks within the same level are spaced evenly across the canvas width.
3.  **Rendering**:
    - **Nodes**: Rendered as `<circle>` SVG elements.
    - **Edges**: Rendered as `<line>` elements connecting the coordinates of the nodes.
    - **Arrows**: Used an SVG `<marker>` definition to add arrowheads to lines.

### Trade-offs
- **Pros**: extremely lightweight, zero dependencies, full control over styling.
- **Cons**: Complex graphs with many crossing lines might look cluttered compared to force-directed algorithms (like D3). However, for a hierarchical task list, this "waterfall" top-down view is actually more readable.

---

## 4. Database Schema Design

I normalized the data into two tables: `Task` and `TaskDependency`.

- **Task**: Stores core info (Title, Status).
- **TaskDependency**: A junction table linking `task_id` and `depends_on_id`.

**Why not a Self-Referential Many-to-Many field?**
While Django supports `ManyToManyField('self')`, creating an explicit model (`TaskDependency`) allows us to:
1.  Easily add metadata to the relationship later (e.g., `created_at`).
2.  Perform more efficient queries for the specific direction of the relationship (finding "blockers" vs finding "blocked tasks").