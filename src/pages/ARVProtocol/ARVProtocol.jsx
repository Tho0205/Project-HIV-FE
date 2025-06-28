import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import ARVProtocolService from "../../services/ARVProtocolService";
import Sidebar from "../../components/Sidebar/Sidebar";
import "./ARVProtocol.css";
import { tokenManager } from "../../services/account";
import { toast } from "react-toastify";

export default function ARVProtocol() {
  // State quản lý dữ liệu
  const [protocols, setProtocols] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // State quản lý modal
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
    const role = tokenManager.getCurrentUserRole();
    if (role !== "Staff") {
      toast.error("Bạn không có quyền truy cập");
      navigate("/");
    }
  }, [navigate]);

  // Hàm xử lý hiển thị chi tiết ARV
  const handleShowARVDetails = async (protocol) => {
    setSelectedProtocol(protocol);
    try {
      const details = await ARVProtocolService.getARVDetails(
        protocol.protocolId
      );
      setArvDetails(details);
      setShowARVModal(true);
    } catch (err) {
      setError("Lỗi khi lấy ARV");
      console.error(err);
    }
  };

  // Hàm tạo mới protocol
  const handleCreate = async () => {
    setEditData({ name: "", description: "", status: "ACTIVE" });
    setShowEditModal(true);
  };

  // Hàm cập nhật protocol
  const handleUpdate = async (protocol) => {
    setEditData(protocol);
    setShowEditModal(true);
  };

  // Hàm xóa protocol
  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa protocol này?")) {
      try {
        await ARVProtocolService.deleteProtocol(id);
        setProtocols(protocols.filter((p) => p.protocolId !== id));
      } catch (err) {
        setError("Lỗi khi xóa protocol");
        console.error(err);
      }
    }
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
                    <td>{p.status}</td>
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

        {/* Edit Modal */}
        {showEditModal && (
          <div className="modal" style={{ display: "flex" }}>
            <div className="modal-content">
              <h3 style={{ marginBottom: 30 }}>
                {editData.protocolId ? "Cập Nhật Protocol" : "Thêm Protocol"}
              </h3>
              <h4 style={{ marginBottom: 30, color: "red" }}>{error}</h4>
              <form id="modalForm" onSubmit={handleSubmit}>
                <label>Tên*</label>
                <input
                  type="text"
                  value={editData.name}
                  onChange={(e) =>
                    setEditData({ ...editData, name: e.target.value })
                  }
                  required
                />

                <label>Mô Tả</label>
                <textarea
                  value={editData.description}
                  onChange={(e) =>
                    setEditData({ ...editData, description: e.target.value })
                  }
                />

                <label>Trạng Thái</label>
                <select
                  value={editData.status}
                  onChange={(e) =>
                    setEditData({ ...editData, status: e.target.value })
                  }
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="DELETED">Deleted</option>
                </select>

                <div className="modal-actions">
                  <button type="submit" className="btn-green">
                    Save
                  </button>
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={() => setShowEditModal(false)}
                  >
                    Cancel
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
                        <th>Hướng Dẫn Sử Dụng</th>
                      </tr>
                    </thead>
                    <tbody>
                      {arvDetails.map((detail) => (
                        <tr key={detail.arvId}>
                          <td>{detail.arvId}</td>
                          <td>{detail.arvName}</td>
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
