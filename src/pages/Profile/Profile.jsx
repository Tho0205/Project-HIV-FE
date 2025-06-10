import React, { useEffect, useState, useRef } from "react";
import "./Profile.css";
const backendBaseUrl = "https://localhost:7243";

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [showEdit, setShowEdit] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [editError, setEditError] = useState("");
  const [passError, setPassError] = useState("");
  const [previewAvatar, setPreviewAvatar] = useState("");
  const [editForm, setEditForm] = useState({});
  const [avatarFile, setAvatarFile] = useState(null);

  const accountID = localStorage.getItem("account_id");

  useEffect(() => {
    if (!accountID) {
      alert("Please Login!!");
      window.location.href = "/Pages/ViewPage/login.html";
      return;
    }
    fetch(`${backendBaseUrl}/api/Account/${accountID}`)
      .then((res) => res.json())
      .then((data) => {
        setProfile(data);
        setEditForm({
          name: data.full_name || "",
          dob: data.birthdate ? data.birthdate.slice(0, 10) : "",
          phone: data.phone || "",
          email: data.email || "",
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
    setPreviewAvatar(
      profile?.user_avatar
        ? `${backendBaseUrl}/api/account/avatar/${profile.user_avatar}`
        : "/assets/image/patient/patient.png"
    );
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
      email: editForm.email,
      full_name: editForm.name,
      gender: editForm.gender,
      phone: editForm.phone,
      birthdate: editForm.dob,
      role: editForm.role,
      address: editForm.address,
      user_avatar: avatarPath,
    };

    fetch(`${backendBaseUrl}/api/Account/Update/${accountID}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
      .then(async (response) => {
        if (response.status === 204) {
          setShowEdit(false);
          window.location.reload();
        } else {
          const result = await response.json();
          if (result.errors) {
            setEditError(
              Object.entries(result.errors)
                .map(
                  ([field, errorArr]) =>
                    `${capitalize(field)}: ${errorArr.join(", ")}`
                )
                .join("\n")
            );
          } else {
            setEditError(result.title || "Update failed.");
          }
        }
      })
      .catch(() => setEditError("Something went wrong. Please try again."));
  }

  // Đổi mật khẩu
  function handlePassSubmit(e) {
    e.preventDefault();
    setPassError("");
    const form = e.target;
    const newPassword = form.newPassword.value.trim();
    const confirmPassword = form.confirmPassword.value.trim();
    if (newPassword !== confirmPassword) {
      setPassError("New passwords do not match!");
      return;
    }
    fetch(`${backendBaseUrl}/api/Account/ChangePass/${accountID}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password_hash: newPassword }),
    }).then(async (response) => {
      if (response.status === 204) {
        setShowPass(false);
        window.location.reload();
      } else {
        const result = await response.json();
        setPassError(result.title || "Password change failed.");
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
<div className="profile-container">
    <div className="container">
      {/* Sidebar */}
      <aside className="sidebar">
        <a href="#" className="active">
          General
        </a>
        <a href="#">Consultation History</a>
        <a href="#">Patient Documents</a>
        <a href="#">Blog Manager</a>
      </aside>

      {/* Main Profile */}
      <section className="profile">
        <h2>My Profile</h2>
        {/* Profile Header */}
        <div className="card profile-header">
          <div className="profile-photo">
            <img
              src={
                profile.user_avatar
                  ? `${backendBaseUrl}/api/account/avatar/${
                      profile.user_avatar
                    }?t=${Date.now()}`
                  : "/assets/image/patient/patient.png"
              }
              alt="Avatar"
            />
          </div>
          <div className="profile-info">
            <strong>{profile.full_name}</strong>
            <p className="title">{profile.role}</p>
            <p className="address">{profile.address}</p>
          </div>
        </div>

        {/* Personal Info */}
        <div className="card personal-info">
          <div className="info-header">
            <strong>Personal Information</strong>
            <button className="edit-btn" onClick={openEdit}>
              Edit ✎
            </button>
          </div>
          <div className="info-grid">
            <div>
              <span>Name</span>
              <p>{profile.full_name}</p>
            </div>
            <div>
              <span>Date of Birth</span>
              <p>
                {profile.birthdate
                  ? new Date(profile.birthdate).toLocaleDateString()
                  : ""}
              </p>
            </div>
            <div>
              <span>Age</span>
              <p>{calculateAge(profile.birthdate)}</p>
            </div>
            <div>
              <span>Phone Number</span>
              <p>{profile.phone}</p>
            </div>
            <div>
              <span>Email Address</span>
              <p>{profile.email}</p>
            </div>
            <div>
              <span>Gender</span>
              <p>{profile.gender}</p>
            </div>
            <div>
              <span>Created At</span>
              <p>
                {profile.created_at
                  ? new Date(profile.created_at).toLocaleDateString()
                  : ""}
              </p>
            </div>
            <div>
              <span>Bio</span>
              <p>{profile.role}</p>
            </div>
            <div>
              <span>Address</span>
              <p>{profile.address}</p>
            </div>
          </div>
        </div>

        {/* Edit Modal */}
        {showEdit && (
          <div className="modal" style={{ display: "flex" }}>
            <div className="modal-content">
              <h3>Edit Profile</h3>
              <h4 style={{ color: "red" }}>{editError}</h4>
              <form id="modalForm" onSubmit={handleEditSubmit}>
                <div className="avatar-group">
                  <div>
                    <label>Avatar</label>
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
                <label>Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                  required
                />
                <label>Date of Birth</label>
                <input
                  type="date"
                  value={editForm.dob}
                  onChange={(e) =>
                    setEditForm({ ...editForm, dob: e.target.value })
                  }
                  required
                />
                <label>Phone</label>
                <input
                  type="text"
                  value={editForm.phone}
                  onChange={(e) =>
                    setEditForm({ ...editForm, phone: e.target.value })
                  }
                  required
                />
                <label>Email</label>
                <input type="email" value={editForm.email} readOnly />
                <label>Gender</label>
                <select
                  value={editForm.gender}
                  onChange={(e) =>
                    setEditForm({ ...editForm, gender: e.target.value })
                  }
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                <label>Address</label>
                <input
                  type="text"
                  value={editForm.address}
                  onChange={(e) =>
                    setEditForm({ ...editForm, address: e.target.value })
                  }
                  required
                />
                <label>Bio</label>
                <input type="text" value={editForm.role} readOnly />
                <div className="modal-actions">
                  <button type="submit" className="btn-green">
                    Save
                  </button>
                  <button
                    type="button"
                    className="btn-purple"
                    onClick={() => setShowEdit(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Medical History */}
        <div className="card medical-history">
          <strong>Medical history/Specitity and Qualification</strong>
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
        </div>

        {/* General Settings */}
        <div className="card general-settings">
          <strong>General</strong>
          <div className="settings">
            <div>
              <span>Change Password</span>
              <button className="btn change" onClick={() => setShowPass(true)}>
                Change
              </button>
            </div>
            <div className="toggle-row">
              <span>Notifications</span>
              <label className="switch">
                <input type="checkbox" defaultChecked />
                <span className="slider"></span>
              </label>
              <span className="label">Enable Notifications</span>
            </div>
          </div>
        </div>

        {/* Change Password Modal */}
        {showPass && (
          <div className="modal" style={{ display: "flex" }}>
            <div className="modal-content">
              <h3>Change Password</h3>
              <h4 style={{ color: "red" }}>{passError}</h4>
              <form id="passwordForm" onSubmit={handlePassSubmit}>
                <label>Current Password</label>
                <input type="password" name="currentPassword" required />
                <label>New Password</label>
                <input type="password" name="newPassword" required />
                <label>Confirm New Password</label>
                <input type="password" name="confirmPassword" required />
                <div className="modal-actions">
                  <button type="submit" className="btn-green">
                    Save
                  </button>
                  <button
                    type="button"
                    className="btn-purple"
                    onClick={() => setShowPass(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </section>
    </div>
</div>
  );
}
