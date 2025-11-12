import React, { useState } from 'react';
import '../styles/Patients.css';

export default function PatientList({ patients, onSelectPatient, onEdit, onDelete, canEdit = false }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');

  // Filtrer les patients
  const filteredPatients = patients.filter(patient => {
    const searchLower = searchTerm.toLowerCase();
    return (
      patient.user_full_name.toLowerCase().includes(searchLower) ||
      patient.patient_id.toLowerCase().includes(searchLower) ||
      patient.user.email.toLowerCase().includes(searchLower)
    );
  });

  // Trier les patients
  const sortedPatients = [...filteredPatients].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.user_full_name.localeCompare(b.user_full_name);
      case 'id':
        return a.patient_id.localeCompare(b.patient_id);
      case 'date':
        return new Date(b.created_at) - new Date(a.created_at);
      default:
        return 0;
    }
  });

  return (
    <div className="patient-list-container">
      <div className="patient-list-header">
        <h2>Liste des Patients</h2>
        <div className="patient-list-controls">
          <input
            type="text"
            placeholder="Rechercher par nom, ID ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            <option value="name">Trier par nom</option>
            <option value="id">Trier par ID</option>
            <option value="date">Trier par date</option>
          </select>
        </div>
      </div>

      {sortedPatients.length === 0 ? (
        <div className="no-patients">
          <p>Aucun patient trouvé</p>
        </div>
      ) : (
        <div className="patients-table-wrapper">
          <table className="patients-table">
            <thead>
              <tr>
                <th>ID Patient</th>
                <th>Nom Complet</th>
                <th>Email</th>
                <th>Genre</th>
                <th>Groupe Sanguin</th>
                <th>Contact d'Urgence</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedPatients.map((patient) => (
                <tr key={patient.id} className="patient-row">
                  <td className="patient-id">{patient.patient_id}</td>
                  <td className="patient-name">{patient.user_full_name}</td>
                  <td className="patient-email">{patient.user.email}</td>
                  <td className="patient-gender">
                    {patient.gender === 'M' ? 'Masculin' : patient.gender === 'F' ? 'Féminin' : 'Autre'}
                  </td>
                  <td className="patient-blood-type">{patient.blood_type || '-'}</td>
                  <td className="patient-contact">{patient.emergency_contact_name}</td>
                  <td className="patient-actions">
                    <button
                      className="btn-view"
                      onClick={() => onSelectPatient(patient)}
                      title="Voir les détails"
                    >
                      👁️
                    </button>
                    {canEdit && (
                      <>
                        <button
                          className="btn-edit"
                          onClick={() => onEdit && onEdit(patient)}
                          title="Modifier"
                        >
                          ✏️
                        </button>
                        <button
                          className="btn-delete"
                          onClick={() => {
                            if (window.confirm(`Êtes-vous sûr de vouloir supprimer ${patient.user_full_name} ?`)) {
                              onDelete && onDelete(patient.id);
                            }
                          }}
                          title="Supprimer"
                        >
                          🗑️
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="patient-list-footer">
        <p>{sortedPatients.length} patient(s) trouvé(s)</p>
      </div>
    </div>
  );
}

