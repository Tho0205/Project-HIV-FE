import React, { useEffect, useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./ManagerPatient.css";
import { toast } from "react-toastify";
import Sidebar from "../../components/Sidebar/Sidebar";
import Pagination from "../../components/Pagination/Pagination";
import { tokenManager } from "../../services/account";
import { apiRequest } from "../../services/account";
import { FaEdit } from "react-icons/fa";

const API_BASE = "https://localhost:7243";

const PAGE_SIZE = 8;

const defaultAvatar = "/assets/image/patient/patient.png";

const genderOptions = ["Male", "Female", "Other"];
const statusOptions = ["Active", "Inactive", "Deleted"];
const statusLabels = {
  Active: "Hoạt Động",
  Inactive: "Không Hoạt Động",
  Deleted: "Đã Xóa",
};

export default function ManagerPatient() {
  // State
  const [patients, setPatients] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState("name_asc");
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [error, setError] = useState("");
  const [previewAvatar, setPreviewAvatar] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [loading, setLoading] = useState(false);

  // Ref for file input
  const fileInputRef = useRef();

  // Fetch patients
  useEffect(() => {
    fetchPatients(page, sort);
    // eslint-disable-next-line
  }, [page, sort]);

  async function fetchPatients(page, sort) {
    setLoading(true);
    let url = `${API_BASE}/api/Staff/Patient?page=${page}&pageSize=${PAGE_SIZE}`;
    if (sort) {
      let [sortBy, order] = sort.split("_");
      if (sortBy === "name") sortBy = "full_name";
      if (sortBy === "created") sortBy = "created_at";
      url += `&sortBy=${sortBy}&order=${order}`;
    }
    try {
      const res = await apiRequest(url);
      const result = await res.json();
      setPatients(result.data || []);
      setTotal(result.total || 0);
    } catch (e) {
      setPatients([]);
      setTotal(0);
    }
    setLoading(false);
  }

  // Handle sort change
  function handleSortChange(e) {
    setSort(e.target.value);
    setPage(1);
  }

  // Handle open edit modal
  function openEditModal(patient) {
    setEditData({
      ...patient,
      dob: patient.birthdate ? patient.birthdate.slice(0, 10) : "",
      avatarUrl: patient.userAvatar
        ? `${API_BASE}/api/Account/avatar/${patient.userAvatar}`
        : defaultAvatar,
    });
    setPreviewAvatar(
      patient.userAvatar
        ? `${API_BASE}/api/Account/avatar/${patient.userAvatar}`
        : defaultAvatar
    );
    setAvatarFile(null);
    setError("");
    setShowModal(true);
  }

  // Handle modal close
  function closeModal() {
    setShowModal(false);
    setEditData(null);
    setError("");
    setPreviewAvatar("");
    setAvatarFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  // Handle edit form submit
  async function handleEditSubmit(e) {
    e.preventDefault();
    setError("");
    // Không xử lý upload avatar nữa
    // let avatarPath = editData.userAvatar || "";

    // Prepare data
    const data = {
      email: editData.email,
      full_name: editData.full_name,
      gender: editData.gender,
      phone: editData.phone,
      birthdate: editData.dob,
      role: "Patient",
      address: editData.address,
      status: editData.status,
    };

    try {
      const res = await apiRequest(
        `${API_BASE}/api/Staff/Staff-Update/${editData.accountId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      );
      if (res.status === 204) {
        closeModal();
        toast.success("Cập Nhật Thành Công", { autoClose: 1000 });
        fetchPatients(page, sort);
      } else {
        const result = await res.json();
        if (result.errors) {
          setError(
            Object.entries(result.errors)
              .map(
                ([field, errorArr]) =>
                  `${capitalize(field)}: ${errorArr.join(", ")}`
              )
              .join("\n")
          );
        } else {
          setError(result.title || "Cập Nhật Thất Bại");
        }
      }
    } catch (err) {
      setError("Có Một Số Lỗi, Vui Lòng Thử Lại!!");
    }
  }
  const navigate = useNavigate();

  // Capitalize helper
  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  // Format date
  function formatDate(dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return d.toLocaleDateString("vi-VN");
  }

  // Ktra Staff
  useEffect(() => {
    const role = tokenManager.getCurrentUserRole();
    if (role !== "Staff" && role !== "Manager") {
      toast.error("Bạn không có quyền truy cập trang này", { autoClose: 1000 });
      navigate("/");
    }
  }, []);

  return (
    <div className="wrapper">
      {/* Sidebar */}
      <Sidebar active="patient" />
      {/* Main Content */}
      <main className="content-patient">
        {/* <div className="header">
          <input type="text" placeholder="Tìm Kiếm..." className="search" />
          <div className="user">
            <span className="notification">
              <span className="dot"></span>
            </span>
            <img
              src="https://i.pravatar.cc/40?img=5"
              className="avatar"
              alt="avatar"
            />
          </div>
        </div> */}

        <h1 className="title-manager-patient">Quản Lí Thông Tin Khách Hàng</h1>

        <div className="sort-bar">
          <label>Xắp Xếp:</label>
          <select value={sort} onChange={handleSortChange}>
            <option value="name_asc">Theo Tên: A - Z</option>
            <option value="name_desc">Theo Tên: Z - A</option>
            <option value="created_asc">Theo Ngày Tạo: Increase</option>
            <option value="created_desc">Theo Ngày Tạo: Decrease</option>
          </select>
        </div>

        <table>
          <thead>
            <tr>
              <th>STT</th>
              <th>Ảnh Đại Diện</th>
              <th>Họ Và Tên</th>
              <th>Email</th>
              <th>Số Điện Thoại</th>
              <th>Ngày Sinh</th>
              <th>Địa Chỉ</th>
              <th>Giới Tính</th>
              <th>Ngày Tạo</th>
              <th>Trạng Thái</th>
              <th>Hành Động</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={11} style={{ textAlign: "center" }}>
                  Đang tải...
                </td>
              </tr>
            ) : patients.length === 0 ? (
              <tr>
                <td colSpan={11} style={{ textAlign: "center" }}>
                  Không có dữ liệu
                </td>
              </tr>
            ) : (
              patients.map((p, idx) => (
                <tr key={p.accountId}>
                  <td className="stt">{(page - 1) * PAGE_SIZE + idx + 1}</td>
                  <td className="Avatar">
                    <img
                      src={
                        p.userAvatar
                          ? `${API_BASE}/api/Account/avatar/${p.userAvatar}`
                          : defaultAvatar
                      }
                      className="avatar-sm"
                      alt="avatar"
                    />
                  </td>
                  <td className="fullname">{p.full_name}</td>
                  <td className="email">{p.email}</td>
                  <td className="phone">{p.phone}</td>
                  <td className="birthdate">{formatDate(p.birthdate)}</td>
                  <td className="address">{p.address}</td>
                  <td className="gender">{p.gender}</td>
                  <td className="created">{formatDate(p.created_at)}</td>
                  <td
                    className={`status-manager-patient ${p.status.toLowerCase()}`}
                  >
                    {p.status === "Active"
                      ? "Hoạt Động"
                      : p.status === "Inactive"
                      ? "Không Hoạt Động"
                      : p.status === "Deleted"
                      ? "Đã Xóa"
                      : p.status}
                  </td>
                  <td className="actions">
                    <button
                      className="edit-btn"
                      onClick={() => openEditModal(p)}
                    >
                      <FaEdit />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        <Pagination
          page={page}
          total={total}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
        />

        {/* Edit Modal */}
        {showModal && (
          <div className="modal" style={{ display: "flex" }}>
            <div className="modal-content-manager">
              <h3 style={{ marginBottom: 30 }}>Edit Profile</h3>
              <h4 style={{ marginBottom: 30, color: "red" }}>{error}</h4>
              <form id="modalForm" onSubmit={handleEditSubmit}>
                <div className="avatar-group">
                  <label>Ảnh Đại Diện</label>
                  <img
                    id="previewAvatar"
                    src={previewAvatar || defaultAvatar}
                    alt="Preview"
                    style={{
                      display: "block",
                      width: 80,
                      height: 80,
                      borderRadius: "50%",
                    }}
                  />
                </div>

                <label>Tên</label>
                <input
                  type="text"
                  name="name"
                  value={editData.full_name}
                  onChange={(e) =>
                    setEditData({ ...editData, full_name: e.target.value })
                  }
                  required
                />

                <label>Ngày Sinh</label>
                <input
                  type="date"
                  name="dob"
                  value={editData.dob}
                  onChange={(e) =>
                    setEditData({ ...editData, dob: e.target.value })
                  }
                  required
                />

                <label>Số Điện Thoại</label>
                <input
                  type="text"
                  name="phone"
                  value={editData.phone}
                  onChange={(e) =>
                    setEditData({ ...editData, phone: e.target.value })
                  }
                  required
                />

                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={editData.email}
                  onChange={(e) =>
                    setEditData({ ...editData, email: e.target.value })
                  } // Thêm dòng này
                  required
                />

                <label>Giới Tính</label>
                <select
                  name="gender"
                  value={editData.gender}
                  onChange={(e) =>
                    setEditData({ ...editData, gender: e.target.value })
                  }
                >
                  {genderOptions.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>

                <label>Địa Chỉ</label>
                <input
                  type="text"
                  name="address"
                  value={editData.address}
                  onChange={(e) =>
                    setEditData({ ...editData, address: e.target.value })
                  }
                  required
                />

                <label>Giới Tính</label>
                <input type="text" name="role" value="Patient" readOnly />

                <label>Trạng Thái</label>
                <select
                  name="status-manager-patient"
                  value={editData.status}
                  onChange={(e) =>
                    setEditData({ ...editData, status: e.target.value })
                  }
                >
                  {statusOptions.map((s) => (
                    <option key={s} value={s}>
                      {statusLabels[s] || s}
                    </option>
                  ))}
                </select>

                <div className="modal-actions">
                  <button type="submit" className="btn-green">
                    Chỉnh Sửa
                  </button>
                  <button
                    type="button"
                    id="cancelModal"
                    className="btn-cancel"
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
