import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ARVProtocolService from "../../services/ARVProtocolService";
import ARVService from "../../services/ARVService";
import Sidebar from "../../components/Sidebar/Sidebar";
import "./ARVProtocol.css";

export default function ARVProtocol() {
  // State quản lý dữ liệu
  const [protocols, setProtocols] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // State cho modal tạo mới
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProtocol, setNewProtocol] = useState({
    name: "",
    description: "",
    status: "ACTIVE",
    details: []
  });
  const [availableARVs, setAvailableARVs] = useState([]);
  const [filteredARVs, setFilteredARVs] = useState([]);

  // State quản lý modal khác
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [showARVModal, setShowARVModal] = useState(false);
  const [arvDetails, setArvDetails] = useState([]);
  const [selectedProtocol, setSelectedProtocol] = useState(null);

  const navigate = useNavigate();

  // Load danh sách protocol khi component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await ARVProtocolService.getProtocols();
        setProtocols(data || []);
      } catch (err) {
        setError("Failed to load protocols");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Kiểm tra quyền truy cập
    if (localStorage.getItem("role") !== "Staff") {
      alert("You are not authorized");
      navigate("/login");
    }
  }, [navigate]);

  // Load danh sách ARV khi modal tạo mới hiển thị
  useEffect(() => {
    if (showCreateModal) {
      loadARVs();
    }
  }, [showCreateModal]);

  // Hàm xử lý hiển thị chi tiết ARV
  const handleShowARVDetails = async (protocol) => {
    setSelectedProtocol(protocol);
    try {
      const details = await ARVProtocolService.getARVDetails(protocol.protocolId);
      setArvDetails(details);
      setShowARVModal(true);
    } catch (err) {
      setError("Failed to load ARV details");
      console.error(err);
    }
  };

  // Hàm tạo mới protocol
  const handleCreate = () => {
    setNewProtocol({
      name: "",
      description: "",
      status: "ACTIVE",
      details: []
    });
    setShowCreateModal(true);
    setError("");
  };

  // Hàm cập nhật protocol
  const handleUpdate = async (protocol) => {
    setEditData(protocol);
    setShowEditModal(true);
  };

  // Hàm xóa protocol
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure to delete this protocol?")) {
      try {
        await ARVProtocolService.deleteProtocol(id);
        setProtocols(protocols.filter((p) => p.protocolId !== id));
      } catch (err) {
        setError("Failed to delete protocol");
        console.error(err);
      }
    }
  };

  // Load danh sách ARV
  const loadARVs = async () => {
    try {
      const response = await ARVService.getAllARVs();
      setAvailableARVs(response || []);
      setFilteredARVs(response || []);
    } catch (err) {
      console.error("Failed to load ARVs", err);
      setError("Không thể tải danh sách ARV");
    }
  };

  // Hàm tạo mới protocol với details
  const handleCreateWithDetails = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError("");
      
      const response = await ARVProtocolService.createProtocolWithDetails(newProtocol);
      
      if (response.success) {
        setShowCreateModal(false);
        const data = await ARVProtocolService.getProtocols();
        setProtocols(data || []);
        setNewProtocol({
          name: "",
          description: "",
          status: "ACTIVE",
          details: []
        });
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError(err.message || "Failed to create protocol");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Hàm thêm ARV vào form tạo mới
  const handleAddARVDetail = () => {
    setNewProtocol(prev => ({
      ...prev,
      details: [...prev.details, {
        arvId: "",
        dosage: "",
        usageInstruction: "",
        status: "ACTIVE"
      }]
    }));
  };

  // Hàm xóa ARV khỏi form tạo mới
  const handleRemoveARVDetail = (index) => {
    setNewProtocol(prev => ({
      ...prev,
      details: prev.details.filter((_, i) => i !== index)
    }));
  };

  // Hàm cập nhật thông tin ARV detail
  const handleARVDetailChange = (index, field, value) => {
    setNewProtocol(prev => {
      const newDetails = [...prev.details];
      newDetails[index] = { ...newDetails[index], [field]: value };
      return { ...prev, details: newDetails };
    });
  };

  // Hàm tìm kiếm ARV
  const handleSearchARV = (e, index) => {
    const searchTerm = e.target.value.toLowerCase();
    const filtered = availableARVs.filter(arv => 
      arv.name.toLowerCase().includes(searchTerm) || 
      arv.arvId.toString().includes(searchTerm)
    );
    setFilteredARVs(filtered);
  };

  // Hàm submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editData.protocolId) {
        await ARVProtocolService.updateProtocol(editData.protocolId, editData);
      } else {
        await ARVProtocolService.createProtocol(editData);
      }
      setShowEditModal(false);
      const data = await ARVProtocolService.getProtocols();
      setProtocols(data || []);
    } catch (err) {
      setError(err.message || "Operation failed");
      console.error(err);
    }
  };

  // Hàm đăng xuất
  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  // Lọc protocol theo search term
  const filteredProtocols = protocols.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.description &&
        p.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="wrapper">
      <Sidebar active="arv-protocol" />
      {/* Main Content */}
      <main className="content">
        <div className="header">
          <input
            type="text"
            placeholder="Tìm Kiếm Protocols..."
            className="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <h1 className="title">Quản Lí ARV Protocol</h1>

        <div className="action-bar">
          <button className="btn-add-protocol" onClick={handleCreate}>
            ➕ Thêm Mới Protocol
          </button>
        </div>

        {error && <div className="error-message">⚠️ {error}</div>}

        <div className="table-container">
          <table className="arv-protocol-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tên</th>
                <th>Mô Tả</th>
                <th>Trạng Thái</th>
                <th>Hành Động</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5}>Đang Tải...</td>
                </tr>
              ) : filteredProtocols.length === 0 ? (
                <tr>
                  <td colSpan={5}>Không Tìm Thấy Protocols</td>
                </tr>
              ) : (
                filteredProtocols.map((p) => (
                  <tr key={p.protocolId}>
                    <td>{p.protocolId}</td>
                    <td>{p.name}</td>
                    <td>{p.description || "-"}</td>
                    <td>
                      <span className={`status-badge ${p.status.toLowerCase()}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="actions-arv-protocol">
                      <button
                        onClick={() => handleUpdate(p)}
                        title="Edit"
                        className="btn-edit-arv-protocol"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(p.protocolId)}
                        title="Delete"
                        disabled={p.status === "DELETED"}
                        className="btn-delete-arv-protocol"
                      >
                        🗑️
                      </button>
                      <button
                        onClick={() => handleShowARVDetails(p)}
                        title="View ARV Details"
                        className="btn-detail-arv-protocol"
                      >
                        👁️
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Create Modal */}
        {showCreateModal && (
          <div className="modal" style={{ display: "flex" }}>
            <div className="modal-content" style={{ maxWidth: "800px" }}>
              <h3 style={{ marginBottom: 20 }}>Thêm Protocol Mới</h3>
              {error && <div className="error-message" style={{ marginBottom: 20 }}>{error}</div>}
              
              <form onSubmit={handleCreateWithDetails}>
                <div className="form-group">
                  <label>Tên Protocol*</label>
                  <input
                    type="text"
                    value={newProtocol.name}
                    onChange={(e) => setNewProtocol({...newProtocol, name: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Mô Tả</label>
                  <textarea
                    value={newProtocol.description}
                    onChange={(e) => setNewProtocol({...newProtocol, description: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label>Trạng Thái</label>
                  <select
                    value={newProtocol.status}
                    onChange={(e) => setNewProtocol({...newProtocol, status: e.target.value})}
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>

                <div className="form-group">
                  <div className="detail-header">
                    <label>Danh Sách ARV*</label>
                    <button 
                      type="button" 
                      className="btn-add-arv"
                      onClick={handleAddARVDetail}
                    >
                      ➕ Thêm ARV
                    </button>
                  </div>

                  {newProtocol.details.map((detail, index) => (
                    <div key={index} className="arv-detail-item">
                      <div className="arv-search-container">
                        <input
                          type="text"
                          placeholder="Tìm kiếm ARV..."
                          className="arv-search-input"
                          onChange={(e) => handleSearchARV(e, index)}
                        />
                      </div>
                      
                      <div className="arv-detail-row">
                        <select
                          value={detail.arvId}
                          onChange={(e) => handleARVDetailChange(index, 'arvId', e.target.value)}
                          required
                        >
                          <option value="">Chọn ARV</option>
                          {filteredARVs.map(arv => (
                            <option key={arv.arvId} value={arv.arvId}>
                              {arv.name} ({arv.arvId})
                            </option>
                          ))}
                        </select>

                        <input
                          type="text"
                          placeholder="Liều lượng*"
                          value={detail.dosage}
                          onChange={(e) => handleARVDetailChange(index, 'dosage', e.target.value)}
                          required
                        />

                        <input
                          type="text"
                          placeholder="Hướng dẫn sử dụng"
                          value={detail.usageInstruction}
                          onChange={(e) => handleARVDetailChange(index, 'usageInstruction', e.target.value)}
                        />
                      </div>

                      <div className="arv-detail-actions">
                        <button
                          type="button"
                          className="btn-remove-arv"
                          onClick={() => handleRemoveARVDetail(index)}
                        >
                          🗑️ Xóa
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="modal-actions">
                  <button type="submit" className="btn-green" disabled={loading}>
                    {loading ? "Đang xử lý..." : "Lưu"}
                  </button>
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={() => setShowCreateModal(false)}
                    disabled={loading}
                  >
                    Hủy
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ARV Details Modal */}
        {showARVModal && (
          <div className="modal-overlay">
            <div className="modal-container">
              <div className="modal-header">
                <h3>Mô Tả ARV: {selectedProtocol.name}</h3>
                <button onClick={() => setShowARVModal(false)}>&times;</button>
              </div>
              <div className="modal-body">
                {arvDetails.length > 0 ? (
                  <table className="arv-details-table">
                    <thead>
                      <tr>
                        <th>ARV ID</th>
                        <th>Tên ARV</th>
                        <th>Liều Dùng</th>
                        <th>Hướng Dẫn Sử Dụng</th>
                      </tr>
                    </thead>
                    <tbody>
                      {arvDetails.map((detail) => (
                        <tr key={detail.arvId}>
                          <td>{detail.arvId}</td>
                          <td>{detail.arvName}</td>
                          <td>{detail.dosage || "-"}</td>
                          <td>{detail.usageInstruction || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p>No ARV medications in this protocol</p>
                )}
              </div>
              <div className="modal-footer">
                <button onClick={() => setShowARVModal(false)}>Close</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}