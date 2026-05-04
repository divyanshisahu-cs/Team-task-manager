import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, LogOut, CheckSquare, Users } from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useAuth();

  return (
    <div className="sidebar">
      <div style={{ marginBottom: '40px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ 
          width: '40px', height: '40px', 
          borderRadius: '10px', 
          background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)'
        }}>
          <CheckSquare color="white" size={24} />
        </div>
        <h1 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>TeamSync</h1>
      </div>

      <div style={{ flex: 1 }}>
        <p style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '16px', letterSpacing: '1px' }}>Menu</p>
        
        <NavLink 
          to="/" 
          style={({ isActive }) => ({
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '12px 16px', borderRadius: '8px',
            textDecoration: 'none', color: isActive ? 'white' : 'var(--text-muted)',
            background: isActive ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
            borderLeft: isActive ? '3px solid var(--primary)' : '3px solid transparent',
            marginBottom: '8px', transition: 'all 0.2s'
          })}
        >
          <LayoutDashboard size={20} />
          <span style={{ fontWeight: '500' }}>Dashboard</span>
        </NavLink>
        
        {/* Additional links can go here */}
      </div>

      <div className="glass-card" style={{ padding: '16px', marginTop: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={20} color="var(--primary)" />
          </div>
          <div>
            <p style={{ margin: 0, fontWeight: '600', fontSize: '14px' }}>{user?.name}</p>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>{user?.role}</p>
          </div>
        </div>
        
        <button onClick={logout} className="btn btn-secondary" style={{ width: '100%' }}>
          <LogOut size={16} /> Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
