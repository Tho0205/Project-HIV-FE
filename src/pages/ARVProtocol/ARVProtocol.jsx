import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./ARVProtocol.css";

const API_BASE = "https://localhost:7243/api/arvprotocols";

const PAGE_SIZE = 8;

export default function ARVProtocol() {
  const [protocols, setProtocols] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Fetch protocols
  useEffect(() => {
    fetchProtocols(page);
  }, [page]);

  async function fetchProtocols(page) {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}?page=${page}&pageSize=${PAGE_SIZE}`);
      const result = await res.json();
      setProtocols(result.items || []);
      setTotal(result.totalCount || 0);
    } catch (e) {
      setProtocols([]);
      setTotal(0);
    }
    setLoading(false);
  }

  // Handle open edit modal
  function openEditModal(protocol) {
    setEditData(protocol);
    setError("");
    setShowModal(true);
  }

  // Handle modal close
  function closeModal() {
    setShowModal(false);
    setEditData(null);
    setError("");
  }

  // Handle form submit
  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const protocolData = {
      name: editData.name,
      description: editData.description,
      status: editData.status
    };

    try {
      let response;
      if (editData.protocolId) {
        // Update existing protocol
        response = await fetch(`${API_BASE}/${editData.protocolId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(protocolData)
        });
      } else {
        // Create new protocol
        response = await fetch(API_BASE, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(protocolData)
        });
      }

      if (response.ok) {
        closeModal();
        fetchProtocols(page);
      } else {
        const result = await response.json();
        setError(result.message || "Operation failed");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    }
  }

  // Handle delete protocol
  async function handleDelete(id) {
    if (window.confirm("Are you sure you want to delete this protocol?")) {
      try {
        const response = await fetch(`${API_BASE}/${id}`, {
          method: "DELETE"
        });

        if (response.ok) {
          fetchProtocols(page);
        } else {
          const result = await response.json();
          setError(result.message || "Delete failed");
        }
      } catch (err) {
        setError("Something went wrong. Please try again.");
      }
    }
  }

  // Pagination render logic
  function renderPagination() {
    const totalPages = Math.ceil(total / PAGE_SIZE);
    if (totalPages <= 1) return null;
    const buttons = [];

    // First page
    buttons.push(
      <button
        key="first"
        disabled={page === 1}
        onClick={() => setPage(1)}
        style={{ fontWeight: 600 }}
      >
        First
      </button>
    );

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
      buttons.push(
        <button
          key={i}
          className={i === page ? "active" : ""}
          onClick={() => setPage(i)}
        >
          {i}
        </button>
      );
    }

    // Last page
    buttons.push(
      <button
        key="last"
        disabled={page === totalPages}
        onClick={() => setPage(totalPages)}
        style={{ fontWeight: 600 }}
      >
        Last
      </button>
    );

    return <div className="pagination">{buttons}</div>;
  }

  // Logout function
  function logout() {
    sessionStorage.clear();
    localStorage.clear();
    navigate("/login");
  }

  // Check role on mount
  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role !== "staff") {
      alert("You are not authorized");
      navigate("/login");
    }
  }, [navigate]);

  return (
    <div className="wrapper">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-top">
          <div className="logo">Logo HIV</div>
          <div className="welcome">Welcome Staff</div>
          <ul className="nav">
            <li>
              <span className="icon">📅</span>
              <span>Appointment Management</span>
            </li>
            <li>
              <span className="icon">👤</span>
              <Link to="/Staff-ManagerPatient">
                <span>Customer Management</span>
              </Link>
            </li>
            <li>
              <span className="icon">📋</span>
              <span>Consultation Management</span>
            </li>
            <li>
              <span className="icon">🧪</span>
              <span>Test Result Management</span>
            </li>
            <li>
              <span className="icon">💊</span>
              <Link to="/arv">
                <span>ARV Management</span>
              </Link>
            </li>
            <li className="active">
              <span className="icon">📝</span>
              <span>ARV Protocol Management</span>
            </li>
            <li>
              <span className="icon">🛠️</span>
              <span>Custom ARV Protocol</span>
            </li>
          </ul>
        </div>
        <div className="sidebar-bottom">
          <div className="help">❔ Help</div>
          <div className="logout">
            <button onClick={logout}>🚪 Logout</button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="content">
        <div className="header">
          <input type="text" placeholder="Search..." className="search" />
          <div className="user">
            <span className="notification">
              🔔<span className="dot"></span>
            </span>
            <img
              src="https://i.pravatar.cc/40?img=5"
              className="avatar"
              alt="avatar"
            />
          </div>
        </div>

        <h1 className="title">ARV Protocol Management</h1>

        <div className="action-bar">
          <button 
            className="btn-primary"
            onClick={() => {
              setEditData(null);
              setShowModal(true);
            }}
          >
            <i className="fas fa-plus mr-2"></i> Add Protocol
          </button>
        </div>

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
                  <td colSpan={5} className="text-center">
                    Loading...
                  </td>
                </tr>
              ) : protocols.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center">
                    No protocols found
                  </td>
                </tr>
              ) : (
                protocols.map((protocol) => (
                  <tr key={protocol.protocolId}>
                    <td>{protocol.protocolId}</td>
                    <td>{protocol.name}</td>
                    <td>{protocol.description || '-'}</td>
                    <td>
                      <span className={`status-badge ${
                        protocol.status === 'ACTIVE' ? 'status-active' :
                        protocol.status === 'DELETED' ? 'status-deleted' : 'status-inactive'
                      }`}>
                        {protocol.status}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="action-btn edit"
                        onClick={() => openEditModal(protocol)}
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button 
                        className="action-btn delete"
                        onClick={() => handleDelete(protocol.protocolId)}
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {renderPagination()}

        {/* Error message */}
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="modal active">
            <div className="modal-content">
              <div className="modal-header">
                <h3>{editData ? 'Edit Protocol' : 'Add Protocol'}</h3>
                <button className="modal-close-btn" onClick={closeModal}>
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <form onSubmit={handleSubmit} className="modal-form">
                {editData?.protocolId && (
                  <input type="hidden" value={editData.protocolId} />
                )}
                
                <div className="form-group">
                  <label>Name</label>
                  <input
                    type="text"
                    value={editData?.name || ''}
                    onChange={(e) => setEditData({...editData, name: e.target.value})}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={editData?.description || ''}
                    onChange={(e) => setEditData({...editData, description: e.target.value})}
                    rows="3"
                  />
                </div>
                
                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={editData?.status || 'ACTIVE'}
                    onChange={(e) => setEditData({...editData, status: e.target.value})}
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="DELETED">Deleted</option>
                  </select>
                </div>
                
                <div className="form-actions">
                  <button type="button" className="btn-secondary" onClick={closeModal}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Save
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