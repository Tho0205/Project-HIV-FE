import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import ARVService from "../../services/ARVService";
import Sidebar from "../../components/Sidebar/Sidebar";
import Pagination from "../../components/Pagination/Pagination";
import "./ARV.css";
import { tokenManager } from "../../services/account";
import { toast } from "react-toastify";
import { FaEdit, FaRegPlusSquare } from "react-icons/fa";

const PAGE_SIZE = 10;

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
  const filteredArvs = arvs.filter(
    (arv) =>
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
        status: editData.status || "ACTIVE",
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
    const role = tokenManager.getCurrentUserRole();
    if (role !== "Staff") {
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
    <div className="arvpage-wrapper">
      {/* Sidebar */}
      <Sidebar active="arv" />
      {/* Main Content */}
      <main className="arvpage-content">
        <div className="arvpage-header">
          <input
            type="text"
            placeholder="Tìm Kiếm ARVs..."
            className="arvpage-search-input" // Sửa lại
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <h1 className="arvpage-title">Quản Lí ARV</h1>

        <div className="arvpage-action-bar">
          <button
            className="arvpage-add-btn"
            onClick={() => {
              setEditData({
                name: "",
                description: "",
                status: "ACTIVE",
              });
              setShowModal(true);
            }}
          >
            <FaRegPlusSquare /> Thêm Mới ARV
          </button>
        </div>
        {error && <div className="error-message">⚠️ {error}</div>}

        <div className="arvpage-table-container">
          <table className="arvpage-table">
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
                  <td colSpan={5} className="arvpage-loading-text">
                    Đang Tải Dữ Liệu ARV...
                  </td>
                </tr>
              ) : filteredArvs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="arvpage-no-data">
                    {arvs.length === 0
                      ? "No ARVs available"
                      : "No matching ARVs found"}
                  </td>
                </tr>
              ) : (
                filteredArvs.map((arv) => (
                  <tr key={arv.arvId}>
                    <td>{arv.arvId}</td>
                    <td>{arv.name}</td>
                    <td>{arv.description || "-"}</td>
                    <td>
                      <span
                        className={`arvpage-status-badge ${
                          arv.status === "ACTIVE"
                            ? "arvpage-status-active"
                            : arv.status === "DELETED"
                            ? "arvpage-status-deleted"
                            : "arvpage-status-inactive"
                        }`}
                      >
                        {arv.status === "ACTIVE"
                          ? "Hoạt Động"
                          : arv.status === "INACTIVE"
                          ? "Không Hoạt Động"
                          : arv.status === "DELETED"
                          ? "Đã Xóa"
                          : arv.status}
                      </span>
                    </td>
                    <td className="arvpage-actions">
                      <button
                        className="arvpage-action-btn edit"
                        onClick={() => openEditModal(arv)}
                        title="Edit"
                      >
                        <FaEdit />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {showModal && (
          <div className="arvpage-modal">
            <div className="arvpage-modal-content">
              <div className="modal-header">
                <h2>{editData?.arvId ? "Cập Nhật ARV" : "Thêm Mới ARV"}</h2>
                <button
                  className="close-button"
                  onClick={closeModal}
                  aria-label="Close modal"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleSubmit} className="arvpage-form">
                <div className="form-group">
                  <label htmlFor="arv-name">Tên ARV *</label>
                  <input
                    id="arv-name"
                    type="text"
                    value={editData?.name || ""}
                    onChange={(e) =>
                      setEditData({ ...editData, name: e.target.value })
                    }
                    required
                    placeholder="Nhập Tên Của ARV"
                    className="arvpage-form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="arv-desc">Mô Tả</label>
                  <textarea
                    id="arv-desc"
                    value={editData?.description || ""}
                    onChange={(e) =>
                      setEditData({ ...editData, description: e.target.value })
                    }
                    placeholder="Nhập Phần Mô Tả (optional)"
                    rows={3}
                    className="arvpage-form-textarea"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="arv-status">Trạng Thái</label>
                  <select
                    id="arv-status"
                    value={editData?.status || "ACTIVE"}
                    onChange={(e) =>
                      setEditData({ ...editData, status: e.target.value })
                    }
                    className="arvpage-form-select"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="DELETED">Deleted</option>
                  </select>
                </div>

                <div className="arvpage-modal-actions">
                  <button type="submit" className="arvpage-btn-submit">
                    {editData?.arvId ? "Cập Nhật" : "Tạo"} ARV
                  </button>
                  <button
                    type="button"
                    className="arvpage-btn-cancel"
                    onClick={closeModal}
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
}
