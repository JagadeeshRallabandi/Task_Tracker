import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DependencyGraph from './DependencyGraph';

const API_URL = 'http://localhost:8000/api/tasks/';

function App() {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState({ title: '', description: '' });
  const [dependency, setDependency] = useState({ taskId: '', dependsOnId: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await axios.get(API_URL);
      setTasks(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const createTask = async (e) => {
    e.preventDefault();
    try {
      await axios.post(API_URL, newTask);
      setNewTask({ title: '', description: '' });
      fetchTasks();
    } catch (err) {
      setError('Failed to create task');
    }
  };

  const addDependency = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    // Validation: Self dependency
    if (dependency.taskId === dependency.dependsOnId) {
        setError("A task cannot depend on itself.");
        setLoading(false);
        return;
    }

    try {
      await axios.post(`${API_URL}${dependency.taskId}/add_dependency/`, {
        depends_on_id: dependency.dependsOnId
      });
      fetchTasks();
      setDependency({ taskId: '', dependsOnId: '' });
    } catch (err) {
      if (err.response && err.response.data.error) {
        setError(`Error: ${err.response.data.error}. Path: ${JSON.stringify(err.response.data.path)}`);
      } else {
        setError('Failed to add dependency');
      }
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await axios.patch(`${API_URL}${id}/`, { status });
      fetchTasks();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteTask = async (id) => {
      if(!window.confirm("Are you sure? This might affect other tasks.")) return;
      try {
          await axios.delete(`${API_URL}${id}/`);
          fetchTasks();
      } catch (err) { console.error(err); }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold mb-8 text-center text-indigo-700">Task Dependency Tracker</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Left Column: Forms and Lists */}
        <div className="space-y-6">
          
          {/* Create Task Form */}
          <div className="bg-white p-6 rounded shadow">
            <h2 className="text-xl font-bold mb-4">Create Task</h2>
            <form onSubmit={createTask} className="flex gap-2">
              <input
                type="text"
                placeholder="Task Title"
                className="border p-2 rounded flex-1"
                value={newTask.title}
                onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                required
              />
              <button className="bg-indigo-600 text-white px-4 py-2 rounded">Add</button>
            </form>
          </div>

          {/* Add Dependency Form */}
          <div className="bg-white p-6 rounded shadow">
            <h2 className="text-xl font-bold mb-4">Add Dependency</h2>
            {error && <div className="bg-red-100 text-red-700 p-2 rounded mb-2 text-sm">{error}</div>}
            <form onSubmit={addDependency} className="flex flex-col gap-2">
              <div className="flex gap-2">
                <select 
                    className="border p-2 rounded flex-1"
                    value={dependency.taskId}
                    onChange={e => setDependency({...dependency, taskId: e.target.value})}
                    required
                >
                    <option value="">Select Task</option>
                    {tasks.map(t => <option key={t.id} value={t.id}>{t.id}: {t.title}</option>)}
                </select>
                <span className="self-center">depends on</span>
                <select 
                    className="border p-2 rounded flex-1"
                    value={dependency.dependsOnId}
                    onChange={e => setDependency({...dependency, dependsOnId: e.target.value})}
                    required
                >
                    <option value="">Select Dependency</option>
                    {tasks.map(t => <option key={t.id} value={t.id}>{t.id}: {t.title}</option>)}
                </select>
              </div>
              <button disabled={loading} className="bg-gray-800 text-white px-4 py-2 rounded mt-2 disabled:opacity-50">
                  {loading ? 'Checking Cycles...' : 'Link Dependency'}
              </button>
            </form>
          </div>

          {/* Task List */}
          <div className="bg-white p-6 rounded shadow">
            <h2 className="text-xl font-bold mb-4">Task List</h2>
            <ul className="space-y-2">
              {tasks.map(task => (
                <li key={task.id} className="border p-3 rounded flex justify-between items-center bg-gray-50">
                  <div>
                    <span className="font-bold mr-2">{task.title}</span>
                    <span className={`text-xs px-2 py-1 rounded text-white
                        ${task.status === 'completed' ? 'bg-green-500' : 
                          task.status === 'blocked' ? 'bg-red-500' : 
                          task.status === 'in_progress' ? 'bg-blue-500' : 'bg-gray-400'}`}>
                        {task.status}
                    </span>
                    <div className="text-xs text-gray-500 mt-1">
                        Depends on: {task.dependencies.length > 0 ? task.dependencies.join(', ') : 'None'}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <select 
                        className="border rounded text-sm p-1"
                        value={task.status}
                        onChange={(e) => updateStatus(task.id, e.target.value)}
                        disabled={task.status === 'blocked'} // Prevent manual override if blocked logic is strict
                    >
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="blocked">Blocked</option>
                    </select>
                    <button onClick={() => deleteTask(task.id)} className="text-red-500 text-sm">Delete</button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right Column: Visualization */}
        <div className="h-full">
            <div className="sticky top-8">
                <DependencyGraph tasks={tasks} refreshTrigger={tasks} />
                <div className="mt-4 bg-white p-4 rounded shadow">
                    <h3 className="font-bold">Legend</h3>
                    <div className="flex gap-4 mt-2 text-sm">
                        <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-gray-400"></div> Pending</span>
                        <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-blue-500"></div> In Progress</span>
                        <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-green-500"></div> Completed</span>
                        <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-red-500"></div> Blocked</span>
                    </div>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
}

export default App;