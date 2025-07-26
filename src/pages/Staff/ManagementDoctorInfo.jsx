import React, { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar/Sidebar";
import doctorInfoService from "../../services/DoctorInfoService";
import { doctorAvatar } from "../../services/doctorInfo";
import "./ManagementDoctorInfo.css";
import {
  FaEdit,
  FaTrashAlt,
  FaUserMd,
  FaGraduationCap,
  FaSave,
  FaSpinner,
} from "react-icons/fa";
import { MdClose } from "react-icons/md";

export default function ManagementDoctorInfo() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [message, setMessage] = useState({ text: "", isError: false });
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
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
      // Gọi API lấy danh sách doctors
      const doctorData = await doctorInfoService.getAllDoctors();
      console.log("📦 Dữ liệu nhận được từ API:", doctorData);
      
      // Auto-sync users với role Doctor
      try {
        const syncResult = await doctorInfoService.syncDoctorUsers();
        if (syncResult.newDoctorsAdded > 0) {
          showMessage(`Đã tự động thêm ${syncResult.newDoctorsAdded} bác sĩ mới từ hệ thống`);
          // Fetch updated data if new doctors were added
          const updatedDoctorData = await doctorInfoService.getAllDoctors();
          if (Array.isArray(updatedDoctorData)) {
            setDoctors(updatedDoctorData);
          } else {
            console.error("Data is not an array:", updatedDoctorData);
            setDoctors([]);
          }
          return;
        }
      } catch (syncError) {
        console.log("Auto-sync error:", syncError);
      }
      
      if (Array.isArray(doctorData)) {
        setDoctors(doctorData);
      } else {
        console.error("Data is not an array:", doctorData);
        setDoctors([]);
      }
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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
      ];
      if (!allowedTypes.includes(file.type)) {
        showMessage("Chỉ chấp nhận file ảnh (JPEG, PNG, GIF)", true);
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showMessage("Kích thước file không được vượt quá 5MB", true);
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleUploadAvatar = async () => {
    if (!selectedFile || !selectedDoctor) return;

    setUploadingAvatar(true);
    try {
      const result = await doctorInfoService.uploadAvatar(
        selectedDoctor.doctorId,
        selectedFile
      );

      // Update form data with new avatar URL
      setFormData((prev) => ({
        ...prev,
        doctorAvatar: result.avatarUrl,
      }));

      showMessage("Tải ảnh lên thành công!");
      setSelectedFile(null);
    } catch (error) {
      console.error("Upload error:", error);
      showMessage("Lỗi khi tải ảnh: " + error.message, true);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Chỉ update doctor (không có create)
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
      
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      let errorMessage = "Có lỗi xảy ra khi cập nhật";

      if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status) {
        errorMessage = `Lỗi HTTP: ${error.response.status}`;
      }

      showMessage(errorMessage, true);
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

  const filteredDoctors = !searchTerm.trim()
  ? doctors
  : doctors.filter((doctor) =>
      (doctor.doctorName &&
        doctor.doctorName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (doctor.degree &&
        doctor.degree.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (doctor.specialization &&
        doctor.specialization.toLowerCase().includes(searchTerm.toLowerCase()))
    );


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

        <div className="search-container">
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, bằng cấp hoặc chuyên khoa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="table-container">
          <div className="table-header">
            <h3>
              <FaUserMd style={{ marginRight: 6 }} /> Danh Sách Bác Sĩ
            </h3>
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
              ) : filteredDoctors.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center">
                    {searchTerm
                      ? "🔍 Không tìm thấy bác sĩ phù hợp"
                      : "📝 Chưa có dữ liệu bác sĩ"}
                  </td>
                </tr>
              ) : (
                filteredDoctors.map((doctor, index) => (
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
                      <span
                        className={`status-doctor ${doctor.status.toLowerCase()}`}
                      >
                        {doctor.status === "ACTIVE" ? "Hoạt động" : "Ngừng"}
                      </span>
                    </td>
                    <td className="text-center-doctor-info">
                      <button
                        className="btn-action"
                        onClick={() => handleEdit(doctor)}
                        title="Chỉnh sửa"
                      >
                        <FaEdit />
                      </button>
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
                <h2>
                  <FaEdit style={{ marginRight: 6 }} /> Cập Nhật Thông Tin Bác Sĩ
                </h2>
                <button
                  className="close-btn"
                  onClick={() => setShowModal(false)}
                >
                  <MdClose />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="exam-form">
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
                  </div>

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
                </div>

                <div className="form-section">
                  <h3>📷 Ảnh Đại Diện</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Chọn Ảnh Mới</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                      />
                      <small
                        style={{
                          color: "#666",
                          display: "block",
                          marginTop: "5px",
                        }}
                      >
                        * Chỉ chấp nhận file ảnh (JPEG, PNG, GIF) - Tối đa 5MB
                      </small>
                    </div>

                    {selectedFile && (
                      <div className="form-group">
                        <label>File đã chọn: {selectedFile.name}</label>
                        <button
                          type="button"
                          className="btn-submit"
                          onClick={handleUploadAvatar}
                          disabled={uploadingAvatar}
                          style={{ marginTop: "8px" }}
                        >
                          {uploadingAvatar
                            ? "⏳ Đang tải..."
                            : "📤 Tải Ảnh Lên"}
                        </button>
                      </div>
                    )}
                  </div>

                  {formData.doctorAvatar && (
                    <div className="form-group">
                      <label>Ảnh hiện tại:</label>
                      <img
                        src={doctorAvatar(formData.doctorAvatar)}
                        alt="Current Avatar"
                        style={{
                          width: "100px",
                          height: "100px",
                          objectFit: "cover",
                          borderRadius: "8px",
                          border: "2px solid #e5e7eb",
                        }}
                      />
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
                    ) : (
                      <>
                        <FaSave style={{ marginRight: 6 }} /> Cập Nhật
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