import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  LayoutDashboard,
  Plus,
  Users
} from 'lucide-react';

const emptyProjectForm = {
  name: '',
  description: '',
  members: []
};

const Dashboard = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProject, setNewProject] = useState(emptyProjectForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const authConfig = {
    headers: {
      Authorization: `Bearer ${user.token}`
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      const requests = [
        axios.get('/api/projects', authConfig),
        axios.get('/api/tasks', authConfig)
      ];

      if (user.role === 'Admin') {
        requests.push(axios.get('/api/auth/users', authConfig));
      }

      const [projectResponse, taskResponse, memberResponse] = await Promise.all(requests);

      setProjects(projectResponse.data);
      setTasks(taskResponse.data);
      setMembers(memberResponse?.data || []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleMemberToggle = (memberId) => {
    setNewProject((currentProject) => {
      const isSelected = currentProject.members.includes(memberId);
      return {
        ...currentProject,
        members: isSelected
          ? currentProject.members.filter((id) => id !== memberId)
          : [...currentProject.members, memberId]
      };
    });
  };

  const handleCreateProject = async (event) => {
    event.preventDefault();

    try {
      setSubmitting(true);
      setError('');
      await axios.post('/api/projects', newProject, authConfig);
      setShowCreateModal(false);
      setNewProject(emptyProjectForm);
      await fetchDashboardData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to create project');
    } finally {
      setSubmitting(false);
    }
  };

  const overdueTasks = tasks.filter((task) => {
    if (!task.dueDate || task.status === 'Completed') {
      return false;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return new Date(task.dueDate) < today;
  });

  if (loading) {
    return <div className="loader-container"><div className="loader"></div></div>;
  }

  return (
    <div className="animate-fade-in">
      <header className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>
            Welcome back, {user.name}. Here is the latest project and task snapshot.
          </p>
        </div>
        {user.role === 'Admin' && (
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={18} /> New Project
          </button>
        )}
      </header>

      {error && (
        <div className="glass-card" style={{ padding: '14px 16px', marginBottom: '24px', borderColor: 'rgba(239, 68, 68, 0.35)', color: 'var(--danger)' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        <div className="glass-card delay-1" style={{ padding: '24px', borderLeft: '4px solid var(--primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>Total Projects</p>
              <h2 style={{ fontSize: '32px', margin: 0 }}>{projects.length}</h2>
            </div>
            <div style={{ padding: '12px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '12px' }}>
              <LayoutDashboard size={24} color="var(--primary)" />
            </div>
          </div>
        </div>

        <div className="glass-card delay-2" style={{ padding: '24px', borderLeft: '4px solid var(--warning)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>Open Tasks</p>
              <h2 style={{ fontSize: '32px', margin: 0 }}>{tasks.filter((task) => task.status !== 'Completed').length}</h2>
            </div>
            <div style={{ padding: '12px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '12px' }}>
              <Clock size={24} color="var(--warning)" />
            </div>
          </div>
        </div>

        <div className="glass-card delay-3" style={{ padding: '24px', borderLeft: '4px solid var(--success)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>Completed</p>
              <h2 style={{ fontSize: '32px', margin: 0 }}>{tasks.filter((task) => task.status === 'Completed').length}</h2>
            </div>
            <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px' }}>
              <CheckCircle2 size={24} color="var(--success)" />
            </div>
          </div>
        </div>

        <div className="glass-card delay-1" style={{ padding: '24px', borderLeft: '4px solid var(--danger)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>Overdue</p>
              <h2 style={{ fontSize: '32px', margin: 0 }}>{overdueTasks.length}</h2>
            </div>
            <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '12px' }}>
              <Calendar size={24} color="var(--danger)" />
            </div>
          </div>
        </div>
      </div>

      <h2 style={{ fontSize: '20px', marginBottom: '20px', fontWeight: '600' }}>Your Projects</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
        {projects.length === 0 ? (
          <div className="glass-card" style={{ padding: '40px', textAlign: 'center', gridColumn: '1 / -1' }}>
            <AlertCircle size={48} color="var(--text-muted)" style={{ marginBottom: '16px', opacity: 0.5 }} />
            <h3>No Projects Found</h3>
            <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>
              {user.role === 'Admin'
                ? 'Create a project to start assigning tasks to your team.'
                : 'You are not assigned to any projects yet.'}
            </p>
          </div>
        ) : (
          projects.map((project, index) => (
            <div key={project._id} className={`glass-card delay-${(index % 3) + 1}`} style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>{project.name}</h3>
                <span className="badge badge-progress">Active</span>
              </div>

              <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px', flex: 1, lineHeight: '1.5' }}>
                {project.description.length > 110 ? `${project.description.substring(0, 110)}...` : project.description}
              </p>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>
                    {project.owner?.name?.charAt(0) || 'O'}
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Owner: {project.owner?.name || 'Unknown'}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Users size={12} /> {project.members?.length || 0} team members
                    </div>
                  </div>
                </div>
                <Link to={`/projects/${project._id}`} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px', textDecoration: 'none' }}>
                  View Details
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      {showCreateModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(2, 6, 23, 0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '560px', padding: '32px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ marginBottom: '24px' }}>Create New Project</h2>
            <form onSubmit={handleCreateProject}>
              <div className="input-group">
                <label className="input-label">Project Name</label>
                <input
                  type="text"
                  className="input-field"
                  required
                  value={newProject.name}
                  onChange={(event) => setNewProject({ ...newProject, name: event.target.value })}
                  placeholder="Website Redesign"
                />
              </div>

              <div className="input-group">
                <label className="input-label">Description</label>
                <textarea
                  className="input-field"
                  required
                  rows="4"
                  value={newProject.description}
                  onChange={(event) => setNewProject({ ...newProject, description: event.target.value })}
                  placeholder="Outline the project scope, goals, and delivery expectations."
                ></textarea>
              </div>

              <div className="input-group">
                <label className="input-label">Add Team Members</label>
                <div className="glass-card" style={{ padding: '14px', maxHeight: '220px', overflowY: 'auto' }}>
                  {members.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No members available yet.</p>
                  ) : (
                    members.map((member) => (
                      <label key={member._id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={newProject.members.includes(member._id)}
                          onChange={() => handleMemberToggle(member._id)}
                        />
                        <span>{member.name}</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{member.email}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
