import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Clock,
  Plus,
  Settings,
  Users
} from 'lucide-react';

const emptyTaskForm = {
  title: '',
  description: '',
  status: 'Pending',
  dueDate: '',
  assignedTo: ''
};

const ProjectDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [newTask, setNewTask] = useState(emptyTaskForm);
  const [allMembers, setAllMembers] = useState([]);
  const [editingProject, setEditingProject] = useState({ name: '', description: '', members: [] });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProjectAndTasks();
  }, [id]);

  const authConfig = {
    headers: {
      Authorization: `Bearer ${user.token}`
    }
  };

  const fetchProjectAndTasks = async () => {
    try {
      setLoading(true);
      setError('');

      const requests = [
        axios.get(`/api/projects/${id}`, authConfig),
        axios.get(`/api/tasks/project/${id}`, authConfig)
      ];

      if (user.role === 'Admin') {
        requests.push(axios.get('/api/auth/users', authConfig));
      }

      const [projectResponse, tasksResponse, usersResponse] = await Promise.all(requests);
      const projectData = projectResponse.data;

      setProject(projectData);
      setTasks(tasksResponse.data);
      setAllMembers(usersResponse?.data || []);
      setEditingProject({
        name: projectData.name,
        description: projectData.description,
        members: (projectData.members || []).map((member) => member._id)
      });
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load project details');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (event) => {
    event.preventDefault();

    try {
      setSubmitting(true);
      setError('');
      await axios.post('/api/tasks', { ...newTask, project: id }, authConfig);
      setShowTaskModal(false);
      setNewTask(emptyTaskForm);
      await fetchProjectAndTasks();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to create task');
    } finally {
      setSubmitting(false);
    }
  };

  const handleProjectMemberToggle = (memberId) => {
    setEditingProject((currentProject) => {
      const isSelected = currentProject.members.includes(memberId);
      return {
        ...currentProject,
        members: isSelected
          ? currentProject.members.filter((idValue) => idValue !== memberId)
          : [...currentProject.members, memberId]
      };
    });
  };

  const handleProjectUpdate = async (event) => {
    event.preventDefault();

    try {
      setSubmitting(true);
      setError('');
      await axios.put(`/api/projects/${id}`, editingProject, authConfig);
      setShowTeamModal(false);
      await fetchProjectAndTasks();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to update project');
    } finally {
      setSubmitting(false);
    }
  };

  const updateTaskStatus = async (taskId, currentStatus) => {
    const statuses = ['Pending', 'In Progress', 'Completed'];
    const nextStatus = statuses[(statuses.indexOf(currentStatus) + 1) % statuses.length];

    try {
      setError('');
      await axios.put(`/api/tasks/${taskId}`, { status: nextStatus }, authConfig);
      await fetchProjectAndTasks();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to update task status');
    }
  };

  const deleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) {
      return;
    }

    try {
      setError('');
      await axios.delete(`/api/tasks/${taskId}`, authConfig);
      await fetchProjectAndTasks();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to delete task');
    }
  };

  const isOverdue = (dueDate, status) => {
    if (!dueDate || status === 'Completed') {
      return false;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(dueDate) < today;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle2 color="var(--success)" />;
      case 'In Progress':
        return <Clock color="var(--primary)" />;
      default:
        return <Circle color="var(--warning)" />;
    }
  };

  const getStatusBadge = (status, dueDate) => {
    if (isOverdue(dueDate, status)) {
      return 'badge-danger';
    }

    switch (status) {
      case 'Completed':
        return 'badge-completed';
      case 'In Progress':
        return 'badge-progress';
      default:
        return 'badge-pending';
    }
  };

  if (loading) {
    return <div className="loader-container"><div className="loader"></div></div>;
  }

  if (!project) {
    return <div>Project not found</div>;
  }

  const canManageProject = user.role === 'Admin' && project.owner?._id === user._id;
  const assignableMembers = project.members || [];

  return (
    <div className="animate-fade-in">
      <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', textDecoration: 'none', marginBottom: '24px' }}>
        <ArrowLeft size={16} /> Back to Dashboard
      </Link>

      {error && (
        <div className="glass-card" style={{ padding: '14px 16px', marginBottom: '24px', borderColor: 'rgba(239, 68, 68, 0.35)', color: 'var(--danger)' }}>
          {error}
        </div>
      )}

      <header className="page-header" style={{ marginBottom: '28px', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">{project.name}</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '8px', maxWidth: '680px', lineHeight: '1.6' }}>{project.description}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '16px', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
            <span>Owner: {project.owner?.name}</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Users size={14} /> {assignableMembers.length} team members
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {canManageProject && (
            <button className="btn btn-secondary" onClick={() => setShowTeamModal(true)}>
              <Settings size={18} /> Manage Team
            </button>
          )}
          {canManageProject && (
            <button className="btn btn-primary" onClick={() => setShowTaskModal(true)}>
              <Plus size={18} /> Add Task
            </button>
          )}
        </div>
      </header>

      <div className="glass-card" style={{ padding: '20px', marginBottom: '28px' }}>
        <h3 style={{ marginBottom: '16px' }}>Team Members</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {assignableMembers.map((member) => (
            <span key={member._id} className="badge badge-progress" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Users size={12} />
              {member.name}
            </span>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
        {tasks.length === 0 ? (
          <div className="glass-card" style={{ padding: '40px', textAlign: 'center', gridColumn: '1 / -1' }}>
            <h3>No Tasks Yet</h3>
            <p style={{ color: 'var(--text-muted)' }}>Tasks added to this project will appear here.</p>
          </div>
        ) : (
          tasks.map((task, index) => {
            const overdue = isOverdue(task.dueDate, task.status);
            return (
              <div
                key={task._id}
                className={`glass-card delay-${(index % 3) + 1}`}
                style={{ padding: '24px', display: 'flex', flexDirection: 'column', border: overdue ? '1px solid var(--danger)' : '' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <h3 style={{ fontSize: '18px', margin: 0, color: overdue ? 'var(--danger)' : 'var(--text-main)' }}>{task.title}</h3>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    {overdue && (
                      <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.15)', color: 'var(--danger)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                        Overdue
                      </span>
                    )}
                    <span className={`badge ${getStatusBadge(task.status, task.dueDate)}`} style={{ cursor: 'pointer' }} onClick={() => updateTaskStatus(task._id, task.status)}>
                      {task.status}
                    </span>
                  </div>
                </div>

                <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '20px', flex: 1, lineHeight: '1.5' }}>
                  {task.description || 'No task description provided.'}
                </p>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '16px', gap: '12px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: overdue ? 'var(--danger)' : 'var(--text-muted)', fontSize: '12px' }}>
                    <Clock size={14} />
                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', color: 'var(--text-muted)', fontSize: '12px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {task.assignedTo ? `Assignee: ${task.assignedTo.name}` : 'Unassigned'}
                      {getStatusIcon(task.status)}
                    </div>
                    {canManageProject && (
                      <button onClick={() => deleteTask(task._id)} className="btn btn-danger" style={{ padding: '6px 10px' }}>
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {showTaskModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(2, 6, 23, 0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '500px', padding: '32px' }}>
            <h2 style={{ marginBottom: '24px' }}>Create New Task</h2>
            <form onSubmit={handleCreateTask}>
              <div className="input-group">
                <label className="input-label">Task Title</label>
                <input type="text" className="input-field" required value={newTask.title} onChange={(event) => setNewTask({ ...newTask, title: event.target.value })} />
              </div>

              <div className="input-group">
                <label className="input-label">Description</label>
                <textarea className="input-field" rows="3" value={newTask.description} onChange={(event) => setNewTask({ ...newTask, description: event.target.value })}></textarea>
              </div>

              <div className="input-group">
                <label className="input-label">Due Date</label>
                <input type="date" className="input-field" value={newTask.dueDate} onChange={(event) => setNewTask({ ...newTask, dueDate: event.target.value })} />
              </div>

              <div className="input-group">
                <label className="input-label">Assign To</label>
                <select className="input-field" value={newTask.assignedTo} onChange={(event) => setNewTask({ ...newTask, assignedTo: event.target.value })} required>
                  <option value="">Select a project member...</option>
                  {assignableMembers.map((member) => (
                    <option key={member._id} value={member._id}>{member.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowTaskModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Creating...' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showTeamModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(2, 6, 23, 0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '560px', padding: '32px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ marginBottom: '24px' }}>Manage Project Team</h2>
            <form onSubmit={handleProjectUpdate}>
              <div className="input-group">
                <label className="input-label">Project Name</label>
                <input type="text" className="input-field" value={editingProject.name} onChange={(event) => setEditingProject({ ...editingProject, name: event.target.value })} required />
              </div>

              <div className="input-group">
                <label className="input-label">Description</label>
                <textarea className="input-field" rows="4" value={editingProject.description} onChange={(event) => setEditingProject({ ...editingProject, description: event.target.value })} required></textarea>
              </div>

              <div className="input-group">
                <label className="input-label">Team Members</label>
                <div className="glass-card" style={{ padding: '14px', maxHeight: '220px', overflowY: 'auto' }}>
                  {allMembers.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No members available yet.</p>
                  ) : (
                    allMembers.map((member) => (
                      <label key={member._id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={editingProject.members.includes(member._id)}
                          onChange={() => handleProjectMemberToggle(member._id)}
                        />
                        <span>{member.name}</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{member.email}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowTeamModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetails;
