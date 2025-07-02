import React, { useState, useEffect } from 'react';
import Sidebar from "../../components/Sidebar/Sidebar";
import { getDoctorsApi } from "../../services/Appointment";
import scheduleService from "../../services/ScheduleService";

export default function StaffDoctorSchedule() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
    date: '',
    startTime: '08:00',
    room: ''
  });
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [pendingSchedules, setPendingSchedules] = useState([]);

  // Fetch doctors from API when component mounts
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('🔍 Fetching doctors from API...');

        const doctorsData = await getDoctorsApi();
        console.log('📥 Doctors data received:', doctorsData);

        // Transform API data to match our component structure
        const transformedDoctors = doctorsData.map(doctor => ({
          id: doctor.userId || doctor.accountId || doctor.id || 'unknown',
          name: doctor.fullName || doctor.name || `Bác sĩ ${doctor.userId || doctor.accountId || 'Unknown'}`,
          room: `Room ${doctor.userId || doctor.accountId || doctor.id || 'Unknown'}`,
          specificSchedules: [],
          apiSchedules: []
        }));

        if (transformedDoctors.length === 0) {
          throw new Error('No doctors returned from API');
        }

        setDoctors(transformedDoctors);
        await loadDoctorSchedules(transformedDoctors);

      } catch (err) {
        console.error('💥 Error fetching doctors:', err);
        setError('Không thể tải danh sách bác sĩ. Vui lòng thử lại. Chi tiết: ' + err.message);
        
        // Fallback to sample data
        setDoctors([
          { id: 1, name: "BS. Nguyễn Văn An", room: "Room 1", specificSchedules: [], apiSchedules: [] },
          { id: 2, name: "BS. Trần Thị Bình", room: "Room 2", specificSchedules: [], apiSchedules: [] }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, []);

  // Load existing schedules for doctors using ACTIVE schedules
  const loadDoctorSchedules = async (doctorsList) => {
    try {
      console.log('🔄 Loading active schedules for all doctors...');
      
      const response = await scheduleService.getActiveSchedules();
      console.log('📥 Active schedules response:', response);

      if (response.isSuccess && Array.isArray(response.data)) {
        console.log('✅ Active schedules loaded:', response.data);
        
        const schedulesByDoctor = {};
        response.data.forEach(schedule => {
          const doctorId = schedule.doctorId || schedule.DoctorId;
          console.log(`👨‍⚕️ Processing schedule for doctor ID: ${doctorId}`);
          if (!schedulesByDoctor[doctorId]) {
            schedulesByDoctor[doctorId] = [];
          }
          
          const localSchedule = {
            scheduleId: schedule.scheduleId,
            date: schedule.scheduledTime ? schedule.scheduledTime.split('T')[0] : '',
            startTime: schedule.scheduledTime ? new Date(schedule.scheduledTime).toTimeString().substring(0, 5) : '',
            room: schedule.room || 'Unknown Room',
            status: schedule.status || 'ACTIVE',
            hasAppointment: schedule.hasAppointment || false,
            patientName: schedule.patientName || null,
            appointmentNote: schedule.appointmentNote || null
          };
          
          schedulesByDoctor[doctorId].push(localSchedule);
        });
        
        console.log('📊 Schedules grouped by doctor:', schedulesByDoctor);
        
        const updatedDoctors = doctorsList.map(doctor => {
          const doctorSchedules = schedulesByDoctor[doctor.id] || [];
          console.log(`👨‍⚕️ Doctor ${doctor.id} (${doctor.name}): ${doctorSchedules.length} schedules`);
          
          return {
            ...doctor,
            apiSchedules: doctorSchedules,
            specificSchedules: doctorSchedules,
            loadSuccess: true
          };
        });
        
        setDoctors(updatedDoctors);
        
      } else {
        console.warn('⚠️ No active schedules found or API failed:', response.message);
        const updatedDoctors = doctorsList.map(doctor => ({
          ...doctor,
          apiSchedules: [],
          specificSchedules: [],
          loadError: response.message || 'Could not load schedules'
        }));
        setDoctors(updatedDoctors);
      }
      
    } catch (error) {
      console.error('💥 Error loading active schedules:', error);
      const updatedDoctors = doctorsList.map(doctor => ({
        ...doctor,
        apiSchedules: [],
        specificSchedules: [],
        loadError: error.message
      }));
      setDoctors(updatedDoctors);
    }
  };

  // Hide navbar and footer
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      nav, .navbar, header, .header { display: none !important; }
      footer, .footer { display: none !important; }
      body { margin: 0 !important; padding: 0 !important; }
    `;
    document.head.appendChild(style);

    return () => document.head.removeChild(style);
  }, []);

  // Add refresh button to manually reload active schedules
  const refreshAllSchedules = async () => {
    try {
      setLoading(true);
      console.log('🔄 Manually refreshing all active schedules...');
      await loadDoctorSchedules(doctors);
      alert('✅ Đã làm mới danh sách lịch làm việc!');
    } catch (error) {
      console.error('💥 Error refreshing schedules:', error);
      alert('❌ Lỗi khi làm mới: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Create time options
  const timeOptions = [];
  for (let hour = 6; hour <= 22; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      timeOptions.push(timeString);
    }
  }

  const addSchedule = () => {
    if (!newSchedule.date || !newSchedule.startTime || !newSchedule.room) {
      alert('Vui lòng điền đầy đủ thông tin!');
      return;
    }

    const newScheduleItem = { ...newSchedule, status: 'ACTIVE' };
    setPendingSchedules(prev => [...prev, newScheduleItem]);

    setDoctors(doctors.map(doctor => {
      if (doctor.id === selectedDoctor.id) {
        const updatedDoctor = {
          ...doctor,
          specificSchedules: [...doctor.specificSchedules, newScheduleItem]
        };
        setSelectedDoctor(updatedDoctor);
        return updatedDoctor;
      }
      return doctor;
    }));

    setNewSchedule({
      date: '',
      startTime: '08:00',
      room: selectedDoctor.room
    });
  };

  const removeSchedule = (doctorId, scheduleIndex) => {
    setDoctors(doctors.map(doctor => {
      if (doctor.id === doctorId) {
        const updatedDoctor = {
          ...doctor,
          specificSchedules: doctor.specificSchedules.filter((_, index) => index !== scheduleIndex)
        };
        if (selectedDoctor && selectedDoctor.id === doctorId) {
          setSelectedDoctor(updatedDoctor);
        }
        return updatedDoctor;
      }
      return doctor;
    }));

    setPendingSchedules(prev => prev.filter((_, index) => index !== scheduleIndex));
  };

  const openScheduleModal = (doctor) => {
    setSelectedDoctor(doctor);
    setShowScheduleModal(true);
    setPendingSchedules([]);
    
    const today = new Date().toISOString().split('T')[0]; // 2025-07-02
    setNewSchedule(prev => ({ ...prev, date: today, room: doctor.room }));
  };

  const closeScheduleModal = () => {
    setShowScheduleModal(false);
    setSelectedDoctor(null);
    setPendingSchedules([]);
    setNewSchedule({ date: '', startTime: '08:00', room: '' });
  };

  const saveSchedule = async () => {
    if (pendingSchedules.length === 0) {
      alert('Không có lịch nào để lưu!');
      return;
    }

    setScheduleLoading(true);
    try {
      let results;
      if (pendingSchedules.length === 1) {
        results = [await scheduleService.createSchedule(pendingSchedules[0], selectedDoctor.id)];
      } else {
        results = await scheduleService.createMultipleSchedules(pendingSchedules, selectedDoctor.id);
      }

      const successCount = Array.isArray(results) ? results.filter(r => r.isSuccess).length : (results.isSuccess ? 1 : 0);
      const errorCount = Array.isArray(results) ? results.filter(r => !r.isSuccess).length : (results.isSuccess ? 0 : 1);

      if (successCount > 0) {
        alert(`✅ Đã lưu thành công ${successCount} lịch làm việc!`);
        await loadDoctorSchedules([selectedDoctor]);
        setPendingSchedules([]);
      }

      if (errorCount > 0) {
        const errors = Array.isArray(results)
          ? results.filter(r => !r.isSuccess).map(r => r.message || 'Lỗi không xác định').join('\n')
          : (results.message || 'Lỗi không xác định');
        alert(`❌ Có ${errorCount} lịch không thể tạo:\n${errors}`);
      }

      if (successCount === (Array.isArray(results) ? results.length : 1)) {
        closeScheduleModal();
      }
      
    } catch (error) {
      console.error('Error saving schedules:', error);
      alert('❌ Lỗi khi lưu lịch làm việc: ' + error.message);
    } finally {
      setScheduleLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const days = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    return `${days[date.getDay()]}, ${date.toLocaleDateString('vi-VN')}`;
  };

  const presetTimes = [
    { label: "Ca sáng", start: "08:00" },
    { label: "Ca chiều", start: "13:00" },
    { label: "Cả ngày", start: "08:00" },
    { label: "Ca tối", start: "18:00" }
  ];

  const applyPreset = (preset) => {
    setNewSchedule(prev => ({ ...prev, startTime: preset.start }));
  };

  const containerStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', backgroundColor: '#f9fafb', zIndex: 1000 };
  const mainContentStyle = { flex: 1, padding: '24px', backgroundColor: '#f9fafb', overflow: 'auto' };
  const cardStyle = { backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', padding: '24px', marginBottom: '24px' };
  const doctorCardStyle = { backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '24px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', marginBottom: '16px' };
  const buttonStyle = { width: '100%', backgroundColor: '#2563eb', color: 'white', fontWeight: 'bold', padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer' };
  const modalStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001 };
  const modalContentStyle = { backgroundColor: 'white', borderRadius: '8px', padding: '24px', width: '90%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' };

  return (
    <div style={containerStyle}>
      <Sidebar active="doctor-schedule" />
      
      <div style={mainContentStyle}>
        <div style={cardStyle}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', marginBottom: '16px' }}>
            📅 Sắp Xếp Lịch Bác Sĩ
          </h1>
          <p style={{ marginBottom: '16px', color: '#6b7280' }}>
            Quản lý lịch làm việc của {doctors.length} bác sĩ theo từng ngày và giờ cụ thể
          </p>

          {/* Loading state */}
          {loading && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
              <div style={{ fontSize: '18px', marginBottom: '8px' }}>🔄</div>
              <p>Đang tải danh sách bác sĩ...</p>
            </div>
          )}

          {/* Error state with debug */}
          {error && (
            <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '16px', marginBottom: '16px', color: '#dc2626' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>❌</span><span>{error}</span>
              </div>
              <button
                onClick={refreshAllSchedules}
                style={{ padding: '8px 16px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', marginTop: '8px' }}
              >
                🔄 Thử lại
              </button>
            </div>
          )}

          {/* Doctors list */}
          {!loading && doctors.length === 0 && !error && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
              <div style={{ fontSize: '18px', marginBottom: '8px' }}>👨‍⚕️</div>
              <p>Không có bác sĩ nào trong hệ thống</p>
            </div>
          )}

          {!loading && doctors.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
              {doctors.map(doctor => (
                <div key={doctor.id} style={doctorCardStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                    <div style={{ width: '48px', height: '48px', backgroundColor: '#dbeafe', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '16px' }}>
                      <span style={{ fontSize: '20px' }}>👨‍⚕️</span>
                    </div>
                    <div>
                      <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
                        {doctor.name}
                      </h3>
                      <p style={{ color: '#6b7280', margin: 0 }}>ID: {doctor.id} | {doctor.room}</p>
                    </div>
                  </div>

                  {/* Display specific schedules */}
                  <div style={{ marginBottom: '16px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 'bold', color: '#374151', marginBottom: '8px' }}>
                      📋 Lịch làm việc ({doctor.specificSchedules.length} ca):
                    </h4>
                    
                    {doctor.specificSchedules.length > 0 ? (
                      <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                        {doctor.specificSchedules.sort((a, b) => new Date(a.date) - new Date(b.date)).map((schedule, index) => (
                          <div key={index} style={{ 
                            fontSize: '12px',
                            backgroundColor: schedule.scheduleId ? '#f0fdf4' : '#fff7ed',
                            border: `1px solid ${schedule.scheduleId ? '#bbf7d0' : '#fed7aa'}`,
                            borderRadius: '6px',
                            padding: '8px',
                            marginBottom: '6px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}>
                            <div>
                              <div style={{ fontWeight: 'bold', color: '#1f2937' }}>
                                📅 {formatDate(schedule.date)}
                                {schedule.scheduleId && <span style={{ color: '#059669', marginLeft: '8px' }}>✅</span>}
                                {!schedule.scheduleId && <span style={{ color: '#d97706', marginLeft: '8px' }}>⏳</span>}
                              </div>
                              <div style={{ color: '#6b7280', marginTop: '2px' }}>
                                🕐 {schedule.startTime}
                              </div>
                              <div style={{ color: '#6b7280', fontSize: '10px' }}>
                                🏥 {schedule.room}
                              </div>
                            </div>
                            <button
                              onClick={() => removeSchedule(doctor.id, index)}
                              style={{
                                backgroundColor: '#fee2e2',
                                color: '#dc2626',
                                border: 'none',
                                borderRadius: '4px',
                                padding: '4px 6px',
                                fontSize: '10px',
                                cursor: 'pointer'
                              }}
                            >
                              ❌
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ fontSize: '12px', color: '#9ca3af', fontStyle: 'italic' }}>
                        Chưa có lịch làm việc cụ thể
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => openScheduleModal(doctor)}
                    style={buttonStyle}
                    onMouseOver={(e) => e.target.style.backgroundColor = '#1d4ed8'}
                    onMouseOut={(e) => e.target.style.backgroundColor = '#2563eb'}
                  >
                    ➕ Thêm Lịch Làm Việc
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal for adding schedule */}
      {showScheduleModal && selectedDoctor && (
        <div style={modalStyle}>
          <div style={modalContentStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
                📅 Thêm Lịch Làm Việc - {selectedDoctor.name}
              </h2>
              <button
                onClick={closeScheduleModal}
                style={{ backgroundColor: 'transparent', border: 'none', fontSize: '24px', color: '#6b7280', cursor: 'pointer' }}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <p style={{ color: '#6b7280' }}>ID: {selectedDoctor.id} | Phòng mặc định: {selectedDoctor.room}</p>
            </div>

            {/* Form to add new schedule */}
            <div style={{ backgroundColor: '#f0f9ff', border: '2px solid #0ea5e9', borderRadius: '8px', padding: '20px', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#0c4a6e', marginBottom: '16px' }}>
                ➕ Thêm Ca Làm Việc Mới
              </h3>

              {/* Date input */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#374151', marginBottom: '6px' }}>
                  📅 Chọn ngày:
                </label>
                <input
                  type="date"
                  value={newSchedule.date}
                  onChange={(e) => setNewSchedule(prev => ({ ...prev, date: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]} // 2025-07-02
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
                />
              </div>

              {/* Room input */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#374151', marginBottom: '6px' }}>
                  🏥 Phòng làm việc:
                </label>
                <input
                  type="text"
                  value={newSchedule.room}
                  onChange={(e) => setNewSchedule(prev => ({ ...prev, room: e.target.value }))}
                  placeholder="Ví dụ: Room 1, Phòng 101..."
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
                />
              </div>

              {/* Preset times */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#374151', marginBottom: '6px' }}>
                  ⚡ Khung giờ có sẵn:
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {presetTimes.map((preset, index) => (
                    <button
                      key={index}
                      onClick={() => applyPreset(preset)}
                      style={{ padding: '6px 12px', backgroundColor: '#e0f2fe', color: '#0c4a6e', border: '1px solid #0ea5e9', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}
                    >
                      {preset.label} ({preset.start})
                    </button>
                  ))}
                </div>
              </div>

              {/* Start time selection */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#374151', marginBottom: '6px' }}>
                  🕐 Giờ bắt đầu:
                </label>
                <select
                  value={newSchedule.startTime}
                  onChange={(e) => setNewSchedule(prev => ({ ...prev, startTime: e.target.value }))}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
                >
                  {timeOptions.map(time => <option key={time} value={time}>{time}</option>)}
                </select>
              </div>

              {/* Preview */}
              {newSchedule.date && newSchedule.room && (
                <div style={{ backgroundColor: '#ecfdf5', border: '1px solid #10b981', borderRadius: '6px', padding: '12px', marginBottom: '16px' }}>
                  <p style={{ margin: 0, fontSize: '14px', color: '#065f46' }}>
                    <strong>📋 Xem trước:</strong><br />
                    👨‍⚕️ {selectedDoctor.name} (ID: {selectedDoctor.id})<br />
                    📅 {formatDate(newSchedule.date)}<br />
                    🕐 {newSchedule.startTime}<br />
                    🏥 {newSchedule.room}
                  </p>
                </div>
              )}

              <button
                onClick={addSchedule}
                style={{ width: '100%', padding: '10px 16px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                ➕ Thêm Ca Làm Việc
              </button>
            </div>

            {/* Current schedules list */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1f2937', marginBottom: '12px' }}>
                📋 Danh Sách Lịch Hiện Tại ({selectedDoctor.specificSchedules.length} ca):
              </h3>
              
              {selectedDoctor.specificSchedules.length > 0 ? (
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {selectedDoctor.specificSchedules.sort((a, b) => new Date(a.date) - new Date(b.date)).map((schedule, index) => (
                    <div key={index} style={{ 
                      backgroundColor: schedule.scheduleId ? '#f0fdf4' : '#fff7ed',
                      border: `1px solid ${schedule.scheduleId ? '#bbf7d0' : '#fed7aa'}`,
                      borderRadius: '6px',
                      padding: '12px',
                      marginBottom: '8px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <div style={{ fontWeight: 'bold', color: '#1f2937', fontSize: '14px' }}>
                          📅 {formatDate(schedule.date)}
                          {schedule.scheduleId && (
                            <span style={{ color: '#059669', marginLeft: '8px', fontSize: '12px' }}>
                              ✅ Đã lưu (ID: {schedule.scheduleId})
                            </span>
                          )}
                          {!schedule.scheduleId && (
                            <span style={{ color: '#d97706', marginLeft: '8px', fontSize: '12px' }}>
                              ⏳ Chưa lưu
                            </span>
                          )}
                        </div>
                        <div style={{ color: '#6b7280', marginTop: '4px', fontSize: '13px' }}>
                          🕐 {schedule.startTime}
                        </div>
                        <div style={{ color: '#6b7280', marginTop: '2px', fontSize: '12px' }}>
                          🏥 {schedule.room}
                        </div>
                      </div>
                      <button
                        onClick={() => removeSchedule(selectedDoctor.id, index)}
                        style={{
                          backgroundColor: '#fee2e2',
                          color: '#dc2626',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '6px 10px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          fontWeight: 'bold'
                        }}
                      >
                        🗑️ Xóa
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: '14px', color: '#9ca3af', fontStyle: 'italic', textAlign: 'center', padding: '20px' }}>
                  Chưa có lịch làm việc nào được thêm
                </p>
              )}
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                onClick={closeScheduleModal}
                style={{ padding: '10px 20px', border: '1px solid #d1d5db', borderRadius: '8px', backgroundColor: 'white', color: '#374151', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Đóng
              </button>
              <button
                onClick={saveSchedule}
                disabled={scheduleLoading || pendingSchedules.length === 0}
                style={{ 
                  padding: '10px 20px',
                  backgroundColor: scheduleLoading || pendingSchedules.length === 0 ? '#9ca3af' : '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: scheduleLoading || pendingSchedules.length === 0 ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {scheduleLoading ? (
                  <>
                    <div style={{ width: '16px', height: '16px', border: '2px solid #ffffff', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                    Đang lưu...
                  </>
                ) : (
                  <>💾 Lưu Tất Cả ({pendingSchedules.length})</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSS for loading animation */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}