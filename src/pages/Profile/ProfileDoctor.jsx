import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ProfileDoctor.css";
import SidebarDoctor from "../../components/Sidebar/Sidebar-Doctor";
import { toast } from "react-toastify";
import { tokenManager, apiRequest } from "../../services/account";

const backendBaseUrl = "https://localhost:7243";
const today = new Date().toISOString().split("T")[0];

class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <div>Đã xảy ra lỗi khi tải trang hồ sơ.</div>;
    }
    return this.props.children;
  }
}

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

  useEffect(() => {
    if (!accountID) {
      toast.error("Vui lòng đăng nhập");
      navigate("/login");
      return;
    }
    apiRequest(`${backendBaseUrl}/api/Account/${accountID}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.full_name) {
          setProfile(data);
          setEditForm({
            name: data.full_name || "",
            dob: data.birthdate ? data.birthdate.slice(0, 10) : "",
            phone: data.phone || "",
            gender: data.gender || "",
            address: data.address || "",
            role: data.role || "",
          });
        } else {
          toast.error("Không tìm thấy dữ liệu hồ sơ");
          setProfile({});
        }
      })
      .catch((error) => {
        console.error("API Error:", error);
        toast.error("Không thể tải hồ sơ. Vui lòng thử lại.");
        setProfile({});
      });
  }, [accountID, navigate]);

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

  function openEdit() {
    setEditError("");
    let avatarUrl = "/assets/image/patient/patient.png";
    if (profile?.user_avatar) {
      avatarUrl = profile.user_avatar.startsWith("http")
        ? profile.user_avatar
        : `${backendBaseUrl}/api/account/avatar/${profile.user_avatar}`;
    } else {
      const tokenAvatar = tokenManager.getUserAvatarUrl?.();
      if (tokenAvatar?.startsWith("http")) {
        avatarUrl = tokenAvatar;
      }
    }
    setPreviewAvatar(avatarUrl);
    setShowEdit(true);
  }

  async function handleEditSubmit(e) {
    e.preventDefault();
    setEditError("");
    let avatarPath = "";

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
          setEditError("Tải ảnh đại diện thất bại");
          return;
        }
      } catch {
        setEditError("Lỗi khi tải ảnh đại diện.");
        return;
      }
    }

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
          toast.success("Chỉnh sửa thành công", { autoClose: 1000 });
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
            toast.error(result.title || "Cập nhật thất bại.");
          }
        }
      })
      .catch(() => toast.error("Đã xảy ra lỗi. Vui lòng thử lại."));
  }

  function handlePassSubmit(e) {
    e.preventDefault();
    setPassError("");
    const form = e.target;
    const newPassword = form.newPassword.value.trim();
    const confirmPassword = form.confirmPassword.value.trim();
    if (newPassword !== confirmPassword) {
      toast.error("Mật khẩu mới không khớp!", { autoClose: 1500 });
      return;
    }
    apiRequest(`${backendBaseUrl}/api/Account/ChangePass/${accountID}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password_hash: newPassword }),
    }).then(async (response) => {
      if (response.status === 204) {
        setShowPass(false);
        toast.success("Đổi mật khẩu thành công", { autoClose: 1500 });
      } else {
        const result = await response.json();
        const error1 = await result.errors?.password_hash?.[0];
        toast.error(error1 || "Đổi mật khẩu thất bại.", { autoClose: 1500 });
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

  if (!profile) return <div>Đang tải...</div>;
  if (Object.keys(profile).length === 0)
    return <div>Không tìm thấy dữ liệu hồ sơ.</div>;

  return (
    <ErrorBoundary>
      <div className="container-profile-doctor">
        <div className="sidebar-profile-doctor">
          <SidebarDoctor active="Profile" />
        </div>
        <section className="profile-profile-doctor">
          <h2 style={{ color: "#257df4" }}>Thông Tin cá nhân</h2>
          <div className="card-profile-doctor profile-header-profile-doctor">
            <div className="profile-photo-profile-doctor">
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
                onError={(e) => {
                  e.target.src = "/assets/image/patient/patient.png";
                }}
              />
            </div>
            <div className="profile-info-profile-doctor">
              <strong style={{ fontSize: "20px" }}>
                {profile.full_name || "Chưa có tên"}
              </strong>
              <p style={{ fontSize: "16px" }}>
                {profile.role === "Doctor" ? "Bác sĩ" : profile.role || "Chưa có vai trò"}
              </p>
              <p style={{ fontSize: "16px" }}>
                {profile.address || "Chưa có địa chỉ"}
              </p>
            </div>
          </div>
          <div className="card-profile-doctor personal-info-profile-doctor">
            <div className="info-header-profile-doctor">
              <strong style={{ fontSize: "16px" }}>Thông tin cá nhân</strong>
              <button className="edit-btn-profile-doctor" onClick={openEdit}>
                Chỉnh sửa ✎
              </button>
            </div>
            <div className="info-grid-profile-doctor">
              <div>
                <span>Họ và tên</span>
                <p>{profile.full_name || "Chưa có"}</p>
              </div>
              <div>
                <span>Ngày sinh</span>
                <p>
                  {profile.birthdate
                    ? new Date(profile.birthdate).toLocaleDateString()
                    : "Chưa có"}
                </p>
              </div>
              <div>
                <span>Tuổi</span>
                <p>{calculateAge(profile.birthdate) || "Chưa có"}</p>
              </div>
              <div>
                <span>Số điện thoại</span>
                <p>{profile.phone || "Chưa có"}</p>
              </div>
              <div>
                <span>Giới tính</span>
                <p>
                  {profile.gender === "Male"
                    ? "Nam"
                    : profile.gender === "Female"
                    ? "Nữ"
                    : profile.gender || "Chưa có"}
                </p>
              </div>
              <div>
                <span>Ngày tạo</span>
                <p>
                  {profile.created_at
                    ? new Date(profile.created_at).toLocaleDateString()
                    : "Chưa có"}
                </p>
              </div>
              <div>
                <span>Vai Trò</span>
                <p>{profile.role === "Doctor" ? "Bác sĩ" : profile.role || "Chưa có"}</p>
              </div>
              <div>
                <span>Địa chỉ</span>
                <p>{profile.address || "Chưa có"}</p>
              </div>
            </div>
          </div>
          {showEdit && (
            <div className="modal-profile-doctor" style={{ display: "flex" }}>
              <div className="modal-content-profile-doctor">
                <h3>Chỉnh sửa thông tin</h3>
                <h4 style={{ color: "red" }}>{editError}</h4>
                <form id="modalForm-profile-doctor" onSubmit={handleEditSubmit}>
                  <div className="avatar-group-profile-doctor">
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
                  <input type="text" value={editForm.role === "Doctor" ? "Bác sĩ" : editForm.role} readOnly />
                  <div className="modal-actions-profile-doctor">
                    <button type="submit" className="btn-green-profile-doctor">
                      Lưu
                    </button>
                    <button
                      type="button"
                      className="btn-purple-profile-doctor"
                      onClick={() => setShowEdit(false)}
                    >
                      Hủy
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
          <div className="card-profile-doctor general-settings-profile-doctor">
            <strong>Chung</strong>
            <div className="settings-profile-doctor">
              <div>
                <span>Đổi mật khẩu</span>
                <button
                  className="btn-change-profile-doctor"
                  onClick={() => setShowPass(true)}
                >
                  Thay đổi
                </button>
              </div>
            </div>
          </div>
          {showPass && (
            <div className="modal-profile-doctor" style={{ display: "flex" }}>
              <div className="modal-content-profile-doctor">
                <h3>Đổi mật khẩu</h3>
                <h4 style={{ color: "red" }}>{passError}</h4>
                <form
                  id="passwordForm-profile-doctor"
                  onSubmit={handlePassSubmit}
                >
                  <label>Mật khẩu hiện tại</label>
                  <input type="password" name="currentPassword" required />
                  <label>Mật khẩu mới</label>
                  <input type="password" name="newPassword" required />
                  <label>Xác nhận mật khẩu</label>
                  <input type="password" name="confirmPassword" required />
                  <div className="modal-actions-profile-doctor">
                    <button type="submit" className="btn-green-profile-doctor">
                      Lưu
                    </button>
                    <button
                      type="button"
                      className="btn-purple-profile-doctor"
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
    </ErrorBoundary>
  );
}
