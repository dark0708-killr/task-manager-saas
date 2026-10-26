import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = 'http://localhost:4000/api/v1';

const COLUMNS = [
  { id: 'todo', title: 'To Do', badge: 'bg-slate-700' },
  { id: 'in_progress', title: 'In Progress', badge: 'bg-blue-600' },
  { id: 'in_review', title: 'In Review', badge: 'bg-amber-600' },
  { id: 'completed', title: 'Completed', badge: 'bg-emerald-600' }
];

const PRIORITY_COLORS = {
  low: '#94a3b8',
  medium: '#38bdf8',
  high: '#fb923c',
  urgent: '#f87171'
};

const DashboardPage = ({ socket }) => {
  const { user, logout, token } = useAuth();
  const [boards, setBoards] = useState([]);
  const [activeBoard, setActiveBoard] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showBoardModal, setShowBoardModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('medium');
  const [newTaskColumn, setNewTaskColumn] = useState('todo');
  const [newBoardTitle, setNewBoardTitle] = useState('');

  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  // Fetch boards
  useEffect(() => {
    const fetchBoards = async () => {
      try {
        const res = await axios.get(`${API_URL}/boards`, authHeader);
        const fetchedBoards = res.data?.data?.boards || [];
        setBoards(fetchedBoards);
        if (fetchedBoards.length > 0) {
          setActiveBoard(fetchedBoards[0]);
        }
      } catch (err) {
        console.error('Failed to load boards', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBoards();
  }, [token]);

  // Fetch tasks when board changes
  useEffect(() => {
    if (!activeBoard) return;
    const fetchTasks = async () => {
      try {
        const res = await axios.get(`${API_URL}/tasks?board=${activeBoard._id}`, authHeader);
        setTasks(res.data?.data?.tasks || []);
      } catch (err) {
        console.error('Failed to load tasks', err);
      }
    };
    fetchTasks();
  }, [activeBoard, token]);

  // Real-time socket events
  useEffect(() => {
    if (!socket || !activeBoard) return;

    socket.emit('joinBoard', activeBoard._id);

    socket.on('taskCreated', (task) => {
      setTasks((prev) => [...prev, task]);
      toast.success(`New task added: ${task.title}`);
    });

    socket.on('taskUpdated', (updatedTask) => {
      setTasks((prev) => prev.map((t) => (t._id === updatedTask._id ? updatedTask : t)));
    });

    socket.on('taskDeleted', (deletedId) => {
      setTasks((prev) => prev.filter((t) => t._id !== deletedId));
    });

    return () => {
      socket.emit('leaveBoard', activeBoard._id);
      socket.off('taskCreated');
      socket.off('taskUpdated');
      socket.off('taskDeleted');
    };
  }, [socket, activeBoard]);

  const handleCreateBoard = async (e) => {
    e.preventDefault();
    if (!newBoardTitle.trim()) return;
    try {
      const res = await axios.post(`${API_URL}/boards`, { title: newBoardTitle }, authHeader);
      const created = res.data?.data?.board;
      setBoards((prev) => [...prev, created]);
      setActiveBoard(created);
      setNewBoardTitle('');
      setShowBoardModal(false);
      toast.success('Board created successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create board');
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    try {
      const payload = {
        title: newTaskTitle,
        description: newTaskDesc,
        priority: newTaskPriority,
        column: newTaskColumn,
        board: activeBoard?._id
      };
      const res = await axios.post(`${API_URL}/tasks`, payload, authHeader);
      const created = res.data?.data?.task;
      setTasks((prev) => [...prev, created]);
      setNewTaskTitle('');
      setNewTaskDesc('');
      setShowTaskModal(false);
      toast.success('Task created successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create task');
    }
  };

  const handleMoveColumn = async (taskId, newCol) => {
    try {
      await axios.patch(`${API_URL}/tasks/${taskId}/column`, { column: newCol }, authHeader);
      setTasks((prev) =>
        prev.map((t) => (t._id === taskId ? { ...t, column: newCol } : t))
      );
      toast.success(`Task moved to ${COLUMNS.find(c => c.id === newCol)?.title}`);
    } catch (err) {
      toast.error('Failed to move task');
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await axios.delete(`${API_URL}/tasks/${taskId}`, authHeader);
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
      toast.success('Task deleted');
    } catch (err) {
      toast.error('Failed to delete task');
    }
  };

  return (
    <div className="dashboard-container">
      {/* Top Navigation */}
      <header className="navbar">
        <div className="navbar-brand">
          <div className="brand-logo">TF</div>
          <span className="brand-name">TaskFlow SaaS</span>
        </div>

        <div className="navbar-controls">
          {boards.length > 0 && (
            <select
              className="board-select"
              value={activeBoard?._id || ''}
              onChange={(e) => {
                const found = boards.find((b) => b._id === e.target.value);
                setActiveBoard(found);
              }}
            >
              {boards.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.title}
                </option>
              ))}
            </select>
          )}

          <button className="btn btn-secondary" onClick={() => setShowBoardModal(true)}>
            + New Board
          </button>
          <button className="btn btn-primary" onClick={() => setShowTaskModal(true)}>
            + Add Task
          </button>

          <div className="user-profile">
            <span className="user-name">{user?.name || 'User'}</span>
            <button className="btn btn-logout" onClick={logout}>
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="board-view">
        <div className="board-header">
          <div>
            <h1 className="board-title">{activeBoard?.title || 'Default Workspace'}</h1>
            <p className="board-desc">Collaborative real-time board with Socket.io updates</p>
          </div>
          <div className="task-count-badge">
            {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
          </div>
        </div>

        {/* Kanban Columns */}
        <div className="kanban-grid">
          {COLUMNS.map((col) => {
            const columnTasks = tasks.filter((t) => t.column === col.id);
            return (
              <div key={col.id} className="kanban-column">
                <div className="column-header">
                  <div className="column-title-wrap">
                    <span className={`status-dot ${col.id}`} />
                    <h3>{col.title}</h3>
                  </div>
                  <span className="column-count">{columnTasks.length}</span>
                </div>

                <div className="column-body">
                  {columnTasks.length === 0 ? (
                    <div className="empty-column-placeholder">No tasks yet</div>
                  ) : (
                    columnTasks.map((task) => (
                      <div key={task._id} className="task-card">
                        <div className="task-card-header">
                          <span
                            className="task-priority"
                            style={{
                              borderColor: PRIORITY_COLORS[task.priority] || '#94a3b8',
                              color: PRIORITY_COLORS[task.priority] || '#94a3b8'
                            }}
                          >
                            {task.priority || 'medium'}
                          </span>
                          <button
                            className="task-delete-btn"
                            title="Delete Task"
                            onClick={() => handleDeleteTask(task._id)}
                          >
                            x
                          </button>
                        </div>
                        <h4 className="task-title">{task.title}</h4>
                        {task.description && (
                          <p className="task-description">{task.description}</p>
                        )}
                        <div className="task-footer">
                          <div className="task-actions">
                            {COLUMNS.filter((c) => c.id !== col.id).map((targetCol) => (
                              <button
                                key={targetCol.id}
                                className="btn-move-col"
                                onClick={() => handleMoveColumn(task._id, targetCol.id)}
                              >
                                -> {targetCol.title}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* New Task Modal */}
      {showTaskModal && (
        <div className="modal-overlay" onClick={() => setShowTaskModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Create New Task</h3>
            <form onSubmit={handleCreateTask}>
              <div className="form-group">
                <label>Task Title</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Design Landing Page"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  className="form-input"
                  placeholder="Task details and deliverables..."
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                  rows="3"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Priority</label>
                  <select
                    className="form-input"
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value)}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Column</label>
                  <select
                    className="form-input"
                    value={newTaskColumn}
                    onChange={(e) => setNewTaskColumn(e.target.value)}
                  >
                    {COLUMNS.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-buttons">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowTaskModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Board Modal */}
      {showBoardModal && (
        <div className="modal-overlay" onClick={() => setShowBoardModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Create New Board</h3>
            <form onSubmit={handleCreateBoard}>
              <div className="form-group">
                <label>Board Title</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Sprint 24 or Marketing"
                  value={newBoardTitle}
                  onChange={(e) => setNewBoardTitle(e.target.value)}
                  required
                />
              </div>
              <div className="modal-buttons">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowBoardModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Board
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
