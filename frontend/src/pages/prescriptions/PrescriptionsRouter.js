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
    const userFromStorage = localStorage.getItem('user');
    
    console.log('🔍 PrescriptionsRouter - Raw localStorage:', userFromStorage);
    console.log('🔍 PrescriptionsRouter - Parsed user:', user);
    console.log('🔍 PrescriptionsRouter - User type:', user?.user_type);
    
    if (!user) {
      console.log('❌ No user found, redirecting to login');
      navigate('/login');
      return;
    }
    
    setUserType(user.user_type);
    setLoading(false);
  }, [navigate]);

  if (loading) {
    return <div className="loading">Chargement...</div>;
  }

  console.log('🎯 Rendering component for user type:', userType);

  if (userType === 'patient') {
    console.log('✅ Rendering PatientPrescriptions');
    return <PatientPrescriptions />;
  } else if (userType === 'doctor') {
    console.log('✅ Rendering DoctorPrescriptions');
    return <DoctorPrescriptions />;
  } else if (userType === 'admin') {
    console.log('✅ Rendering DoctorPrescriptions for admin');
    return <DoctorPrescriptions />;
  } else {
    console.log('⚠️ Unknown user type, redirecting to dashboard');
    navigate('/dashboard');
    return null;
  }
};

export default PrescriptionsRouter;

