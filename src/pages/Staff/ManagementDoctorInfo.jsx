import React, { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar/Sidebar";
import doctorInfoService from "../../services/DoctorInfoService";
import { doctorAvatar } from "../../services/doctorInfo";
import "./ManagementDoctorInfo.css";
import {
  FaEdit,
  FaTrashAlt,
  FaUserMd,
  FaPlus,
  FaGraduationCap,
  FaSave,
  FaTimes,
  FaSpinner,
} from "react-icons/fa";
import { MdClose } from "react-icons/md";

export default function ManagementDoctorInfo() {
  const [doctors, setDoctors] = useState([]);
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
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Debug: Kiểm tra token
      const token = localStorage.getItem("jwt_token");
      console.log("Current JWT token exists:", !!token);

      // Kiểm tra user info từ tokenManager
      const userInfo = localStorage.getItem("user_info");
      console.log("User info:", userInfo);

      // Gọi API lấy danh sách doctors
      const doctorData = await doctorInfoService.getAllDoctors();
      console.log("Doctor data loaded:", doctorData);
      console.log("Doctor data type:", typeof doctorData);
      console.log("Is array:", Array.isArray(doctorData));
      // Đảm bảo data là array
      if (Array.isArray(doctorData)) {
        setDoctors(doctorData);
      } else {
        console.error("Data is not an array:", doctorData);
        setDoctors([]);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      console.error("Error response:", error.response);
      console.error("Error status:", error.response?.status);
      console.error("Error data:", error.response?.data);
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
        // Update existing doctor
        const updateData = {
          degree: formData.degree,
          specialization: formData.specialization,
          experienceYears: formData.experienceYears
            ? parseInt(formData.experienceYears)
            : null,
          doctorAvatar: formData.doctorAvatar,
          status: formData.status,
        };

        await doctorInfoService.updateDoctor(
          selectedDoctor.doctorId,
          updateData
        );
        showMessage("Cập nhật thông tin bác sĩ thành công!");
      } else {
        // Create new doctor
        const createData = {
          doctorId: parseInt(formData.doctorId),
          degree: formData.degree,
          specialization: formData.specialization,
          experienceYears: formData.experienceYears
            ? parseInt(formData.experienceYears)
            : null,
          doctorAvatar: formData.doctorAvatar || "doctor.png",
        };

        await doctorInfoService.createDoctor(createData);
        showMessage("Thêm mới bác sĩ thành công!");
      }

      setShowModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error("Submit error:", error);
      showMessage(
        "Có lỗi xảy ra: " + (error.response?.data?.message || error.message),
        true
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (doctor) => {
    setSelectedDoctor(doctor);
    setFormData({
      doctorId: doctor.doctorId,
      degree: doctor.degree || "",
      specialization: doctor.specialization || "",
      experienceYears: doctor.experienceYears || "",
      doctorAvatar: doctor.doctorAvatar || "",
      status: doctor.status || "ACTIVE",
    });
    setEditMode(true);
    setShowModal(true);
  };

  const handleDelete = async (doctorId) => {
    if (window.confirm("Bạn có chắc muốn xóa thông tin bác sĩ này?")) {
      setLoading(true);
      try {
        await doctorInfoService.deleteDoctor(doctorId);
        showMessage("Xóa thông tin bác sĩ thành công!");
        fetchData();
      } catch (error) {
        console.error("Delete error:", error);
        showMessage(
          "Lỗi khi xóa: " + (error.response?.data?.message || error.message),
          true
        );
      } finally {
        setLoading(false);
      }
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

  return (
    <div className="wrapper">
      <Sidebar active="doctor" />

      <main className="content">
        <h1 className="title-doctor-info">Quản Lý Thông Tin Bác Sĩ</h1>

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
            {/* Tiêu đề danh sách bác sĩ */}
            <h3>
              <FaUserMd style={{ marginRight: 6 }} /> Danh Sách Bác Sĩ
            </h3>
            {/* Nút thêm bác sĩ mới */}
            <button
              className="btn-add-exam"
              onClick={openAddModal}
              disabled={loading}
            >
              <FaPlus style={{ marginRight: 6 }} /> Thêm Bác Sĩ Mới
            </button>
          </div>

          <table className="examination-table">
            <thead>
              <tr>
                <th>STT</th>
                <th>ID</th>
                <th>Ảnh</th>
                <th>Họ Tên</th>
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
                  <td colSpan="9" className="text-center-doctor-info">
                    ⏳ Đang tải dữ liệu...
                  </td>
                </tr>
              ) : doctors.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center-doctor-info">
                    📝 Chưa có dữ liệu bác sĩ
                  </td>
                </tr>
              ) : (
                doctors.map((doctor, index) => (
                  <tr key={doctor.doctorId}>
                    <td className="text-center-doctor-info">{index + 1}</td>
                    <td className="text-center-doctor-info">
                      {doctor.doctorId}
                    </td>
                    <td>
                      <div className="doctor-avatar-cell">
                        <img
                          src={doctorAvatar(doctor.doctorAvatar)}
                          alt="Avatar"
                          className="doctor-avatar"
                        />
                      </div>
                    </td>
                    <td>
                      <strong>
                        {doctor.doctorName || `Bác sĩ ID: ${doctor.doctorId}`}
                      </strong>
                    </td>
                    <td>{doctor.degree || "Chưa cập nhật"}</td>
                    <td>{doctor.specialization || "Chưa cập nhật"}</td>
                    <td className="text-center-doctor-info">
                      {doctor.experienceYears ? (
                        <span className="experience-badge">
                          {doctor.experienceYears} năm
                        </span>
                      ) : (
                        "Chưa cập nhật"
                      )}
                    </td>
                    <td>
                      <span className={`status ${doctor.status.toLowerCase()}`}>
                        {doctor.status === "ACTIVE" ? "Hoạt động" : "Ngừng"}
                      </span>
                    </td>
                    <td className="text-center-doctor-info">
                      {/* Nút chỉnh sửa */}
                      <button
                        className="btn-action"
                        onClick={() => handleEdit(doctor)}
                        title="Chỉnh sửa"
                      >
                        <FaEdit />
                      </button>
                      {/* Nút xóa */}
                      <button
                        className="btn-action"
                        onClick={() => handleDelete(doctor.doctorId)}
                        title="Xóa"
                      >
                        <FaTrashAlt />
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
            <div className="form-modal">
              <div className="form-header">
                {/* Tiêu đề modal */}
                <h2>
                  {editMode ? (
                    <>
                      <FaEdit style={{ marginRight: 6 }} /> Cập Nhật Thông Tin
                      Bác Sĩ
                    </>
                  ) : (
                    <>
                      <FaUserMd style={{ marginRight: 6 }} /> Thêm Bác Sĩ Mới
                    </>
                  )}
                </h2>
                {/* Nút đóng modal */}
                <button
                  className="close-btn"
                  onClick={() => setShowModal(false)}
                >
                  <MdClose />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="exam-form">
                {!editMode && (
                  <div className="form-section">
                    <h3>
                      <FaUserMd style={{ marginRight: 6 }} /> Thông Tin Bác Sĩ
                    </h3>
                    <div className="form-group">
                      <label>
                        ID Bác sĩ (User ID){" "}
                        <span style={{ color: "#ef4444" }}>*</span>
                      </label>
                      <input
                        type="number"
                        value={formData.doctorId}
                        onChange={(e) =>
                          setFormData({ ...formData, doctorId: e.target.value })
                        }
                        placeholder="Nhập ID của User có role Doctor"
                        required
                        min="1"
                      />
                      <small
                        style={{
                          color: "#666",
                          display: "block",
                          marginTop: "5px",
                        }}
                      >
                        * Lưu ý: User phải có role "Doctor" và chưa có thông tin
                        bác sĩ
                      </small>
                    </div>
                  </div>
                )}

                {editMode && (
                  <div className="form-section">
                    <h3>👤 Thông tin bác sĩ</h3>
                    <div className="form-row">
                      <div className="form-group">
                        <label>ID Bác sĩ</label>
                        <input
                          type="text"
                          value={selectedDoctor?.doctorId || ""}
                          disabled
                        />
                      </div>
                      <div className="form-group">
                        <label>Tên hiển thị</label>
                        <input
                          type="text"
                          value={
                            selectedDoctor?.doctorName ||
                            `Bác sĩ ID: ${selectedDoctor?.doctorId}`
                          }
                          disabled
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="form-section">
                  <h3>
                    <FaGraduationCap style={{ marginRight: 6 }} /> Thông tin
                    chuyên môn
                  </h3>
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
                        value={formData.doctorAvatar || "doctor.png"}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            doctorAvatar: e.target.value,
                          })
                        }
                        placeholder="doctor.png"
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
                    {loading ? (
                      <>
                        <FaSpinner
                          className="icon-spin"
                          style={{ marginRight: 6 }}
                        />{" "}
                        Đang xử lý...
                      </>
                    ) : editMode ? (
                      <>
                        <FaSave style={{ marginRight: 6 }} /> Cập Nhật
                      </>
                    ) : (
                      <>
                        <FaSave style={{ marginRight: 6 }} /> Lưu
                      </>
                    )}
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
