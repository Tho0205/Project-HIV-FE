import React, { useEffect, useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./ManagerPatient.css";

const API_BASE = "https://localhost:7243";

const PAGE_SIZE = 8;

const defaultAvatar = "/assets/image/patient/patient.png";

const genderOptions = ["Male", "Female", "Other"];
const statusOptions = ["ACTIVE", "INACTIVE", "DELETED"];

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
      const res = await fetch(url);
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

  // Handle avatar file change
  function handleAvatarChange(e) {
    const file = e.target.files[0];
    setAvatarFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setPreviewAvatar(ev.target.result);
      reader.readAsDataURL(file);
    } else {
      setPreviewAvatar(editData?.avatarUrl || defaultAvatar);
    }
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
      // Không cập nhật user_avatar nữa
      status: editData.status,
    };

    try {
      const res = await fetch(
        `${API_BASE}/api/Staff/Staff-Update/${editData.accountId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      );
      if (res.status === 204) {
        closeModal();
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
          setError(result.title || "Update failed.");
        }
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    }
  }
  const navigate = useNavigate();
  // Logout
  function logout() {
    sessionStorage.clear();
    localStorage.clear();
    navigate("/login");
  }

  // Pagination render logic
  function renderPagination() {
    const totalPages = Math.ceil(total / PAGE_SIZE);
    if (totalPages <= 1) return null;
    const buttons = [];

    // Trang Đầu
    buttons.push(
      <button
        key="first"
        disabled={page === 1}
        onClick={() => setPage(1)}
        style={{ fontWeight: 600 }}
      >
        Trang Đầu
      </button>
    );

    // Các số trang
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

    // Trang Cuối
    buttons.push(
      <button
        key="last"
        disabled={page === totalPages}
        onClick={() => setPage(totalPages)}
        style={{ fontWeight: 600 }}
      >
        Trang Cuối
      </button>
    );

    return <div className="pagination">{buttons}</div>;
  }

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

  // Check role on mount
  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role !== "staff") {
      alert("You are not Staff");
      window.location.href = "/Pages/ViewPage/login.html";
    }
    // eslint-disable-next-line
  }, []);

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
              <span>Quản Lí Lịch Đặt Khám</span>
            </li>
            <li className="active">
              <span className="icon">👤</span>
              <span>Quản Lí Thông Tin KH</span>
            </li>
            <li>
              <span className="icon">📋</span>
              <span>Quản Lí DS Tư Vấn Đã Đặt</span>
            </li>
            <li>
              <span className="icon">🧪</span>
              <span>Quản Lí Kết Quả Xét Nghiệm</span>
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
          <input type="text" placeholder="Tìm Kiếm..." className="search" />
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

        <h1 className="title">Quản Lí Thông Tin Khách Hàng</h1>

        <div className="sort-bar">
          <label>Sort:</label>
          <select value={sort} onChange={handleSortChange}>
            <option value="name_asc">Name: A - Z</option>
            <option value="name_desc">Name: Z - A</option>
            <option value="created_asc">Created At: Increase</option>
            <option value="created_desc">Created At: Decrease</option>
          </select>
        </div>

        <table>
          <thead>
            <tr>
              <th>STT</th>
              <th>Avatar</th>
              <th>Full Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>BirthDate</th>
              <th>Address</th>
              <th>Gender</th>
              <th>Created At</th>
              <th>Status</th>
              <th>Action</th>
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
                  <td className="status">{p.status}</td>
                  <td>
                    <button
                      className="edit-btn"
                      onClick={() => openEditModal(p)}
                    >
                      ✏️
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {renderPagination()}

        {/* Edit Modal */}
        {showModal && (
          <div className="modal" style={{ display: "flex" }}>
            <div className="modal-content">
              <h3 style={{ marginBottom: 30 }}>Edit Profile</h3>
              <h4 style={{ marginBottom: 30, color: "red" }}>{error}</h4>
              <form id="modalForm" onSubmit={handleEditSubmit}>
                <div className="avatar-group">
                  <label>Avatar</label>
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

                <label>Name</label>
                <input
                  type="text"
                  name="name"
                  value={editData.full_name}
                  onChange={(e) =>
                    setEditData({ ...editData, full_name: e.target.value })
                  }
                  required
                />

                <label>Date of Birth</label>
                <input
                  type="date"
                  name="dob"
                  value={editData.dob}
                  onChange={(e) =>
                    setEditData({ ...editData, dob: e.target.value })
                  }
                  required
                />

                <label>Phone</label>
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

                <label>Gender</label>
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

                <label>Address</label>
                <input
                  type="text"
                  name="address"
                  value={editData.address}
                  onChange={(e) =>
                    setEditData({ ...editData, address: e.target.value })
                  }
                  required
                />

                <label>Role</label>
                <input type="text" name="role" value="Patient" readOnly />

                <label>Status</label>
                <select
                  name="status"
                  value={editData.status}
                  onChange={(e) =>
                    setEditData({ ...editData, status: e.target.value })
                  }
                >
                  {statusOptions.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>

                <div className="modal-actions">
                  <button type="submit" className="btn-green">
                    Save
                  </button>
                  <button
                    type="button"
                    id="cancelModal"
                    className="btn-purple"
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
