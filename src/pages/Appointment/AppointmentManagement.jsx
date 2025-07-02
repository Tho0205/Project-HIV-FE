import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Sidebar from "../../components/Sidebar/Sidebar";
import Pagination from "../../components/Pagination/Pagination";
import { tokenManager } from "../../services/account";
import appointmentService from "../../services/Appointment";

const PAGE_SIZE = 8;

const AppointmentManagement = () => {
  // Hide navbar and footer with CSS
  React.useEffect(() => {
    // Hide navbar and footer
    const navbar = document.querySelector('nav, .navbar, header');
    const footer = document.querySelector('footer, .footer');
    
    if (navbar) navbar.style.display = 'none';
    if (footer) footer.style.display = 'none';
    
    // Show them back when component unmounts
    return () => {
      if (navbar) navbar.style.display = '';
      if (footer) footer.style.display = '';
    };
  }, []);
  // State
  const [appointments, setAppointments] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState("date_desc");
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [validStatuses, setValidStatuses] = useState([]);
  const [validTransitions, setValidTransitions] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [updating, setUpdating] = useState(false);

  const navigate = useNavigate();

  // Styles
  const wrapperStyle = {
    display: 'flex',
    height: '100vh',
    backgroundColor: '#f5f5f5',
    margin: 0,
    padding: 0,
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999
  };

  const contentStyle = {
    flex: 1,
    padding: '20px',
    overflow: 'auto'
  };

  const headerStyle = {
    display: 'flex',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: '20px',
    backgroundColor: 'white',
    padding: '15px',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  };

  const searchStyle = {
    padding: '10px 15px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    width: '400px',
    outline: 'none'
  };

  const userStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '15px'
  };

  const titleStyle = {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '20px'
  };

  const sortBarStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '20px',
    backgroundColor: 'white',
    padding: '15px',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  };

  const selectStyle = {
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    outline: 'none'
  };

  const tableStyle = {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    marginBottom: '20px'
  };

  const theadStyle = {
    backgroundColor: '#f8f9fa'
  };

  const thStyle = {
    padding: '15px 10px',
    textAlign: 'left',
    fontWeight: 'bold',
    color: '#333',
    borderBottom: '1px solid #dee2e6',
    fontSize: '14px'
  };

  const tdStyle = {
    padding: '12px 10px',
    borderBottom: '1px solid #f1f1f1',
    fontSize: '14px',
    color: '#555'
  };

  const sttStyle = {
    ...tdStyle,
    textAlign: 'center',
    fontWeight: 'bold',
    width: '60px'
  };

  const appointmentIdStyle = {
    ...tdStyle,
    fontWeight: 'bold',
    color: '#1e40af',
    textAlign: 'center',
    minWidth: '100px'
  };

  const doctorNameStyle = {
    ...tdStyle,
    minWidth: '180px'
  };

  const patientNameStyle = {
    ...tdStyle,
    fontWeight: 'bold',
    color: '#059669',
    minWidth: '150px'
  };

  const dateStyle = {
    ...tdStyle,
    minWidth: '110px',
    textAlign: 'center'
  };

  const timeStyle = {
    ...tdStyle,
    minWidth: '80px',
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#7c3aed'
  };

  const noteStyle = {
    ...tdStyle,
    maxWidth: '150px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  };

  const statusStyle = {
    ...tdStyle,
    textAlign: 'center',
    minWidth: '120px'
  };

  const typeStyle = {
    ...tdStyle,
    textAlign: 'center',
    minWidth: '80px',
    fontStyle: 'italic'
  };

  const actionsStyle = {
    ...tdStyle,
    minWidth: '120px'
  };

  const actionButtonsStyle = {
    display: 'flex',
    gap: '5px',
    flexWrap: 'wrap',
    justifyContent: 'center'
  };

  const buttonStyle = {
    minWidth: '30px',
    height: '30px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
    transition: 'all 0.2s ease'
  };

  const editButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#f59e0b',
    color: 'white'
  };

  const completeButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#10b981',
    color: 'white'
  };

  const cancelButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#ef4444',
    color: 'white'
  };

  const modalStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
  };

  const modalContentStyle = {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '8px',
    width: '90%',
    maxWidth: '500px',
    maxHeight: '90vh',
    overflow: 'auto'
  };

  const modalTitleStyle = {
    fontSize: '20px',
    fontWeight: 'bold',
    marginBottom: '20px',
    color: '#333'
  };

  const errorStyle = {
    color: '#ef4444',
    marginBottom: '15px',
    fontSize: '14px'
  };

  const infoBoxStyle = {
    backgroundColor: '#f3f4f6',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '20px',
    fontSize: '14px'
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '5px',
    fontWeight: 'bold',
    color: '#374151'
  };

  const inputStyle = {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    marginBottom: '15px',
    outline: 'none'
  };

  const textareaStyle = {
    ...inputStyle,
    resize: 'vertical',
    minHeight: '80px'
  };

  const modalActionsStyle = {
    display: 'flex',
    gap: '10px',
    justifyContent: 'flex-end',
    marginTop: '20px'
  };

  const btnGreenStyle = {
    backgroundColor: '#10b981',
    color: 'white',
    padding: '10px 20px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500'
  };

  const btnCancelStyle = {
    backgroundColor: '#6b7280',
    color: 'white',
    padding: '10px 20px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500'
  };

  // Fetch appointments
  useEffect(() => {
    fetchAppointments(page, sort, searchTerm);
  }, [page, sort, searchTerm]);

  // Check authorization
  useEffect(() => {
    const role = tokenManager.getCurrentUserRole();
    if (role !== "Staff" && role !== "Manager" && role !== "Doctor") {
      toast.error("Bạn không có quyền truy cập trang này", { autoClose: 1000 });
      navigate("/");
    }
  }, [navigate]);

  async function fetchAppointments(page, sort, search) {
    setLoading(true);
    try {
      const [appointmentsData, doctorsData, statusesData] = await Promise.all([
        appointmentService.getAppointments(),
        appointmentService.getDoctors(),
        appointmentService.getValidStatuses()
      ]);

      // Map appointments with doctor and patient information
      let mappedAppointments = await Promise.all(appointmentsData.map(async appointment => {
        const doctorId = appointment.doctorId || appointment.DoctorId;
        const patientId = appointment.patientId || appointment.PatientId;
        const doctor = doctorsData.find(d => d.userId === doctorId);
        const dateInfo = appointmentService.formatDate(appointment.appointmentDate || appointment.createdAt);
        
        // Get patient information
        let patientName = "Bệnh nhân không xác định";
        try {
          const patientInfo = await appointmentService.getPatientInfo(patientId);
          patientName = patientInfo.fullName || `Bệnh nhân #${patientId}`;
        } catch (error) {
          patientName = `Bệnh nhân #${patientId}`;
        }
        
        return {
          ...appointment,
          doctorName: doctor ? (doctor.fullName || doctor.name || "Bác sĩ không xác định") : "Bác sĩ không xác định",
          doctorSpecialty: doctor ? (doctor.specialty || '') : '',
          patientId: patientId,
          patientName: patientName,
          formattedDate: dateInfo,
          appointmentDateTime: new Date(appointment.appointmentDate || appointment.createdAt)
        };
      }));

      // Apply search filter
      if (search) {
        mappedAppointments = mappedAppointments.filter(appointment =>
          appointment.doctorName.toLowerCase().includes(search.toLowerCase()) ||
          appointment.appointmentId.toString().includes(search) ||
          appointment.patientName.toLowerCase().includes(search.toLowerCase()) ||
          appointment.patientId.toString().includes(search) ||
          (appointment.note && appointment.note.toLowerCase().includes(search.toLowerCase()))
        );
      }

      // Apply sorting
      mappedAppointments.sort((a, b) => {
        switch (sort) {
          case "date_asc":
            return a.appointmentDateTime - b.appointmentDateTime;
          case "date_desc":
            return b.appointmentDateTime - a.appointmentDateTime;
          case "doctor_asc":
            return a.doctorName.localeCompare(b.doctorName);
          case "doctor_desc":
            return b.doctorName.localeCompare(a.doctorName);
          case "status_asc":
            return a.status.localeCompare(b.status);
          case "status_desc":
            return b.status.localeCompare(a.status);
          default:
            return b.appointmentDateTime - a.appointmentDateTime;
        }
      });

      // Apply pagination
      setTotal(mappedAppointments.length);
      const startIndex = (page - 1) * PAGE_SIZE;
      const endIndex = startIndex + PAGE_SIZE;
      const paginatedAppointments = mappedAppointments.slice(startIndex, endIndex);

      setAppointments(paginatedAppointments);
      setValidStatuses(statusesData);
    } catch (err) {
      setAppointments([]);
      setTotal(0);
      toast.error(err.message || 'Có lỗi xảy ra khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }

  // Handle sort change
  function handleSortChange(e) {
    setSort(e.target.value);
    setPage(1);
  }

  // Handle search
  function handleSearchChange(e) {
    setSearchTerm(e.target.value);
    setPage(1);
  }

  // Handle open status modal
  async function openStatusModal(appointment) {
    setSelectedAppointment(appointment);
    setSelectedStatus('');
    setStatusNote('');
    setError('');
    
    try {
      const transitions = await appointmentService.getValidTransitions(appointment.status);
      setValidTransitions(transitions);
      setShowModal(true);
    } catch (err) {
      toast.error(`Lỗi khi tải danh sách chuyển đổi: ${err.message}`);
    }
  }

  // Handle modal close
  function closeModal() {
    setShowModal(false);
    setSelectedAppointment(null);
    setSelectedStatus('');
    setStatusNote('');
    setError("");
  }

  // Handle status update
  async function handleStatusUpdate(e) {
    e.preventDefault();
    if (!selectedStatus) {
      setError('Vui lòng chọn trạng thái mới');
      return;
    }

    setUpdating(true);
    setError('');

    try {
      await appointmentService.updateAppointmentStatus(
        selectedAppointment.appointmentId,
        selectedStatus,
        statusNote || null
      );

      closeModal();
      toast.success("Cập nhật trạng thái thành công", { autoClose: 1000 });
      fetchAppointments(page, sort, searchTerm);
    } catch (err) {
      setError(err.message || "Cập nhật trạng thái thất bại");
    } finally {
      setUpdating(false);
    }
  }

  // Quick status change
  async function handleQuickStatusChange(appointment, newStatus) {
    if (window.confirm(`Bạn có chắc chắn muốn chuyển trạng thái thành "${getStatusText(newStatus)}"?`)) {
      try {
        await appointmentService.updateAppointmentStatus(
          appointment.appointmentId,
          newStatus,
          null
        );
        toast.success('Cập nhật trạng thái thành công!', { autoClose: 1000 });
        fetchAppointments(page, sort, searchTerm);
      } catch (err) {
        toast.error(`Lỗi khi cập nhật trạng thái: ${err.message}`);
      }
    }
  }

  // Get status badge style
  const getStatusBadgeStyle = (status) => {
    const baseStyle = {
      padding: '4px 12px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: 'bold',
      display: 'inline-block'
    };

    switch (status) {
      case 'CONFIRMED':
        return { ...baseStyle, backgroundColor: '#dbeafe', color: '#1e40af' };
      case 'COMPLETED':
        return { ...baseStyle, backgroundColor: '#dcfce7', color: '#15803d' };
      case 'CANCELLED':
        return { ...baseStyle, backgroundColor: '#fee2e2', color: '#b91c1c' };
      case 'SCHEDULED':
        return { ...baseStyle, backgroundColor: '#fef9c3', color: '#a16207' };
      default:
        return { ...baseStyle, backgroundColor: '#f3f4f6', color: '#1f2937' };
    }
  };

  // Get status text
  const getStatusText = (status) => {
    const texts = {
      'CONFIRMED': 'Đã xác nhận',
      'COMPLETED': 'Đã hoàn thành', 
      'CANCELLED': 'Đã hủy',
      'SCHEDULED': 'Đã lên lịch'
    };
    return texts[status] || status;
  };

  // Format date
  function formatDate(dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return d.toLocaleDateString("vi-VN");
  }

  // Format time
  function formatTime(dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return d.toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' });
  }

  return (
    <div style={wrapperStyle}>
      {/* Sidebar */}
      <Sidebar active="appointment" />
      
      {/* Main Content */}
      <main style={contentStyle}>
        <div style={headerStyle}>
          <input 
            type="text" 
            placeholder="Tìm kiếm theo ID, bác sĩ, tên bệnh nhân..." 
            style={searchStyle}
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>

        <h1 style={titleStyle}>Quản Lý Lịch Đặt Khám</h1>

        <div style={sortBarStyle}>
          <label style={{ fontWeight: 'bold', color: '#374151' }}>Xắp Xếp:</label>
          <select value={sort} onChange={handleSortChange} style={selectStyle}>
            <option value="date_desc">Theo Ngày: Mới nhất</option>
            <option value="date_asc">Theo Ngày: Cũ nhất</option>
            <option value="doctor_asc">Theo Bác sĩ: A - Z</option>
            <option value="doctor_desc">Theo Bác sĩ: Z - A</option>
            <option value="status_asc">Theo Trạng thái: A - Z</option>
            <option value="status_desc">Theo Trạng thái: Z - A</option>
          </select>
        </div>

        <table style={tableStyle}>
          <thead style={theadStyle}>
            <tr>
              <th style={thStyle}>STT</th>
              <th style={thStyle}>ID Lịch Hẹn</th>
              <th style={thStyle}>Bác Sĩ</th>
              <th style={thStyle}>Tên Bệnh Nhân</th>
              <th style={thStyle}>Ngày Khám</th>
              <th style={thStyle}>Giờ Khám</th>
              <th style={thStyle}>Ghi Chú</th>
              <th style={thStyle}>Trạng Thái</th>
              <th style={thStyle}>Loại Hẹn</th>
              <th style={thStyle}>Hành Động</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={10} style={{ ...tdStyle, textAlign: "center", padding: '40px' }}>
                  Đang tải...
                </td>
              </tr>
            ) : appointments.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ ...tdStyle, textAlign: "center", padding: '40px' }}>
                  Không có dữ liệu
                </td>
              </tr>
            ) : (
              appointments.map((appointment, idx) => (
                <tr key={appointment.appointmentId} style={{ backgroundColor: idx % 2 === 0 ? '#fafafa' : 'white' }}>
                  <td style={sttStyle}>{(page - 1) * PAGE_SIZE + idx + 1}</td>
                  <td style={appointmentIdStyle}>#{appointment.appointmentId}</td>
                  <td style={doctorNameStyle}>
                    <div>
                      <div style={{ fontWeight: 'bold', color: '#1f2937' }}>
                        {appointment.doctorName}
                      </div>
                      {appointment.doctorSpecialty && (
                        <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                          {appointment.doctorSpecialty}
                        </div>
                      )}
                    </div>
                  </td>
                  <td style={patientNameStyle}>
                    <div>
                      <div style={{ fontWeight: 'bold', color: '#059669' }}>
                        {appointment.patientName}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                        ID: #{appointment.patientId}
                      </div>
                    </div>
                  </td>
                  <td style={dateStyle}>{formatDate(appointment.appointmentDate)}</td>
                  <td style={timeStyle}>{formatTime(appointment.appointmentDate)}</td>
                  <td style={noteStyle} title={appointment.note || '-'}>
                    {appointment.note || '-'}
                  </td>
                  <td style={statusStyle}>
                    <span style={getStatusBadgeStyle(appointment.status)}>
                      {getStatusText(appointment.status)}
                    </span>
                  </td>
                  <td style={typeStyle}>
                    {appointment.isAnonymous ? 'Ẩn danh' : 'Thường'}
                  </td>
                  <td style={actionsStyle}>
                    <div style={actionButtonsStyle}>
                      {appointment.status === 'CONFIRMED' && (
                        <>
                          <button
                            style={completeButtonStyle}
                            onClick={() => handleQuickStatusChange(appointment, 'COMPLETED')}
                            title="Hoàn thành"
                            onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'}
                            onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                          >
                            ✓
                          </button>
                          <button
                            style={cancelButtonStyle}
                            onClick={() => handleQuickStatusChange(appointment, 'CANCELLED')}
                            title="Hủy"
                            onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'}
                            onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                          >
                            ✗
                          </button>
                        </>
                      )}
                      <button
                        style={editButtonStyle}
                        onClick={() => openStatusModal(appointment)}
                        title="Chỉnh sửa"
                        onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'}
                        onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                      >
                        ✏️
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        <Pagination
          page={page}
          total={total}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
        />

        {/* Status Change Modal */}
        {showModal && selectedAppointment && (
          <div style={modalStyle}>
            <div style={modalContentStyle}>
              <h3 style={modalTitleStyle}>Thay Đổi Trạng Thái Lịch Hẹn</h3>
              {error && <div style={errorStyle}>{error}</div>}
              
              {/* Appointment Info */}
              <div style={infoBoxStyle}>
                <div style={{ marginBottom: '8px' }}>
                  <strong>ID Lịch Hẹn:</strong> #{selectedAppointment.appointmentId}
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <strong>Bác Sĩ:</strong> {selectedAppointment.doctorName}
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <strong>Bệnh Nhân:</strong> {selectedAppointment.patientName} (ID: #{selectedAppointment.patientId})
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <strong>Ngày & Giờ:</strong> {formatDate(selectedAppointment.appointmentDate)} - {formatTime(selectedAppointment.appointmentDate)}
                </div>
                <div>
                  <strong>Trạng Thái Hiện Tại:</strong>
                  <span style={{ 
                    ...getStatusBadgeStyle(selectedAppointment.status),
                    marginLeft: '8px'
                  }}>
                    {getStatusText(selectedAppointment.status)}
                  </span>
                </div>
              </div>

              <form onSubmit={handleStatusUpdate}>
                <label style={labelStyle}>Trạng Thái Mới</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  style={inputStyle}
                  required
                >
                  <option value="">-- Chọn trạng thái --</option>
                  {validTransitions.map(status => (
                    <option key={status} value={status}>
                      {getStatusText(status)}
                    </option>
                  ))}
                </select>
                
                {validTransitions.length === 0 && (
                  <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '-10px', marginBottom: '15px' }}>
                    Không thể thay đổi trạng thái từ "{getStatusText(selectedAppointment.status)}"
                  </div>
                )}

                <label style={labelStyle}>Ghi Chú (tùy chọn)</label>
                <textarea
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder="Nhập ghi chú về việc thay đổi trạng thái..."
                  style={textareaStyle}
                />

                <div style={modalActionsStyle}>
                  <button 
                    type="submit" 
                    style={{
                      ...btnGreenStyle,
                      opacity: updating || !selectedStatus ? 0.6 : 1,
                      cursor: updating || !selectedStatus ? 'not-allowed' : 'pointer'
                    }}
                    disabled={updating || !selectedStatus}
                  >
                    {updating ? 'Đang cập nhật...' : 'Cập Nhật'}
                  </button>
                  <button
                    type="button"
                    style={{
                      ...btnCancelStyle,
                      opacity: updating ? 0.6 : 1,
                      cursor: updating ? 'not-allowed' : 'pointer'
                    }}
                    onClick={closeModal}
                    disabled={updating}
                  >
                    Hủy
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AppointmentManagement;