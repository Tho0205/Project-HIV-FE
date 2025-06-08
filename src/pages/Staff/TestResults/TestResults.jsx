import React, { useState } from 'react';
import './TestResults.css';

const TestResults = () => {
  const [showModal, setShowModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState('');
  const [formData, setFormData] = useState({
    patientName: '',
    age: '',
    gender: '',
    doctor: '',
    currentCondition: '',
    testDate: '',
    cd4: '',
    viralLoad: '',
    result: ''
  });

  // Mock data - trong thực tế sẽ lấy từ API
  const patients = [
    {
      id: 1,
      name: 'Jade Cooper',
      code: '#001',
      email: 'jade.cooper@example.com',
      phone: '033123443',
      appointmentDate: '10PM 12/8/2025',
      consultType: 'Trực Tiếp',
      gender: 'Nữ',
      doctor: 'Lê Văn A'
    },
    {
      id: 2,
      name: 'Anonymous1',
      code: '#002',
      email: 'marion.james@example.com',
      phone: '033123445',
      appointmentDate: '10PM 12/8/2025',
      consultType: 'Gọi Điện',
      gender: 'Nam',
      doctor: 'Nguyễn Văn A'
    },
    {
      id: 3,
      name: 'Stephanie Cookv',
      code: '#003',
      email: 'stephanie.cook@example.com',
      phone: '033123445',
      appointmentDate: '10PM 12/8/2025',
      consultType: 'Trực Tuyến',
      gender: 'Nữ',
      doctor: 'Mai Hoàng A'
    }
  ];

  const openModal = (patientName) => {
    setSelectedPatient(patientName);
    setFormData({
      ...formData,
      patientName: patientName
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedPatient('');
    // Reset form
    setFormData({
      patientName: '',
      age: '',
      gender: '',
      doctor: '',
      currentCondition: '',
      testDate: '',
      cd4: '',
      viralLoad: '',
      result: ''
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Xử lý submit form
    console.log('Form data:', formData);
    // TODO: Gọi API để lưu kết quả xét nghiệm
    closeModal();
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getConsultTypeClass = (type) => {
    switch(type) {
      case 'Trực Tiếp':
        return 'consult-direct';
      case 'Gọi Điện':
        return 'consult-phone';
      case 'Trực Tuyến':
        return 'consult-online';
      default:
        return '';
    }
  };

  return (
    <div className="test-results-container">
      <div className="page-header">
        <h1 className="page-title">Thêm Kết Quả Xét Nghiệm</h1>
        <div className="title-underline"></div>
      </div>

      <div className="filter-bar">
        <span className="filter-label">Sắp Xếp:</span>
        <select className="filter-select">
          <option>Theo Tên</option>
          <option>Theo Ngày</option>
          <option>Theo Trạng Thái</option>
        </select>
        <button className="filter-btn">
          <i className="fas fa-filter"></i> Lọc
        </button>
      </div>

      <div className="patients-table-container">
        <table className="patients-table">
          <thead>
            <tr>
              <th>STT</th>
              <th>Họ Và Tên</th>
              <th>Email</th>
              <th>SĐT</th>
              <th>Ngày Khám</th>
              <th>PT Tư Vấn</th>
              <th>Giới Tính</th>
              <th>Bác Sĩ</th>
              <th>Hành Động</th>
            </tr>
          </thead>
          <tbody>
            {patients.map((patient, index) => (
              <tr key={patient.id}>
                <td>{index + 1}</td>
                <td>
                  <div className="patient-info">
                    <div className="patient-avatar">
                      {getInitials(patient.name)}
                    </div>
                    <div>
                      <div className="patient-name">{patient.name}</div>
                      <div className="patient-code">{patient.code}</div>
                    </div>
                  </div>
                </td>
                <td>{patient.email}</td>
                <td>{patient.phone}</td>
                <td>{patient.appointmentDate}</td>
                <td>
                  <span className={`consult-type ${getConsultTypeClass(patient.consultType)}`}>
                    {patient.consultType}
                  </span>
                </td>
                <td>
                  <span className={`gender-badge ${patient.gender === 'Nam' ? 'male' : 'female'}`}>
                    {patient.gender}
                  </span>
                </td>
                <td>
                  <div className="doctor-info">
                    <i className="fas fa-user-md"></i>
                    <span>{patient.doctor}</span>
                  </div>
                </td>
                <td>
                  <button 
                    className="add-result-btn" 
                    onClick={() => openModal(patient.name)}
                  >
                    <i className="fas fa-plus"></i> Thêm KQ
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <div className="pagination-info">
          Hiển thị <span>1</span> đến <span>3</span> của <span>3</span> kết quả
        </div>
        <div className="pagination-controls">
          <button className="pagination-btn active">1</button>
          <button className="pagination-btn">2</button>
          <button className="pagination-btn">
            <i className="fas fa-chevron-right"></i>
          </button>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Thêm KQ Xét Nghiệm</h3>
              <button className="modal-close" onClick={closeModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="modal-body">
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Họ Và Tên</label>
                  <input
                    type="text"
                    name="patientName"
                    value={formData.patientName}
                    onChange={handleInputChange}
                    placeholder="Tự Động Điền theo Dữ liệu đã lưu"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Tuổi/ Năm Sinh</label>
                    <input
                      type="text"
                      name="age"
                      value={formData.age}
                      onChange={handleInputChange}
                      placeholder="Tự Động Điền theo Dữ liệu đã lưu"
                    />
                  </div>
                  <div className="form-group">
                    <label>Giới Tính</label>
                    <input
                      type="text"
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      placeholder="Tự Động Điền theo Dữ liệu đã lưu"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Bác Sĩ Chỉ Định</label>
                  <input
                    type="text"
                    name="doctor"
                    value={formData.doctor}
                    onChange={handleInputChange}
                    placeholder="Tự Động Điền theo Dữ liệu đã lưu"
                  />
                </div>

                <div className="form-group">
                  <label>Tình Trạng Hiện Tại</label>
                  <textarea
                    name="currentCondition"
                    value={formData.currentCondition}
                    onChange={handleInputChange}
                    rows="4"
                    placeholder="Nhập tình trạng hiện tại của bệnh nhân..."
                  />
                </div>

                <div className="form-group">
                  <label>Ngày Xét Nghiệm</label>
                  <input
                    type="date"
                    name="testDate"
                    value={formData.testDate}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-section">
                  <h4>Gợi ý theo chỉ số CD4, tải lượng HIV, bệnh kèm</h4>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>CD4</label>
                      <select
                        name="cd4"
                        value={formData.cd4}
                        onChange={handleInputChange}
                      >
                        <option value="">&gt; 200</option>
                        <option value="100-200">100-200</option>
                        <option value="< 100">&lt; 100</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Tải Lượng HIV</label>
                      <select
                        name="viralLoad"
                        value={formData.viralLoad}
                        onChange={handleInputChange}
                      >
                        <option value="">Không Phát Hiện</option>
                        <option value="< 50">&lt; 50 copies/ml</option>
                        <option value="50-1000">50-1000 copies/ml</option>
                        <option value="> 1000">&gt; 1000 copies/ml</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Kết Quả</label>
                    <textarea
                      name="result"
                      value={formData.result}
                      onChange={handleInputChange}
                      rows="4"
                      placeholder="Nhập kết quả xét nghiệm chi tiết..."
                    />
                  </div>
                </div>

                <button type="submit" className="submit-btn">
                  Thêm Kết Quả
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestResults;