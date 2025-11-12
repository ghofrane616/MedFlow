import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FiArrowLeft, FiSearch, FiTrash2, FiEdit2, FiUser, FiPhone, FiMail } from 'react-icons/fi';
import '../../styles/UsersList.css';

const UsersList = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState(searchParams.get('user_type') || 'all');

  useEffect(() => {
    fetchUsers();
  }, [userTypeFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      
      let url = 'http://localhost:8000/api/users/list/';
      if (userTypeFilter !== 'all') {
        url += `?user_type=${userTypeFilter}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
        setFilteredUsers(data.users);
        setError('');
      } else {
        setError('Erreur lors de la récupération des utilisateurs');
      }
    } catch (err) {
      setError('Erreur: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    
    const filtered = users.filter(user => 
      user.username.toLowerCase().includes(term) ||
      user.email.toLowerCase().includes(term) ||
      user.first_name.toLowerCase().includes(term) ||
      user.last_name.toLowerCase().includes(term)
    );
    
    setFilteredUsers(filtered);
  };

  const handleDelete = async (userId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      try {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`http://localhost:8000/api/users/${userId}/`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          setUsers(users.filter(u => u.id !== userId));
          setFilteredUsers(filteredUsers.filter(u => u.id !== userId));
        } else {
          alert('Erreur lors de la suppression');
        }
      } catch (err) {
        alert('Erreur: ' + err.message);
      }
    }
  };

  const getUserTypeLabel = (type) => {
    const labels = {
      'admin': '👨‍💼 Admin',
      'doctor': '👨‍⚕️ Médecin',
      'receptionist': '📞 Réceptionniste',
      'patient': '🤒 Patient'
    };
    return labels[type] || type;
  };

  const getUserTypeColor = (type) => {
    const colors = {
      'admin': '#e74c3c',
      'doctor': '#3498db',
      'receptionist': '#f39c12',
      'patient': '#27ae60'
    };
    return colors[type] || '#95a5a6';
  };

  return (
    <div className="users-list-container">
      <button className="back-btn" onClick={() => navigate('/admin/dashboard')}>
        <FiArrowLeft /> Retour
      </button>

      <div className="users-list-card">
        <h1>📋 Gestion des Utilisateurs</h1>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="filters-section">
          <div className="search-box">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Rechercher par nom, email, username..."
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>

          <div className="filter-buttons">
            <button
              className={`filter-btn ${userTypeFilter === 'all' ? 'active' : ''}`}
              onClick={() => setUserTypeFilter('all')}
            >
              Tous ({users.length})
            </button>
            <button
              className={`filter-btn ${userTypeFilter === 'admin' ? 'active' : ''}`}
              onClick={() => setUserTypeFilter('admin')}
            >
              Admins
            </button>
            <button
              className={`filter-btn ${userTypeFilter === 'doctor' ? 'active' : ''}`}
              onClick={() => setUserTypeFilter('doctor')}
            >
              Médecins
            </button>
            <button
              className={`filter-btn ${userTypeFilter === 'receptionist' ? 'active' : ''}`}
              onClick={() => setUserTypeFilter('receptionist')}
            >
              Réceptionnistes
            </button>
            <button
              className={`filter-btn ${userTypeFilter === 'patient' ? 'active' : ''}`}
              onClick={() => setUserTypeFilter('patient')}
            >
              Patients
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loading">Chargement...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="no-users">Aucun utilisateur trouvé</div>
        ) : (
          <div className="users-table">
            <table>
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Email</th>
                  <th>Téléphone</th>
                  <th>Type</th>
                  <th>Statut</th>
                  <th>Date de création</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => (
                  <tr key={user.id} className={!user.is_active ? 'inactive-row' : ''}>
                    <td>
                      <div className={`user-name ${!user.is_active ? 'inactive-user' : ''}`}>
                        <FiUser className="user-icon" />
                        <div>
                          <strong>{user.first_name} {user.last_name}</strong>
                          <small>@{user.username}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <FiMail className="table-icon" />
                      {user.email}
                    </td>
                    <td>
                      <FiPhone className="table-icon" />
                      {user.phone_number || 'N/A'}
                    </td>
                    <td>
                      <span
                        className="user-type-badge"
                        style={{ backgroundColor: getUserTypeColor(user.user_type) }}
                      >
                        {getUserTypeLabel(user.user_type)}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${user.is_active ? 'valid' : 'invalid'}`}>
                        {user.is_active ? '✅ Valide' : '❌ Invalide'}
                      </span>
                    </td>
                    <td>{new Date(user.created_at).toLocaleDateString('fr-FR')}</td>
                    <td>
                      <div className="actions">
                        <button
                          className="action-btn edit-btn"
                          title="Modifier"
                          onClick={() => navigate(`/admin/users/${user.id}/edit`)}
                        >
                          <FiEdit2 />
                        </button>
                        <button
                          className="action-btn delete-btn"
                          title="Supprimer"
                          onClick={() => handleDelete(user.id)}
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="users-footer">
          <p>Total: <strong>{filteredUsers.length}</strong> utilisateur(s)</p>
          <button className="create-btn" onClick={() => navigate('/admin/create-user')}>
            ➕ Créer un nouvel utilisateur
          </button>
        </div>
      </div>
    </div>
  );
};

export default UsersList;

