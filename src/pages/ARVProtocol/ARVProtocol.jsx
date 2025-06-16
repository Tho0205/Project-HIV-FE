import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import ARVProtocolService from "../../services/ARVProtocolService";
import Sidebar from "../../components/Sidebar/Sidebar";
import "./ARVProtocol.css";

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
    if (localStorage.getItem("role") !== "Staff") {
      alert("You are not authorized");
      navigate("/login");
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
      setError("Failed to load ARV details");
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
            placeholder="Search protocols..."
            className="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <h1 className="title">ARV Protocol Management</h1>

        <div className="action-bar">
          <button className="btn-primary" onClick={handleCreate}>
            ➕ Add Protocol
          </button>
        </div>

        {error && <div className="error-message">⚠️ {error}</div>}

        <div className="table-container">
          <table className="protocol-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Description</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5}>Loading...</td>
                </tr>
              ) : filteredProtocols.length === 0 ? (
                <tr>
                  <td colSpan={5}>No protocols found</td>
                </tr>
              ) : (
                filteredProtocols.map((p) => (
                  <tr key={p.protocolId}>
                    <td>{p.protocolId}</td>
                    <td>{p.name}</td>
                    <td>{p.description || "-"}</td>
                    <td>
                      <span
                        className={`status-badge ${p.status.toLowerCase()}`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="actions">
                      <button onClick={() => handleUpdate(p)} title="Edit">
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(p.protocolId)}
                        title="Delete"
                        disabled={p.status === "DELETED"}
                      >
                        🗑️
                      </button>
                      <button
                        onClick={() => handleShowARVDetails(p)}
                        title="View ARV Details"
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
          <div className="modal-overlay">
            <div className="modal-container">
              <div className="modal-header">
                <h3>
                  {editData.protocolId ? "Edit Protocol" : "Add Protocol"}
                </h3>
                <button onClick={() => setShowEditModal(false)}>&times;</button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Name *</label>
                  <input
                    type="text"
                    value={editData.name}
                    onChange={(e) =>
                      setEditData({ ...editData, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={editData.description}
                    onChange={(e) =>
                      setEditData({ ...editData, description: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Status</label>
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
                </div>
                <div className="form-actions">
                  <button type="submit">Save</button>
                  <button type="button" onClick={() => setShowEditModal(false)}>
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
                <h3>ARV Details: {selectedProtocol.name}</h3>
                <button onClick={() => setShowARVModal(false)}>&times;</button>
              </div>
              <div className="modal-body">
                {arvDetails.length > 0 ? (
                  <table className="arv-details-table">
                    <thead>
                      <tr>
                        <th>ARV ID</th>
                        <th>ARV Name</th>
                        <th>Usage Instruction</th>
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
