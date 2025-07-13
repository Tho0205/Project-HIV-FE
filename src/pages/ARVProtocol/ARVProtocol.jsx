import React, { useState, useEffect } from "react";
import { tokenManager } from "../../services/account";
import { useNavigate } from "react-router-dom";
import ARVProtocolService from "../../services/ARVProtocolService";
import ARVService from "../../services/ARVService";
import Sidebar from "../../components/Sidebar/Sidebar";
import Pagination from "../../components/Pagination/Pagination";
import "./ARVProtocol.css";
import { toast } from "react-toastify";
import { FaEdit, FaTrashAlt, FaEye, FaPlus } from "react-icons/fa";
import { MdClose } from "react-icons/md";

const PAGE_SIZE = 9;

export default function ARVProtocol() {
  const [protocols, setProtocols] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination state
  const [page, setPage] = useState(1);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showARVModal, setShowARVModal] = useState(false);

  // Data states
  const [newProtocol, setNewProtocol] = useState({
    name: "",
    description: "",
    status: "ACTIVE",
    details: [],
  });
  const [editData, setEditData] = useState(null);
  const [arvDetails, setArvDetails] = useState([]);
  const [selectedProtocol, setSelectedProtocol] = useState(null);
  const [availableARVs, setAvailableARVs] = useState([]);

  const navigate = useNavigate();

  // Fetch all protocols
  const fetchProtocols = async () => {
    try {
      setLoading(true);
      const data = await ARVProtocolService.getAllProtocols();
      setProtocols(data);
    } catch (err) {
      setError(err.message || "Failed to load protocols");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProtocols();

    if (tokenManager.getCurrentUserRole() !== "Staff") {
      toast.error("Bạn không được phép truy cập");
      navigate("/login");
    }
  }, [navigate]);

  // View ARV details
  const handleShowARVDetails = async (protocol) => {
    setSelectedProtocol(protocol);
    try {
      setLoading(true);
      setError("");

      const details = await ARVProtocolService.getProtocolDetails(
        protocol.protocolId
      );
      setArvDetails(details);
      setShowARVModal(true);
    } catch (err) {
      setError("Lỗi khi lấy ARV");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Create new protocol
  const handleCreate = () => {
    setNewProtocol({
      name: "",
      description: "",
      status: "ACTIVE",
      details: [],
    });
    setShowCreateModal(true);
    loadARVs();
  };

  // Edit protocol
  const handleUpdate = async (protocol) => {
    try {
      setLoading(true);
      setError("");

      const protocolData = await ARVProtocolService.getProtocolById(
        protocol.protocolId
      );

      if (!protocolData) {
        throw new Error("Protocol not found");
      }

      setEditData({
        ...protocolData,
        details: protocolData.details || [],
      });

      setShowEditModal(true);
      await loadARVs();
    } catch (err) {
      setError(err.message || "Failed to load protocol details");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Delete protocol
  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa protocol này?")) {
      try {
        await ARVProtocolService.deleteProtocol(id);
        await fetchProtocols();
        toast.success("Protocol deleted successfully!");
      } catch (err) {
        setError("Lỗi khi xóa protocol");
        console.error(err);
      }
    }
  };

  // Load available ARVs
  const loadARVs = async () => {
    try {
      const response = await ARVService.getAllARVs();
      setAvailableARVs(response || []);
    } catch (err) {
      console.error("Failed to load ARVs", err);
      setError("Failed to load ARV list");
    }
  };

  // Create protocol with details
  const handleCreateWithDetails = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError("");

      await ARVProtocolService.createProtocolWithDetails(newProtocol);
      setShowCreateModal(false);
      await fetchProtocols();
      toast.success("Thêm Protocol Thành Công");
    } catch (err) {
      setError(err.message || "Failed to create protocol");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Update protocol
  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError("");

      // 1. Prepare protocol data without details
      const protocolPayload = {
        name: editData.name,
        description: editData.description,
        status: editData.status,
      };

      // 2. Update protocol info
      const updatedProtocol = await ARVProtocolService.updateProtocol(
        editData.protocolId,
        protocolPayload
      );

      // 3. Update ARV details

      const detailUpdates = editData.details.map((detail) => {
        if (detail.detailId) {
          // Existing detail - update
          return ARVProtocolService.updateProtocolDetail(
            editData.protocolId,
            detail.detailId,
            {
              detailId: detail.detailId,
              arvId: detail.arvId,
              dosage: detail.dosage,
              usageInstruction: detail.usageInstruction,
              status: detail.status,
            }
          );
        } else {
          // New detail - add
          return ARVProtocolService.addARVToProtocol(editData.protocolId, {
            arvId: detail.arvId,
            dosage: detail.dosage,
            usageInstruction: detail.usageInstruction,
            status: detail.status,
          });
        }
      });

      await Promise.all(detailUpdates);

      // 4. Update UI
      setProtocols((prev) =>
        prev.map((p) =>
          p.protocolId === editData.protocolId ? updatedProtocol : p
        )
      );
      setShowEditModal(false);
      alert("Protocol updated successfully!");
    } catch (err) {
      setError(err.message || "Failed to update protocol");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  // Add ARV to create form
  const handleAddARVDetail = () => {
    setNewProtocol((prev) => ({
      ...prev,
      details: [
        ...prev.details,
        { arvId: "", dosage: "", usageInstruction: "", status: "ACTIVE" },
      ],
    }));
  };

  // Remove ARV from create form
  const handleRemoveARVDetail = (index) => {
    setNewProtocol((prev) => ({
      ...prev,
      details: prev.details.filter((_, i) => i !== index),
    }));
  };

  // Update ARV detail in create form
  const handleARVDetailChange = (index, field, value) => {
    setNewProtocol((prev) => {
      const newDetails = [...prev.details];
      newDetails[index] = { ...newDetails[index], [field]: value };
      return { ...prev, details: newDetails };
    });
  };

  // Add ARV to edit form
  const handleAddEditARVDetail = () => {
    setEditData((prev) => ({
      ...prev,
      details: [
        ...prev.details,
        { arvId: "", dosage: "", usageInstruction: "", status: "ACTIVE" },
      ],
    }));
  };

  // Filter protocols
  const filteredProtocols = protocols.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.description &&
        p.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Calculate pagination
  const startIndex = (page - 1) * PAGE_SIZE;
  const endIndex = startIndex + PAGE_SIZE;
  const pagedProtocols = filteredProtocols.slice(startIndex, endIndex);

  return (
    <div className="wrapper">
      <Sidebar active="arv-protocol" />
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

        <h1 className="title-arv-protocol">Quản Lí ARV Protocol</h1>

        <div className="action-bar">
          {/* Nút thêm mới protocol */}
          <button className="btn-add-protocol" onClick={handleCreate}>
            <FaPlus style={{ marginRight: 6 }} /> Thêm Mới Protocol
          </button>
        </div>

        {error && <div className="error-message">⚠️ {error}</div>}

        <div className="table-container">
          <table className="arv-protocol-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Họ Và Tên</th>
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
              ) : pagedProtocols.length === 0 ? (
                <tr>
                  <td colSpan={5}>Không Tìm Thấy protocols</td>
                </tr>
              ) : (
                pagedProtocols.map((p) => (
                  <tr key={p.protocolId}>
                    <td>{p.protocolId}</td>
                    <td>{p.name}</td>
                    <td>{p.description || "-"}</td>
                    <td>
                      <span
                        className={`status-badge-arv-protocol ${p.status.toLowerCase()}`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="actions-arv-protocol">
                      <button
                        onClick={() => handleUpdate(p)}
                        className="btn-edit-arv-protocol"
                      >
                        <FaEdit style={{ marginRight: 6 }} /> Sửa
                      </button>
                      <button
                        onClick={() => handleDelete(p.protocolId)}
                        disabled={p.status === "DELETED"}
                        className="btn-delete-arv-protocol"
                      >
                        <FaTrashAlt style={{ marginRight: 6 }} /> Xóa
                      </button>
                      <button
                        onClick={() => handleShowARVDetails(p)}
                        className="btn-detail-arv-protocol"
                      >
                        <FaEye style={{ marginRight: 6 }} /> Xem
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredProtocols.length > PAGE_SIZE && (
          <Pagination
            page={page}
            total={filteredProtocols.length}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        )}

        {/* Create Protocol Modal */}
        {showCreateModal && (
          <div className="modal-overlay">
            <div className="modal-container">
              <div className="modal-header">
                <h3>Thêm Mới Protocol</h3>
                {/* Nút đóng modal (thay &times; bằng icon) */}
                <button
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    padding: "2px 5px",
                    fontWeight: "bold",
                    border: "none",
                    cursor: "pointer",
                    color: "red",
                    background: "none",
                    fontSize: "30px",
                    position: "relative",
                    bottom: "30px",
                    left: "30px",
                  }}
                >
                  <MdClose />
                </button>
              </div>
              <div className="modal-body">
                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleCreateWithDetails}>
                  <div className="form-group">
                    <label>Tên Protocol*</label>
                    <input
                      type="text"
                      value={newProtocol.name}
                      onChange={(e) =>
                        setNewProtocol({ ...newProtocol, name: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Mô Tả</label>
                    <textarea
                      value={newProtocol.description}
                      onChange={(e) =>
                        setNewProtocol({
                          ...newProtocol,
                          description: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>Trạng Thái</label>
                    <select
                      value={newProtocol.status}
                      onChange={(e) =>
                        setNewProtocol({
                          ...newProtocol,
                          status: e.target.value,
                        })
                      }
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <div className="detail-header">
                      <label>Thuốc ARV*</label>
                      {/* Nút thêm ARV trong modal */}
                      <button
                        type="button"
                        className="btn-add-arv"
                        onClick={handleAddARVDetail}
                      >
                        <FaPlus style={{ marginRight: 6 }} /> Thêm ARV
                      </button>
                    </div>

                    {newProtocol.details.map((detail, index) => (
                      <div key={index} className="arv-detail-item">
                        <div className="arv-detail-row">
                          <select
                            value={detail.arvId}
                            onChange={(e) =>
                              handleARVDetailChange(
                                index,
                                "arvId",
                                e.target.value
                              )
                            }
                            required
                          >
                            <option value="">Chọn ARV</option>
                            {availableARVs.map((arv) => (
                              <option key={arv.arvId} value={arv.arvId}>
                                {arv.name}
                              </option>
                            ))}
                          </select>

                          <input
                            type="text"
                            placeholder="Dosage*"
                            value={detail.dosage}
                            onChange={(e) =>
                              handleARVDetailChange(
                                index,
                                "dosage",
                                e.target.value
                              )
                            }
                            required
                          />

                          <input
                            type="text"
                            placeholder="Usage Instructions"
                            value={detail.usageInstruction}
                            onChange={(e) =>
                              handleARVDetailChange(
                                index,
                                "usageInstruction",
                                e.target.value
                              )
                            }
                          />
                        </div>

                        <div className="arv-detail-actions">
                          {/* Nút xóa ARV trong modal */}
                          <button
                            type="button"
                            className="btn-remove-arv"
                            onClick={() => handleRemoveARVDetail(index)}
                          >
                            <FaTrashAlt style={{ marginRight: 6 }} /> Xóa
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="modal-actions">
                    <button
                      type="submit"
                      className="btn-green-add"
                      disabled={loading}
                    >
                      {loading ? "Đang Xử Lí..." : "Lưu"}
                    </button>
                    <button
                      type="button"
                      className="btn-cancel-add"
                      onClick={() => setShowCreateModal(false)}
                      disabled={loading}
                    >
                      Thoát
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Edit Protocol Modal */}
        {showEditModal && editData && (
          <div className="modal-overlay">
            <div className="modal-container">
              <div className="modal-header">
                <h3>Chỉnh Sửa Protocol</h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  style={{
                    padding: "2px 5px",
                    fontWeight: "bold",
                    border: "none",
                    cursor: "pointer",
                    color: "red",
                    background: "none",
                    fontSize: "30px",
                    position: "relative",
                    bottom: "30px",
                    left: "30px",
                  }}
                >
                  <MdClose />
                </button>
              </div>
              <div className="modal-body">
                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleSubmitEdit}>
                  <div className="form-group">
                    <label>Tên Protocol*</label>
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
                    <label>Mô Tả</label>
                    <textarea
                      value={editData.description}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          description: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>Trạng Thái</label>
                    <select
                      value={editData.status}
                      onChange={(e) =>
                        setEditData({ ...editData, status: e.target.value })
                      }
                    >
                      <option value="ACTIVE">Hoạt Động</option>
                      <option value="INACTIVE">Không Hoạt Động</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <div className="detail-header">
                      <label>Thuốc ARV*</label>
                      <button
                        type="button"
                        className="btn-add-arv"
                        onClick={handleAddEditARVDetail}
                      >
                        <FaPlus style={{ marginRight: 6 }} /> Thêm ARV
                      </button>
                    </div>

                    {editData.details.map((detail, index) => (
                      <div key={index} className="arv-detail-item">
                        <div className="arv-detail-row">
                          <select
                            value={detail.arvId}
                            onChange={(e) => {
                              const newDetails = [...editData.details];
                              newDetails[index] = {
                                ...newDetails[index],
                                arvId: e.target.value,
                              };
                              setEditData({ ...editData, details: newDetails });
                            }}
                            required
                          >
                            <option value="">Chọn ARV</option>
                            {availableARVs.map((arv) => (
                              <option key={arv.arvId} value={arv.arvId}>
                                {arv.name}
                              </option>
                            ))}
                          </select>

                          <input
                            type="text"
                            placeholder="Dosage*"
                            value={detail.dosage}
                            onChange={(e) => {
                              const newDetails = [...editData.details];
                              newDetails[index] = {
                                ...newDetails[index],
                                dosage: e.target.value,
                              };
                              setEditData({ ...editData, details: newDetails });
                            }}
                            required
                          />

                          <input
                            type="text"
                            placeholder="Usage Instructions"
                            value={detail.usageInstruction}
                            onChange={(e) => {
                              const newDetails = [...editData.details];
                              newDetails[index] = {
                                ...newDetails[index],
                                usageInstruction: e.target.value,
                              };
                              setEditData({ ...editData, details: newDetails });
                            }}
                          />
                        </div>

                        <div className="arv-detail-actions">
                          <button
                            type="button"
                            className="btn-remove-arv"
                            onClick={() =>
                              setEditData({
                                ...editData,
                                details: editData.details.filter(
                                  (_, i) => i !== index
                                ),
                              })
                            }
                          >
                            <FaTrashAlt style={{ marginRight: 6 }} /> Xóa
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="modal-actions">
                    <button
                      type="submit"
                      className="btn-green-add"
                      disabled={loading}
                    >
                      {loading ? "Processing..." : "Lưu"}
                    </button>
                    <button
                      type="button"
                      className="btn-cancel-add"
                      onClick={() => setShowEditModal(false)}
                      disabled={loading}
                    >
                      Thoát
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* View ARV Details Modal */}
        {showARVModal && (
          <div className="modal-overlay">
            <div className="modal-container">
              <div className="modal-header">
                <h3>Mô Tả ARV: {selectedProtocol?.name}</h3>
                <button
                  className="close-btn-1"
                  onClick={() => setShowARVModal(false)}
                >
                  &times;
                </button>
              </div>
              <div className="modal-body">
                {arvDetails.length > 0 ? (
                  <table className="arv-details-table">
                    <thead>
                      <tr>
                        <th>ARV ID</th>
                        <th>ARV Tên</th>
                        <th>Liều Lượng</th>
                        <th>Hướng dẫn sử dụng</th>
                      </tr>
                    </thead>
                    <tbody>
                      {arvDetails.map((detail) => (
                        <tr key={detail.detailId}>
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
                <button
                  className="close-view-protocol"
                  onClick={() => setShowARVModal(false)}
                >
                  Thoát
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
