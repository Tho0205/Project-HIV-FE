import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./Profile.css";
import SidebarProfile from "../../components/SidebarProfile/SidebarProfile";
import { toast } from "react-toastify";
import { tokenManager, apiRequest } from "../../services/account";

const backendBaseUrl = "https://localhost:7243";
const today = new Date().toISOString().split("T")[0];
export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [showEdit, setShowEdit] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [editError, setEditError] = useState("");
  const [passError, setPassError] = useState("");
  const [previewAvatar, setPreviewAvatar] = useState("");
  const [editForm, setEditForm] = useState({});
  const [avatarFile, setAvatarFile] = useState(null);

  const accountID = tokenManager.getCurrentAccountId();
  const navigate = useNavigate();

  console.log("AccountID:", accountID);

  useEffect(() => {
    if (!accountID) {
      toast.error("Vui lòng đăng nhập");
      navigate("/login");
      return;
    }
    apiRequest(`${backendBaseUrl}/api/Account/${accountID}`)
      .then((res) => res.json())
      .then((data) => {
        setProfile(data);
        setEditForm({
          name: data.full_name || "",
          dob: data.birthdate ? data.birthdate.slice(0, 10) : "",
          phone: data.phone || "",
          gender: data.gender || "",
          address: data.address || "",
          role: data.role || "",
        });
      })
      .catch(() => {
        alert("Failed to load profile. Please try again.");
      });
  }, [accountID]);

  // Xử lý preview avatar khi chọn file mới
  function handleAvatarChange(e) {
    const file = e.target.files[0];
    setAvatarFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setPreviewAvatar(ev.target.result);
      reader.readAsDataURL(file);
    } else {
      setPreviewAvatar("");
    }
  }

  // Mở modal edit
  function openEdit() {
    setEditError("");

    let avatarUrl = "/assets/image/patient/patient.png"; // default

    if (profile?.user_avatar) {
      if (profile.user_avatar.startsWith("http")) {
        // avatar từ Google
        avatarUrl = profile.user_avatar;
      } else {
        // avatar từ hệ thống (upload)
        avatarUrl = `${backendBaseUrl}/api/account/avatar/${profile.user_avatar}`;
      }
    } else {
      // nếu không có thì thử lấy từ token
      const tokenAvatar = tokenManager.getUserAvatarUrl?.();
      if (tokenAvatar?.startsWith("http")) {
        avatarUrl = tokenAvatar;
      }
    }

    setPreviewAvatar(avatarUrl);
    setShowEdit(true);
  }

  // Gửi form edit
  async function handleEditSubmit(e) {
    e.preventDefault();
    setEditError("");
    let avatarPath = "";

    // Nếu có file mới thì upload
    if (avatarFile) {
      const formData = new FormData();
      formData.append("avatar", avatarFile);
      try {
        const res = await fetch(
          `${backendBaseUrl}/api/Account/UploadAvatar/${accountID}`,
          { method: "POST", body: formData }
        );
        if (res.ok) {
          const result = await res.json();
          avatarPath = result.path;
        } else {
          setEditError("Upload avatar failed");
          return;
        }
      } catch {
        setEditError("Error uploading avatar.");
        return;
      }
    }

    // Nếu không chọn ảnh mới thì dùng ảnh cũ
    if (!avatarPath && profile?.user_avatar) {
      avatarPath = profile.user_avatar;
    } else if (!avatarPath) {
      avatarPath = "patient.png";
    } else {
      avatarPath = avatarPath.split("/").pop();
    }

    const data = {
      full_name: editForm.name,
      gender: editForm.gender,
      phone: editForm.phone,
      birthdate: editForm.dob,
      role: editForm.role,
      address: editForm.address,
      user_avatar: avatarPath,
    };

    apiRequest(`${backendBaseUrl}/api/Account/Update/${accountID}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
      .then(async (response) => {
        if (response.status === 204) {
          localStorage.setItem(
            "user_avatar",
            avatarPath
              ? `${backendBaseUrl}/api/account/avatar/${avatarPath}`
              : "/assets/image/patient/patient.png"
          );
          setShowEdit(false);
          toast.success("Edit Successfully", { autoClose: 1000 });
          window.location.reload();
        } else {
          const result = await response.json();
          if (result.errors) {
            toast.error(
              Object.entries(result.errors)
                .map(
                  ([field, errorArr]) =>
                    `${capitalize(field)}: ${errorArr.join(", ")}`
                )
                .join("\n")
            );
          } else {
            toast.error(result.title || "Update failed.");
          }
        }
      })
      .catch(() => toast.error("Something went wrong. Please try again."));
  }

  // Đổi mật khẩu
  function handlePassSubmit(e) {
    e.preventDefault();
    setPassError("");
    const form = e.target;
    const newPassword = form.newPassword.value.trim();
    const confirmPassword = form.confirmPassword.value.trim();
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match!", { autoClose: 1500 });
      return;
    }
    apiRequest(`${backendBaseUrl}/api/Account/ChangePass/${accountID}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password_hash: newPassword }),
    }).then(async (response) => {
      if (response.status === 204) {
        setShowPass(false);
        toast.success("Change Password Successfully", { autoClose: 1500 });
      } else {
        const result = await response.json();

        const error1 = await result.errors.password_hash[0];

        toast.error(error1 || "Password change failed.", { autoClose: 1500 });
      }
    });
  }

  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function calculateAge(birthdate) {
    if (!birthdate) return "";
    const birthYear = new Date(birthdate).getFullYear();
    const nowYear = new Date().getFullYear();
    return nowYear - birthYear;
  }

  if (!profile) return <div>Loading...</div>;

  return (
    <div className="container">
      {/* Sidebar */}
      <div className="sidebar-Profile">
        <SidebarProfile activeItem="general" />
      </div>

      {/* Main Profile */}
      <section className="profile">
        <h2>Thông Tin cá nhân</h2>
        {/* Profile Header */}
        <div className="card profile-header">
          <div className="profile-photo">
            <img
              src={
                profile?.user_avatar
                  ? profile.user_avatar.startsWith("http")
                    ? profile.user_avatar
                    : `${backendBaseUrl}/api/account/avatar/${
                        profile.user_avatar
                      }?t=${Date.now()}`
                  : tokenManager.getUserAvatarUrl?.()?.startsWith("http")
                  ? tokenManager.getUserAvatarUrl()
                  : "/assets/image/patient/patient.png"
              }
              alt="Avatar"
            />
          </div>
          <div className="profile-info">
            <strong>{profile.full_name}</strong>
            <p>{profile.role}</p>
            <p>{profile.address}</p>
          </div>
        </div>

        {/* Personal Info */}
        <div className="card personal-info">
          <div className="info-header">
            <strong>Thông tin cá nhân</strong>
            <button className="edit-btn" onClick={openEdit}>
              Chỉnh sửa ✎
            </button>
          </div>
          <div className="info-grid">
            <div>
              <span>Họ và tên</span>
              <p>{profile.full_name}</p>
            </div>
            <div>
              <span>Ngày sinh</span>
              <p>
                {profile.birthdate
                  ? new Date(profile.birthdate).toLocaleDateString()
                  : ""}
              </p>
            </div>
            <div>
              <span>Tuổi</span>
              <p>{calculateAge(profile.birthdate)}</p>
            </div>
            <div>
              <span>Số điện thoại</span>
              <p>{profile.phone}</p>
            </div>
            <div>
              <span>Giới tính</span>
              <p>{profile.gender}</p>
            </div>
            <div>
              <span>Ngày tạo</span>
              <p>
                {profile.created_at
                  ? new Date(profile.created_at).toLocaleDateString()
                  : ""}
              </p>
            </div>
            <div>
              <span>Vai Trò</span>
              <p>{profile.role}</p>
            </div>
            <div>
              <span>Địa chỉ</span>
              <p>{profile.address}</p>
            </div>
          </div>
        </div>

        {/* Edit Modal */}
        {showEdit && (
          <div className="modal" style={{ display: "flex" }}>
            <div className="modal-content">
              <h3>Chỉnh sửa thông tin</h3>
              <h4 style={{ color: "red" }}>{editError}</h4>
              <form id="modalForm" onSubmit={handleEditSubmit}>
                <div className="avatar-group">
                  <div>
                    <label>Ảnh đại diện</label>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/gif"
                      onChange={handleAvatarChange}
                    />
                  </div>
                  {previewAvatar && (
                    <img
                      src={previewAvatar}
                      alt="Preview"
                      style={{
                        display: "block",
                        width: 80,
                        height: 80,
                        borderRadius: "50%",
                      }}
                    />
                  )}
                </div>
                <label>Họ và tên</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                  required
                />
                <label>Ngày sinh</label>
                <input
                  type="date"
                  value={editForm.dob}
                  max={today}
                  min="1900-01-01"
                  onChange={(e) =>
                    setEditForm({ ...editForm, dob: e.target.value })
                  }
                  required
                />
                <label>Số điện thoại</label>
                <input
                  type="text"
                  value={editForm.phone}
                  onChange={(e) =>
                    setEditForm({ ...editForm, phone: e.target.value })
                  }
                  required
                />
                <label>Giới tính</label>
                <select
                  value={editForm.gender}
                  onChange={(e) =>
                    setEditForm({ ...editForm, gender: e.target.value })
                  }
                >
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                  <option value="Khác">Khác</option>
                </select>
                <label>Địa chỉ</label>
                <input
                  type="text"
                  value={editForm.address}
                  onChange={(e) =>
                    setEditForm({ ...editForm, address: e.target.value })
                  }
                  required
                />
                <label>Vai trò</label>
                <input type="text" value={editForm.role} readOnly />
                <div className="modal-actions">
                  <button type="submit" className="btn-green">
                    Lưu
                  </button>
                  <button
                    type="button"
                    className="btn-purple"
                    onClick={() => setShowEdit(false)}
                  >
                    Hủy
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Medical History */}
        {/* <div className="card medical-history">
          <strong>Tiền sử bệnh án/Chuyên khoa và trình độ chuyên môn</strong>
          <div className="info-grid">
            <div>
              <span>Speech</span>
              <p>None</p>
            </div>
            <div>
              <span>Physical</span>
              <p>None</p>
            </div>
          </div>
        </div> */}

        {/* General Settings */}
        <div className="card general-settings">
          <strong>Chung</strong>
          <div className="settings">
            <div>
              <span>Đổi mật khẩu</span>
              <button className="btn change" onClick={() => setShowPass(true)}>
                Thay đổi
              </button>
            </div>
            {/* <div className="toggle-row">
              <span>Thông báo</span>
              <label className="switch">
                <input type="checkbox" defaultChecked />
                <span className="slider"></span>
              </label>
              <span className="label">Bật thông báo</span>
            </div> */}
          </div>
        </div>

        {/* Change Password Modal */}
        {showPass && (
          <div className="modal" style={{ display: "flex" }}>
            <div className="modal-content">
              <h3>Đổi mật khẩu</h3>
              <h4 style={{ color: "red" }}>{passError}</h4>
              <form id="passwordForm" onSubmit={handlePassSubmit}>
                <label>Mật khẩu hiện tại</label>
                <input type="password" name="currentPassword" required />
                <label>Mật khẩu mới</label>
                <input type="password" name="newPassword" required />
                <label>Xác nhận mật khẩu</label>
                <input type="password" name="confirmPassword" required />
                <div className="modal-actions">
                  <button type="submit" className="btn-green">
                    Lưu
                  </button>
                  <button
                    type="button"
                    className="btn-purple"
                    onClick={() => setShowPass(false)}
                  >
                    Hủy
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
