import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import ARVProtocolService from "../../services/ARVProtocolService";
import "./ARVProtocol.css";

export default function ARVProtocol() {
  const [protocols, setProtocols] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  // Load data
  useEffect(() => {
    fetchProtocols();
  }, []);

  async function fetchProtocols() {
    setLoading(true);
    try {
      const data = await ARVProtocolService.getProtocols();
      setProtocols(data || []);
    } catch (error) {
      console.error("Failed to fetch protocols:", error);
      setError("Failed to load protocols");
      setProtocols([]);
    } finally {
      setLoading(false);
    }
  }

  // Filter protocols based on search term
  const filteredProtocols = protocols.filter(protocol => 
    protocol.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    protocol.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  function openEditModal(protocol) {
    setEditData(protocol);
    setShowModal(true);
    setError("");
  }

  function closeModal() {
    setShowModal(false);
    setEditData(null);
    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    try {
      const protocolData = {
        name: editData.name,
        description: editData.description,
        status: editData.status || "ACTIVE"
      };

      if (editData?.protocolId) {
        await ARVProtocolService.updateProtocol(editData.protocolId, protocolData);
      } else {
        await ARVProtocolService.createProtocol(protocolData);
      }
      
      closeModal();
      await fetchProtocols();
    } catch (error) {
      console.error("Operation failed:", error);
      setError(error.message || "Operation failed. Please try again.");
    }
  }

  async function handleDelete(id) {
    if (window.confirm("Are you sure to delete this protocol?")) {
      try {
        await ARVProtocolService.deleteProtocol(id);
        await fetchProtocols();
      } catch (error) {
        console.error("Delete failed:", error);
        setError(error.message || "Failed to delete protocol");
      }
    }
  }

  // Authorization check
  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role !== "staff") {
      alert("You are not authorized");
      navigate("/login");
    }
  }, [navigate]);

  function handleLogout() {
    localStorage.clear();
    sessionStorage.clear();
    navigate("/login");
  }

  return (
    <div className="wrapper">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-top">
          <div className="logo">HIV Clinic</div>
          <div className="welcome">Welcome Staff</div>
          <ul className="nav">
            <li>
              <span className="icon">📅</span>
              <span>Appointments</span>
            </li>
            <li>
              <span className="icon">👤</span>
              <Link to="/Staff-ManagerPatient">
                <span>Patients</span>
              </Link>
            </li>
            <li>
              <span className="icon">📋</span>
              <span>Consultations</span>
            </li>
            <li>
              <span className="icon">🧪</span>
              <span>Test Results</span>
            </li>
            <li>
              <span className="icon">💊</span>
              <Link to="/arv">
                <span>ARV Management</span>
              </Link>
            </li>
            <li className="active">
              <span className="icon">📝</span>
              <span>Protocol Management</span>
            </li>
            <li>
              <span className="icon">🛠️</span>
              <span>Custom Protocols</span>
            </li>
          </ul>
        </div>
        <div className="sidebar-bottom">
          <div className="help">❔ Help</div>
          <div className="logout">
            <button onClick={handleLogout}>🚪 Logout</button>
          </div>
        </div>
      </aside>

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
          <button 
            className="btn-primary" 
            onClick={() => {
              setEditData({ 
                name: "", 
                description: "", 
                status: "ACTIVE" 
              });
              setShowModal(true);
            }}
          >
            ➕ Add Protocol
          </button>
        </div>

        {error && (
          <div className="error-message">
            ⚠️ {error}
          </div>
        )}

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
                  <td colSpan={5} className="loading-text">
                    Loading protocols...
                  </td>
                </tr>
              ) : filteredProtocols.length === 0 ? (
                <tr>
                  <td colSpan={5} className="no-data">
                    {protocols.length === 0 ? "No protocols available" : "No matching protocols found"}
                  </td>
                </tr>
              ) : (
                filteredProtocols.map((p) => (
                  <tr key={p.protocolId}>
                    <td>{p.protocolId}</td>
                    <td>{p.name}</td>
                    <td>{p.description || "-"}</td>
                    <td>
                      <span className={`status-badge ${
                        p.status === "ACTIVE" ? "status-active"
                        : p.status === "DELETED" ? "status-deleted"
                        : "status-inactive"
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="actions">
                      <button 
                        className="action-btn edit"
                        onClick={() => openEditModal(p)}
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        className="action-btn delete"
                        onClick={() => handleDelete(p.protocolId)}
                        title="Delete"
                        disabled={p.status === "DELETED"}
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Edit/Create Modal */}
{showModal && (
  <div className="modal-overlay">
    <div className="modal-container">
      <div className="modal-header">
        <h3>{editData?.protocolId ? "Edit Protocol" : "Add Protocol"}</h3>
        <button 
          className="close-button" 
          onClick={closeModal}
          aria-label="Close modal"
        >
          &times;
        </button>
      </div>

      <form onSubmit={handleSubmit} className="modal-form">
        <div className="form-group">
          <label>Name *</label>
          <input
            type="text"
            value={editData?.name || ""}
            onChange={(e) => setEditData({ ...editData, name: e.target.value })}
            required
            placeholder="Protocol name"
          />
        </div>
        
        <div className="form-group">
          <label>Description</label>
          <textarea
            value={editData?.description || ""}
            onChange={(e) => setEditData({ ...editData, description: e.target.value })}
            placeholder="Optional description"
            rows={3}
          />
        </div>
        
        <div className="form-group">
          <label>Status</label>
          <select
            value={editData?.status || "ACTIVE"}
            onChange={(e) => setEditData({ ...editData, status: e.target.value })}
          >
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="DELETED">Deleted</option>
          </select>
        </div>
        
        <div className="form-actions">
          <button type="submit" className="btn-primary">
            {editData?.protocolId ? "Save Changes" : "Add Protocol"}
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={closeModal}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  </div>
)}
      </main>
    </div>
  );
}