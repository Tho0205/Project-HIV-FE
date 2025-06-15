import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import ARVService from "../../services/ARVService";
import "./ARV.css";

export default function ARV() {
  const [arvs, setArvs] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  // Load data
  useEffect(() => {
    fetchArvs();
  }, []);

  async function fetchArvs() {
    setLoading(true);
    try {
      const data = await ARVService.getARVs();
      setArvs(data || []);
    } catch (error) {
      console.error("Failed to fetch ARVs:", error);
      setError("Failed to load ARV data");
      setArvs([]);
    } finally {
      setLoading(false);
    }
  }

  // Filter ARVs based on search term
  const filteredArvs = arvs.filter(arv => 
    arv.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    arv.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  function openEditModal(arv) {
    setEditData(arv);
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
      const arvData = {
        name: editData.name,
        description: editData.description,
        status: editData.status || "ACTIVE"
      };

      if (editData?.arvId) {
        await ARVService.updateARV(editData.arvId, arvData);
      } else {
        await ARVService.createARV(arvData);
      }
      
      closeModal();
      await fetchArvs();
    } catch (error) {
      console.error("Operation failed:", error);
      setError(error.message || "Operation failed. Please try again.");
    }
  }

  async function handleDelete(id) {
    if (window.confirm("Are you sure you want to delete this ARV?")) {
      try {
        await ARVService.deleteARV(id);
        await fetchArvs();
      } catch (error) {
        console.error("Delete failed:", error);
        setError(error.message || "Failed to delete ARV");
      }
    }
  }

  // Authorization check
  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role !== "staff") {
      alert("You are not authorized to access this page");
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
            <li className="active">
              <span className="icon">💊</span>
              <Link to="/arv">
                <span>ARV Management</span>
              </Link>
            </li>
            <li>
              <span className="icon">📝</span>
              <Link to="/arv-protocol">
                <span>Protocols</span>
              </Link>
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
            placeholder="Search ARVs..." 
            className="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <h1 className="title">ARV Management</h1>

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
            ➕ Add New ARV
          </button>      
        </div>
        {error && (
          <div className="error-message">
            ⚠️ {error}
          </div>
        )}

        <div className="table-container">
          <table className="arv-table">
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
                    Loading ARV data...
                  </td>
                </tr>
              ) : filteredArvs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="no-data">
                    {arvs.length === 0 ? "No ARVs available" : "No matching ARVs found"}
                  </td>
                </tr>
              ) : (
                filteredArvs.map((arv) => (
                  <tr key={arv.arvId}>
                    <td>{arv.arvId}</td>
                    <td>{arv.name}</td>
                    <td>{arv.description || "-"}</td>
                    <td>
                      <span className={`status-badge ${
                        arv.status === "ACTIVE" ? "status-active"
                        : arv.status === "DELETED" ? "status-deleted"
                        : "status-inactive"
                      }`}>
                        {arv.status}
                      </span>
                    </td>
                    <td className="actions">
                      <button 
                        className="action-btn edit"
                        onClick={() => openEditModal(arv)}
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        className="action-btn delete"
                        onClick={() => handleDelete(arv.arvId)}
                        title="Delete"
                        disabled={arv.status === "DELETED"}
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

        {showModal && (
          <div className="modal-overlay">
            <div className="modal-container">
              <div className="modal-header">
                <h2>{editData?.arvId ? "Edit ARV" : "Add New ARV"}</h2>
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
                  <label htmlFor="arv-name">Name *</label>
                  <input
                    id="arv-name"
                    type="text"
                    value={editData?.name || ""}
                    onChange={(e) => 
                      setEditData({ ...editData, name: e.target.value })
                    }
                    required
                    placeholder="Enter ARV name"
                    className="form-input"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="arv-desc">Description</label>
                  <textarea
                    id="arv-desc"
                    value={editData?.description || ""}
                    onChange={(e) =>
                      setEditData({ ...editData, description: e.target.value })
                    }
                    placeholder="Enter description (optional)"
                    rows={3}
                    className="form-textarea"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="arv-status">Status</label>
                  <select
                    id="arv-status"
                    value={editData?.status || "ACTIVE"}
                    onChange={(e) =>
                      setEditData({ ...editData, status: e.target.value })
                    }
                    className="form-select"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="DELETED">Deleted</option>
                  </select>
                </div>
                
                <div className="form-actions">
                  <button 
                    type="submit" 
                    className="btn-primary"
                  >
                    {editData?.arvId ? "Update" : "Create"} ARV
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