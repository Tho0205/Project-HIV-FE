import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import SidebarDoctor from "../../components/Sidebar/Sidebar-Doctor";
import { tokenManager } from "../../services/account";
import CustomArvProtocolsService from "../../services/CustomArvProtocolsService";
import ARVService from "../../services/ARVService";
import ARVProtocolService from "../../services/ARVProtocolService";
import { toast } from "react-toastify";
import "./ARVProtocolManagement.css";

const ARVProtocolManagement = () => {
  const navigate = useNavigate();
  const doctorId = tokenManager.getCurrentUserId();
  const role = tokenManager.getCurrentUserRole();

  const [patients, setPatients] = useState([]);
  const [standardProtocols, setStandardProtocols] = useState([]);
  const [availableARVs, setAvailableARVs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState(null); // 'view', 'create', 'history', 'switch'
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [currentProtocol, setCurrentProtocol] = useState(null);
  const [protocolHistory, setProtocolHistory] = useState([]);
  const [newProtocolData, setNewProtocolData] = useState({
    baseProtocolId: null,
    name: "",
    description: "",
    details: []
  });
  const [selectedStandardProtocol, setSelectedStandardProtocol] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [patientsPerPage] = useState(10);

  // Tính toán phân trang sử dụng useMemo để tối ưu hiệu năng
  const indexOfLastPatient = currentPage * patientsPerPage;
  const indexOfFirstPatient = indexOfLastPatient - patientsPerPage;
  const currentPatients = useMemo(() => {
    return patients.slice(indexOfFirstPatient, indexOfLastPatient);
  }, [patients, indexOfFirstPatient, indexOfLastPatient]);
  
  const totalPages = Math.ceil(patients.length / patientsPerPage);

  const paginate = (pageNumber) => {
    if (pageNumber < 1 || pageNumber > totalPages) return;
    setCurrentPage(pageNumber);
  };

  // Fetch initial data
  const fetchInitialData = useCallback(async () => {
    if (!doctorId) return;
    setLoading(true);
    try {
      const [patientsData, protocolsData, arvsData] = await Promise.all([
        CustomArvProtocolsService.getPatientsWithProtocols(doctorId),
        ARVProtocolService.getAllProtocols(),
        ARVService.getAllARVs(),
      ]);
      
      // Đảm bảo patients là unique
      const uniquePatients = [...new Map(patientsData.map(item => 
        [item.patientId, item])).values()];
      
      setPatients(uniquePatients);
      setStandardProtocols(protocolsData);
      setAvailableARVs(arvsData);
    } catch (err) {
      toast.error("Lỗi khi tải dữ liệu ban đầu: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [doctorId]);

  useEffect(() => {
    if (!doctorId || role !== "Doctor") {
      toast.error("Bạn không có quyền truy cập");
      navigate("/");
    } else {
      fetchInitialData();
    }
  }, [doctorId, role, navigate, fetchInitialData]);

  const loadProtocolDetails = async (protocolId) => {
    try {
      const details = await ARVProtocolService.getProtocolDetails(protocolId);
      return details;
    } catch (err) {
      toast.error("Không thể lấy chi tiết phác đồ: " + err.message);
      return [];
    }
  };

  // Load patient protocol details
  const loadPatientProtocol = async (patientId) => {
    try {
      setLoading(true);
      const [current, history] = await Promise.all([
        CustomArvProtocolsService.getPatientCurrentProtocol(patientId),
        CustomArvProtocolsService.getPatientProtocolHistory(patientId)
      ]);
      
      setCurrentProtocol(current);
      setProtocolHistory(history);
    } catch (err) {
      toast.error("Lỗi khi tải thông tin phác đồ: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle patient selection
  const handleSelectPatient = (patient) => {
    setSelectedPatient(patient);
    loadPatientProtocol(patient.patientId);
    setModalType('view');
    setIsModalOpen(true);
  };

  // Handle create new protocol
  const handleCreateProtocol = async () => {
    try {
      setLoading(true);
      const createdProtocol = await CustomArvProtocolsService.createCustomProtocol(
        doctorId,
        selectedPatient.patientId,
        newProtocolData
      );
      
      toast.success("Tạo phác đồ thành công!");
      await loadPatientProtocol(selectedPatient.patientId);
      setModalType('view');
      setNewProtocolData({
        baseProtocolId: null,
        name: "",
        description: "",
        details: []
      });
    } catch (err) {
      toast.error("Lỗi khi tạo phác đồ: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle protocol update
  const handleUpdateProtocol = async (protocolId, isCustom) => {
    try {
      setLoading(true);
      await CustomArvProtocolsService.updatePatientProtocol(
        selectedPatient.patientId,
        { protocolId, isCustom }
      );
      
      toast.success("Cập nhật phác đồ thành công!");
      await loadPatientProtocol(selectedPatient.patientId);

        window.location.reload();
      setModalType('view');
    } catch (err) {
      toast.error("Lỗi khi cập nhật phác đồ: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Add ARV to new protocol
  const addARVToProtocol = (arvId) => {
    const arv = availableARVs.find(a => a.arvId === arvId);
    if (!arv) return;

    setNewProtocolData(prev => ({
      ...prev,
      details: [
        ...prev.details,
        {
          arvId,
          dosage: "1 viên",
          usageInstruction: "Uống hàng ngày",
          status: "ACTIVE"
        }
      ]
    }));
  };

  // Handle standard protocol selection
  const handleStandardProtocolSelect = async (protocolId) => {
    const protocol = standardProtocols.find(p => p.protocolId === protocolId);
    if (!protocol) return;

    const details = await loadProtocolDetails(protocolId);
    
    setSelectedStandardProtocol({
      ...protocol,
      details: details
    });
    
    setNewProtocolData({
      baseProtocolId: protocolId,
      name: protocol.name,
      description: protocol.description,
      details: details.map(d => ({
        arvId: d.arvId,
        dosage: d.dosage || "1 viên",
        usageInstruction: d.usageInstruction || "Uống hàng ngày",
        status: "ACTIVE"
      }))
    });
  };

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN");
  };

  return (
    <div className="doctor-dashboard-layout">
      <div className="sidebar-section">
        <SidebarDoctor active="protocol" />
      </div>
      <div className="main-content-section">
        <main className="content">     
          <div className="patient-list-container">
            <table className="patient-table">
              <thead>
                <tr>
                  <th>STT</th>
                  <th>Họ Tên</th>
                  <th>Điện thoại</th>
                  <th>Xét nghiệm gần nhất</th>
                  <th>Phác đồ hiện tại</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {loading && patients.length === 0 ? (
                  <tr><td colSpan="6">Đang tải dữ liệu...</td></tr>
                ) : currentPatients.length === 0 ? (
                  <tr><td colSpan="6">Không có bệnh nhân nào</td></tr>
                ) : (
                  currentPatients.map((patient, index) => {
                    const globalIndex = indexOfFirstPatient + index;
                    return (
                      <tr key={`${patient.patientId}-${globalIndex}`}>
                        <td>{globalIndex + 1}</td>
                        <td>{patient.fullName}</td>
                        <td>{patient.phone || "N/A"}</td>
                        <td>
                          {patient.latestExamination ? (
                            <>
                              <div>Ngày: {formatDate(patient.latestExamination.examDate)}</div>
                              <div>CD4: {patient.latestExamination.cd4Count || "N/A"}</div>
                              <div>Tải lượng: {patient.latestExamination.hivLoad || "N/A"}</div>
                            </>
                          ) : "Không có dữ liệu"}
                        </td>
                        <td>
                          {patient.currentProtocol?.name || "Chưa có phác đồ"}
                        </td>
                        <td>
                          <button 
                            className="btn-view"
                            onClick={() => handleSelectPatient(patient)}
                          >
                            Xem chi tiết
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
            
            {patients.length > patientsPerPage && (
              <div className="pagination">
                <button 
                  onClick={() => paginate(1)} 
                  disabled={currentPage === 1}
                >
                  &laquo;
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNumber;
                  if (totalPages <= 5) {
                    pageNumber = i + 1;
                  } else if (currentPage <= 3) {
                    pageNumber = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNumber = totalPages - 4 + i;
                  } else {
                    pageNumber = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNumber}
                      onClick={() => paginate(pageNumber)}
                      className={currentPage === pageNumber ? 'active' : ''}
                    >
                      {pageNumber}
                    </button>
                  );
                })}
                <button 
                  onClick={() => paginate(totalPages)} 
                  disabled={currentPage === totalPages}
                >
                  &raquo;
                </button>
              </div>
            )}
          </div>

          {/* Modal for protocol details */}
          {isModalOpen && selectedPatient && (
            <div className="modal-overlay">
              <div className="modal-content">
                <div className="modal-header">
                  <h3>
                    {modalType === 'view' && `Phác đồ của ${selectedPatient.fullName}`}
                    {modalType === 'create' && `Tạo phác đồ mới`}
                    {modalType === 'history' && `Lịch sử phác đồ`}
                    {modalType === 'switch' && `Chuyển phác đồ`}
                  </h3>
                  <button 
                    className="close-btn"
                    onClick={() => {
                      setIsModalOpen(false);
                      setModalType(null);
                      setSelectedStandardProtocol(null);
                      setNewProtocolData({
                        baseProtocolId: null,
                        name: "",
                        description: "",
                        details: []
                      });
                    }}
                  >
                    &times;
                  </button>
                </div>

                {modalType === 'view' && currentProtocol && (
                  <div className="protocol-details">
                    <div className="current-protocol">
                      <h4>Phác đồ hiện tại</h4>
                      <p><strong>Tên:</strong> {currentProtocol.name}</p>
                      <p><strong>Mô tả:</strong> {currentProtocol.description}</p>
                      <p><strong>Trạng thái:</strong> {currentProtocol.status}</p>
                      
                      <h5>Danh sách ARV</h5>
                      <ul className="arv-list">
                        {currentProtocol.details.map(detail => (
                          <li key={detail.detailId}>
                            {detail.arvName} - {detail.dosage} ({detail.usageInstruction})
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="action-buttons">
                      <button 
                        className="btn-history"
                        onClick={() => setModalType('history')}
                      >
                        Xem lịch sử
                      </button>
                      <button 
                        className="btn-switch"
                        onClick={() => setModalType('switch')}
                      >
                        Chuyển phác đồ
                      </button>
                    </div>
                  </div>
                )}

                {modalType === 'switch' && (
                  <div className="switch-protocol">
                    <div className="switch-options">
                      <h4>Chọn loại phác đồ:</h4>
                      <div className="option-buttons">
                        <button
                          className="option-btn active"
                          onClick={() => setModalType('create')}
                        >
                          Tạo phác đồ tùy chỉnh
                        </button>
                        <button
                          className="option-btn"
                          onClick={() => {
                            setModalType('select-standard');
                          }}
                        >
                          Chọn phác đồ chuẩn
                        </button>
                      </div>
                    </div>

                    <button 
                      className="btn-back"
                      onClick={() => setModalType('view')}
                    >
                      Quay lại
                    </button>
                  </div>
                )}

                {modalType === 'select-standard' && (
                  <div className="select-standard-protocol">
                    <h4>Chọn phác đồ chuẩn</h4>
                    <div className="form-group">
                      <label>Phác đồ chuẩn:</label>
                      <select
                        onChange={(e) => handleStandardProtocolSelect(parseInt(e.target.value))}
                        value={selectedStandardProtocol?.protocolId || ""}
                      >
                        <option value="">-- Chọn phác đồ --</option>
                        {standardProtocols.map(protocol => (
                          <option key={protocol.protocolId} value={protocol.protocolId}>
                            {protocol.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {selectedStandardProtocol && (
                      <div className="protocol-preview">
                        <h5>Thông tin phác đồ:</h5>
                        <p><strong>Tên:</strong> {selectedStandardProtocol.name}</p>
                        <p><strong>Mô tả:</strong> {selectedStandardProtocol.description}</p>
                        
                        <h5>Danh sách ARV:</h5>
                        {selectedStandardProtocol.details && selectedStandardProtocol.details.length > 0 ? (
                          <ul className="arv-list">
                            {selectedStandardProtocol.details.map((detail, index) => {
                              const arv = availableARVs.find(a => a.arvId === detail.arvId);
                              return (
                                <li key={index}>
                                  <div className="arv-info">
                                    <span className="arv-name">{arv?.name || `ARV ID: ${detail.arvId}`}</span>
                                    <span className="arv-dosage">Liều lượng: {detail.dosage}</span>
                                    <span className="arv-instruction">Hướng dẫn: {detail.usageInstruction}</span>
                                  </div>
                                </li>
                              );
                            })}
                          </ul>
                        ) : (
                          <p>Đang tải danh sách ARV...</p>
                        )}

                        <div className="action-buttons">
                          <button
                            className="btn-customize"
                            onClick={() => setModalType('create')}
                          >
                            Tùy chỉnh phác đồ
                          </button>
                          <button
                            className="btn-apply"
                            onClick={() => handleUpdateProtocol(selectedStandardProtocol.protocolId, false)}
                            disabled={!selectedStandardProtocol.details || selectedStandardProtocol.details.length === 0}
                          >
                            Áp dụng nguyên mẫu
                          </button>
                        </div>
                      </div>
                    )}

                    <button 
                      className="btn-back"
                      onClick={() => setModalType('switch')}
                    >
                      Quay lại
                    </button>
                  </div>
                )}

                {modalType === 'create' && (
                  <div className="create-protocol">
                    <h4>Tạo phác đồ mới</h4>
                    
                    {selectedStandardProtocol && (
                      <div className="standard-protocol-info">
                        <p>Đang tạo từ phác đồ: <strong>{selectedStandardProtocol.name}</strong></p>
                      </div>
                    )}

                    <div className="form-group">
                      <label>Tên phác đồ:</label>
                      <input
                        type="text"
                        value={newProtocolData.name}
                        onChange={(e) => setNewProtocolData({ ...newProtocolData, name: e.target.value })}
                        placeholder="Nhập tên phác đồ"
                      />
                    </div>

                    <div className="form-group">
                      <label>Mô tả:</label>
                      <textarea
                        value={newProtocolData.description}
                        onChange={(e) => setNewProtocolData({ ...newProtocolData, description: e.target.value })}
                        placeholder="Nhập mô tả phác đồ"
                      />
                    </div>

                    <div className="arv-selections">
                      <h5>Danh sách thuốc ARV:</h5>
                      {newProtocolData.details.length === 0 ? (
                        <p>Chưa có thuốc ARV nào trong phác đồ</p>
                      ) : (
                        <ul>
                          {newProtocolData.details.map((detail, index) => {
                            const arv = availableARVs.find(a => a.arvId === detail.arvId);
                            return (
                              <li key={index}>
                                <div className="arv-info">
                                  <span className="arv-name">{arv?.name || "Unknown ARV"}</span>
                                  <div className="arv-dosage">
                                    <label>Liều lượng:</label>
                                    <input
                                      type="text"
                                      value={detail.dosage}
                                      onChange={(e) => {
                                        const updatedDetails = [...newProtocolData.details];
                                        updatedDetails[index].dosage = e.target.value;
                                        setNewProtocolData({ ...newProtocolData, details: updatedDetails });
                                      }}
                                      placeholder="VD: 1 viên/ngày"
                                    />
                                  </div>
                                  <div className="arv-instruction">
                                    <label>Hướng dẫn:</label>
                                    <input
                                      type="text"
                                      value={detail.usageInstruction}
                                      onChange={(e) => {
                                        const updatedDetails = [...newProtocolData.details];
                                        updatedDetails[index].usageInstruction = e.target.value;
                                        setNewProtocolData({ ...newProtocolData, details: updatedDetails });
                                      }}
                                      placeholder="VD: Uống buổi sáng"
                                    />
                                  </div>
                                </div>
                                <button
                                  className="btn-remove"
                                  onClick={() => {
                                    const updatedDetails = newProtocolData.details.filter((_, i) => i !== index);
                                    setNewProtocolData({ ...newProtocolData, details: updatedDetails });
                                  }}
                                >
                                  Xóa
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>

                    <div className="form-actions">
                      <button
                        className="btn-cancel"
                        onClick={() => {
                          if (selectedStandardProtocol) {
                            setModalType('select-standard');
                          } else {
                            setModalType('switch');
                          }
                        }}
                      >
                        Quay lại
                      </button>
                      <button
                        className="btn-submit"
                        onClick={handleCreateProtocol}
                        disabled={loading || !newProtocolData.name || newProtocolData.details.length === 0}
                      >
                        {loading ? "Đang xử lý..." : "Lưu phác đồ"}
                      </button>
                    </div>
                  </div>
                )}

                {modalType === 'history' && (
                  <div className="protocol-history">
                    <table>
                      <thead>
                        <tr>
                          <th>Ngày tạo</th>
                          <th>Tên phác đồ</th>
                          <th>Mô tả</th>
                          <th>Trạng thái</th>
                          <th>Hành động</th>
                        </tr>
                      </thead>
                      <tbody>
                        {protocolHistory.map(protocol => (
                          <tr key={protocol.customProtocolId}>
                            <td>{formatDate(protocol.createdDate)}</td>
                            <td>{protocol.name}</td>
                            <td>{protocol.description}</td>
                            <td>{protocol.status}</td>
                            <td>
                              {protocol.status !== "ACTIVE" && (
                                <button
                                  className="btn-activate"
                                  onClick={() => handleUpdateProtocol(protocol.customProtocolId, true)}
                                >
                                  Kích hoạt
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <button 
                      className="btn-back"
                      onClick={() => setModalType('view')}
                    >
                      Quay lại
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ARVProtocolManagement;