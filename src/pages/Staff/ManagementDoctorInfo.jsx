import React, { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar/Sidebar";
import doctorInfoService from "../../services/DoctorInfoService";
import "./ManagementDoctorInfo.css";

export default function ManagementDoctorInfo() {
  const [doctors, setDoctors] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [message, setMessage] = useState({ text: "", isError: false });
  const [formData, setFormData] = useState({
    doctorId: "",
    degree: "",
    specialization: "",
    experienceYears: "",
    doctorAvatar: "",
    status: "ACTIVE",
  });

  // Utility functions
  const showMessage = (text, isError = false) => {
    setMessage({ text, isError });
    setTimeout(() => setMessage({ text: "", isError: false }), 5000);
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch both doctors and users data
      const [doctorData, userData] = await Promise.all([
        doctorInfoService.getAllDoctors(),
        doctorInfoService.getAllUsers(),
      ]);

      setDoctors(doctorData);
      setUsers(userData.filter((u) => u.role === "Doctor"));
    } catch (error) {
      console.error("Error fetching data:", error);
      showMessage(
        "Lỗi khi tải dữ liệu: " +
          (error.response?.data?.message || error.message),
        true
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editMode) {
        await doctorInfoService.updateDoctor(selectedDoctor.doctorId, formData);
        showMessage("Cập nhật thành công");
      } else {
        await doctorInfoService.createDoctor(formData);
        showMessage("Thêm mới thành công");
      }

      setShowModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      showMessage("Có lỗi xảy ra: " + error.message, true);
    }
    setLoading(false);
  };

  const handleEdit = (doctor) => {
    setSelectedDoctor(doctor);
    setFormData({
      doctorId: doctor.doctorId,
      degree: doctor.degree || "",
      specialization: doctor.specialization || "",
      experienceYears: doctor.experienceYears || "",
      doctorAvatar: doctor.doctorAvatar || "",
      status: doctor.status,
    });
    setEditMode(true);
    setShowModal(true);
  };

  const handleDelete = async (doctorId) => {
    if (window.confirm("Bạn có chắc muốn xóa thông tin bác sĩ này?")) {
      setLoading(true);
      try {
        await doctorInfoService.deleteDoctor(doctorId);
        showMessage("Xóa thành công");
        fetchData();
      } catch (error) {
        showMessage("Lỗi khi xóa: " + error.message, true);
      }
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      doctorId: "",
      degree: "",
      specialization: "",
      experienceYears: "",
      doctorAvatar: "",
      status: "ACTIVE",
    });
    setEditMode(false);
    setSelectedDoctor(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  // Get user info for a doctor
  const getUserInfo = (doctorId) => {
    return users.find((u) => u.userId === doctorId) || {};
  };

  // Get available doctors (users with role Doctor who don't have DoctorInfo yet)
  const getAvailableDoctors = () => {
    const existingDoctorIds = doctors.map((d) => d.doctorId);
    return users.filter(
      (u) => u.role === "Doctor" && !existingDoctorIds.includes(u.userId)
    );
  };

  return (
    <div className="wrapper">
      <Sidebar active="doctor" />

      <main className="content">
        <h1 className="title">Quản Lý Thông Tin Bác Sĩ</h1>

        {message.text && (
          <div
            className={`alert ${
              message.isError ? "alert-error" : "alert-success"
            }`}
          >
            {message.isError ? "⚠️" : "✅"} {message.text}
          </div>
        )}

        <div className="table-container">
          <div className="table-header">
            <h3>👨‍⚕️ Danh Sách Bác Sĩ</h3>
            <button
              className="btn-add-exam"
              onClick={openAddModal}
              disabled={loading}
            >
              ➕ Thêm Bác Sĩ Mới
            </button>
          </div>

          <table className="examination-table">
            <thead>
              <tr>
                <th>STT</th>
                <th>Ảnh</th>
                <th>Họ Tên</th>
                <th>Giới Tính</th>
                <th>SĐT</th>
                <th>Bằng Cấp</th>
                <th>Chuyên Khoa</th>
                <th>Kinh Nghiệm</th>
                <th>Trạng Thái</th>
                <th>Hành Động</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="10" className="text-center">
                    ⏳ Đang tải dữ liệu...
                  </td>
                </tr>
              ) : doctors.length === 0 ? (
                <tr>
                  <td colSpan="10" className="text-center">
                    📝 Chưa có dữ liệu bác sĩ
                  </td>
                </tr>
              ) : (
                doctors.map((doctor, index) => {
                  const userInfo = getUserInfo(doctor.doctorId);
                  return (
                    <tr key={doctor.doctorId}>
                      <td className="text-center">{index + 1}</td>
                      <td>
                        <div className="doctor-avatar-cell">
                          <img
                            src={
                              doctor.doctorAvatar ||
                              userInfo.userAvatar ||
                              "/default-avatar.png"
                            }
                            alt=""
                            className="doctor-avatar"
                          />
                        </div>
                      </td>
                      <td>
                        <strong>
                          {userInfo.fullName || doctor.doctorName || "N/A"}
                        </strong>
                      </td>
                      <td>{userInfo.gender || "N/A"}</td>
                      <td>{userInfo.phone || "N/A"}</td>
                      <td>{doctor.degree || "N/A"}</td>
                      <td>{doctor.specialization || "N/A"}</td>
                      <td className="text-center">
                        {doctor.experienceYears ? (
                          <span className="experience-badge">
                            {doctor.experienceYears} năm
                          </span>
                        ) : (
                          "N/A"
                        )}
                      </td>
                      <td>
                        <span
                          className={`status-doctor ${doctor.status.toLowerCase()}`}
                        >
                          {doctor.status === "ACTIVE" ? "Hoạt động" : "Ngừng"}
                        </span>
                      </td>
                      <td className="text-center">
                        <button
                          className="btn-action"
                          onClick={() => handleEdit(doctor)}
                          title="Chỉnh sửa"
                        >
                          ✏️
                        </button>
                        <button
                          className="btn-action"
                          onClick={() => handleDelete(doctor.doctorId)}
                          title="Xóa"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {showModal && (
          <div className="modal-overlay">
            <div className="form-modal">
              <div className="form-header">
                <h2>
                  {editMode
                    ? "✏️ Cập Nhật Thông Tin Bác Sĩ"
                    : "🧑‍⚕️ Thêm Bác Sĩ Mới"}
                </h2>
                <button
                  className="close-btn"
                  onClick={() => setShowModal(false)}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="exam-form">
                {!editMode && (
                  <div className="form-section">
                    <h3>👤 Chọn Bác Sĩ</h3>
                    <div className="form-group">
                      <label>
                        Bác sĩ <span style={{ color: "#ef4444" }}>*</span>
                      </label>
                      <select
                        value={formData.doctorId}
                        onChange={(e) =>
                          setFormData({ ...formData, doctorId: e.target.value })
                        }
                        required
                        disabled={editMode}
                      >
                        <option value="">-- Chọn bác sĩ --</option>
                        {getAvailableDoctors().map((doctor) => (
                          <option key={doctor.userId} value={doctor.userId}>
                            {doctor.fullName} -{" "}
                            {doctor.account?.email || doctor.email || ""}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {editMode && (
                  <div className="form-section">
                    <h3>👤 Thông tin bác sĩ</h3>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Họ và tên</label>
                        <input
                          type="text"
                          value={
                            getUserInfo(selectedDoctor?.doctorId).fullName || ""
                          }
                          disabled
                        />
                      </div>
                      <div className="form-group">
                        <label>Email</label>
                        <input
                          type="text"
                          value={
                            getUserInfo(selectedDoctor?.doctorId).account
                              ?.email ||
                            getUserInfo(selectedDoctor?.doctorId).email ||
                            ""
                          }
                          disabled
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="form-section">
                  <h3>🎓 Thông tin chuyên môn</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Bằng Cấp</label>
                      <input
                        type="text"
                        value={formData.degree}
                        onChange={(e) =>
                          setFormData({ ...formData, degree: e.target.value })
                        }
                        placeholder="VD: Tiến sĩ Y khoa"
                      />
                    </div>

                    <div className="form-group">
                      <label>Chuyên Khoa</label>
                      <input
                        type="text"
                        value={formData.specialization}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            specialization: e.target.value,
                          })
                        }
                        placeholder="VD: Nhiễm HIV/AIDS"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Số Năm Kinh Nghiệm</label>
                      <input
                        type="number"
                        value={formData.experienceYears}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            experienceYears: e.target.value,
                          })
                        }
                        min="0"
                        max="50"
                        placeholder="VD: 10"
                      />
                    </div>

                    <div className="form-group">
                      <label>Link Ảnh Đại Diện</label>
                      <input
                        type="text"
                        value={formData.doctorAvatar}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            doctorAvatar: e.target.value,
                          })
                        }
                        placeholder="URL ảnh đại diện"
                      />
                    </div>
                  </div>

                  {editMode && (
                    <div className="form-group">
                      <label>Trạng Thái</label>
                      <select
                        value={formData.status}
                        onChange={(e) =>
                          setFormData({ ...formData, status: e.target.value })
                        }
                      >
                        <option value="ACTIVE">Hoạt động</option>
                        <option value="INACTIVE">Ngừng hoạt động</option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={() => setShowModal(false)}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="btn-submit"
                    disabled={loading}
                  >
                    {loading
                      ? "⏳ Đang xử lý..."
                      : editMode
                      ? "💾 Cập Nhật"
                      : "💾 Lưu"}
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
