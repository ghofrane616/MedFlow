import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUser } from '../../utils/auth';
import DoctorPrescriptions from './DoctorPrescriptions';
import PatientPrescriptions from './PatientPrescriptions';

const PrescriptionsRouter = () => {
  const navigate = useNavigate();
  const [userType, setUserType] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = getUser();

    if (!user) {
      navigate('/login');
      return;
    }
    
    setUserType(user.user_type);
    setLoading(false);
  }, [navigate]);

  if (loading) {
    return <div className="loading">Chargement...</div>;
  }

  if (userType === 'patient') {
    return <PatientPrescriptions />;
  } else if (userType === 'doctor') {
    return <DoctorPrescriptions />;
  } else if (userType === 'admin') {
    return <DoctorPrescriptions />;
  } else {
    navigate('/dashboard');
    return null;
  }
};

export default PrescriptionsRouter;

