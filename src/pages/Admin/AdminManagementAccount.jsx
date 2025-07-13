import { useState, useEffect } from "react";
import SidebarAdmin from "../../components/Sidebar/SidebarAdmin";
import AdminAccountService from "../../services/AdminAccountService";
import Pagination from "../../components/Pagination/Pagination";
import { toast } from "react-toastify";
import "./AdminManagementAccount.css";

const PAGE_SIZE = 10;

export default function AdminManagementAccount() {
  // States
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    status: "ACTIVE",
    role: "Patient",
  });

  // Load accounts on mount
  useEffect(() => {
    loadAccounts(page);
  }, [page]);

  // Load all accounts
  const loadAccounts = async () => {
    try {
      setLoading(true);
      const data = await AdminAccountService.getAllAccounts();
      setAccounts(data);
    } catch (error) {
      toast.error("Không thể tải danh sách tài khoản");
      console.error("Load accounts error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter accounts based on search and filters
  const filteredAccounts = accounts.filter((account) => {
    const matchesSearch =
      account.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (account.email &&
        account.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (account.user?.fullName &&
        account.user.fullName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      statusFilter === "ALL" || account.status === statusFilter;
    const matchesRole =
      roleFilter === "ALL" || account.user?.role === roleFilter;

    return matchesSearch && matchesStatus && matchesRole;
  });

  const total1 = filteredAccounts.length;
  const pagedAccounts = filteredAccounts.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  // Open create modal
  const handleCreate = (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    console.log("Opening create modal");
    setSelectedAccount(null);
    setFormData({
      username: "",
      email: "",
      password: "",
      status: "ACTIVE",
      role: "Patient",
    });
    setShowEditModal(true);
    document.body.style.overflow = "hidden";
  };

  // Open edit modal
  const handleEdit = (account, e) => {
    e?.preventDefault();
    e?.stopPropagation();
    console.log("Opening edit modal for:", account);
    setSelectedAccount(account);
    setFormData({
      username: account.username,
      email: account.email || "",
      password: "",
      status: account.status,
      role: account.user?.role || "Patient",
    });
    setShowEditModal(true);
    document.body.style.overflow = "hidden";
  };

  // Open info modal
  const handleInfo = (account, e) => {
    e?.preventDefault();
    e?.stopPropagation();
    console.log("Opening info modal for:", account);
    setSelectedAccount(account);
    setShowInfoModal(true);
    document.body.style.overflow = "hidden";
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (selectedAccount) {
        // Update existing account
        const updateData = {
          accountId: selectedAccount.accountId,
          username: formData.username,
          email: formData.email,
          status: formData.status,
          role: formData.role,
        };

        // Only include password if it's provided
        if (formData.password && formData.password.trim() !== "") {
          updateData.password = formData.password;
        }

        await AdminAccountService.updateAccount(
          selectedAccount.accountId,
          updateData
        );
        toast.success("Cập nhật tài khoản thành công");
      } else {
        // Create new account
        await AdminAccountService.createAccount({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          status: formData.status,
          role: formData.role,
        });
        toast.success("Tạo tài khoản thành công");
      }

      closeEditModal();
      loadAccounts();
    } catch (error) {
      toast.error(error.message || "Có lỗi xảy ra");
      console.error("Submit error:", error);
    }
  };

  // Handle status change
  const handleStatusChange = async (accountId, newStatus) => {
    try {
      await AdminAccountService.updateAccountStatus(accountId, newStatus);
      toast.success("Cập nhật trạng thái thành công");
      loadAccounts();
    } catch (error) {
      toast.error("Không thể cập nhật trạng thái");
      console.error("Status change error:", error);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const statusClasses = {
      ACTIVE: "status-active",
      INACTIVE: "status-inactive",
      DELETED: "status-deleted",
      SUSPENDED: "status-suspended",
    };
    const statusLabels = {
      ACTIVE: "Hoạt động",
      INACTIVE: "Không hoạt động",
      DELETED: "Đã xóa",
      SUSPENDED: "Tạm khóa",
    };
    return (
      <span
        className={`status-badge-admin ${
          statusClasses[status] || "status-default-admin"
        }`}
      >
        {statusLabels[status] || status}
      </span>
    );
  };

  // Get role badge
  const getRoleBadge = (role) => {
    if (!role)
      return (
        <span className="role-badge-admin role-unknown-admin">Chưa có</span>
      );

    const roleLabels = {
      Admin: "Quản trị viên",
      Doctor: "Bác sĩ",
      Patient: "Bệnh nhân",
      Staff: "Nhân viên",
      Manager: "Quản lý",
    };

    return (
      <span className={`role-badge-admin role-${role.toLowerCase()}-admin`}>
        {roleLabels[role] || role}
      </span>
    );
  };

  // Close modal handlers
  const closeEditModal = () => {
    console.log("Closing edit modal");
    setShowEditModal(false);
    setSelectedAccount(null);
    document.body.style.overflow = "unset";
  };

  const closeInfoModal = () => {
    console.log("Closing info modal");
    setShowInfoModal(false);
    setSelectedAccount(null);
    document.body.style.overflow = "unset";
  };

  // Handle backdrop click - DO NOTHING (không đóng modal)
  const handleBackdropClick = (e) => {
    // Không làm gì cả - modal sẽ không đóng khi click outside
    e.stopPropagation();
  };

  // Debug logging
  console.log("Modal states:", { showEditModal, showInfoModal });

  // Loading state
  if (loading) {
    return (
      <div className="admin-layout">
        <SidebarAdmin active="account" />
        <div className="main-content-admin">
          <div className="loading-admin">Đang tải dữ liệu...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      <SidebarAdmin active="account" />
      <div className="main-content-admin">
        {/* Header */}
        <div className="content-header-admin">
          <h1>Quản Lý Tài Khoản</h1>
          <button
            className="btn-primary-admin"
            onClick={handleCreate}
            type="button"
          >
            <span>➕</span> Tạo tài khoản mới
          </button>
        </div>

        {/* Filters */}
        <div className="filters-admin">
          <div className="search-box-admin">
            <input
              type="text"
              placeholder="Tìm kiếm theo tên đăng nhập, email, họ tên..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input-admin"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="status-filter-admin"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Hoạt động</option>
            <option value="INACTIVE">Không hoạt động</option>
            <option value="SUSPENDED">Tạm khóa</option>
            <option value="DELETED">Đã xóa</option>
          </select>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="status-filter-admin"
          >
            <option value="ALL">Tất cả vai trò</option>
            <option value="Admin">Quản trị viên</option>
            <option value="Doctor">Bác sĩ</option>
            <option value="Patient">Bệnh nhân</option>
            <option value="Staff">Nhân viên</option>
            <option value="Manager">Quản lý</option>
          </select>
        </div>

        {/* Table */}
        <div className="accounts-table-container-admin">
          <table className="accounts-table-admin-1">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tên đăng nhập</th>
                <th>Email</th>
                <th>Họ và tên</th>
                <th>Vai trò</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {pagedAccounts.length === 0 ? (
                <tr>
                  <td colSpan="8" className="no-data-admin">
                    Không tìm thấy tài khoản nào
                  </td>
                </tr>
              ) : (
                pagedAccounts.map((account) => (
                  <tr key={account.accountId}>
                    <td>{account.accountId}</td>
                    <td className="username-admin">{account.username}</td>
                    <td>{account.email || "Chưa có"}</td>
                    <td>{account.user?.fullName || "Chưa cập nhật"}</td>
                    <td>{getRoleBadge(account.user?.role)}</td>
                    <td>{getStatusBadge(account.status)}</td>
                    <td>{formatDate(account.createdAt)}</td>
                    <td className="actions-admin">
                      <button
                        className="btn-edit-admin"
                        onClick={(e) => handleEdit(account, e)}
                        title="Chỉnh sửa"
                        type="button"
                      >
                        ✏️
                      </button>

                      <select
                        value={account.status}
                        onChange={(e) =>
                          handleStatusChange(account.accountId, e.target.value)
                        }
                        className="status-select-admin"
                        title="Thay đổi trạng thái"
                      >
                        <option value="ACTIVE">Hoạt động</option>
                        <option value="INACTIVE">Không hoạt động</option>
                        <option value="SUSPENDED">Tạm khóa</option>
                      </select>

                      <button
                        className="btn-info-admin"
                        onClick={(e) => handleInfo(account, e)}
                        title="Xem thông tin"
                        type="button"
                      >
                        ℹ️
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <Pagination
          page={page}
          total={total1}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
        />

        {/* Edit/Create Modal */}
        {showEditModal && (
          <div className="modal-backdrop-admin" onClick={handleBackdropClick}>
            <div
              className="modal-container-admin"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header-admin">
                <h2>
                  {selectedAccount
                    ? "Chỉnh Sửa Tài Khoản"
                    : "Tạo Tài Khoản Mới"}
                </h2>
                <button
                  className="close-btn-admin"
                  onClick={closeEditModal}
                  type="button"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="modal-form-admin">
                <div className="form-group-admin">
                  <label>Tên đăng nhập *</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) =>
                      setFormData({ ...formData, username: e.target.value })
                    }
                    required
                    disabled={!!selectedAccount}
                    placeholder="Nhập tên đăng nhập"
                    autoComplete="username"
                  />
                </div>

                <div className="form-group-admin">
                  <label>Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="Nhập email"
                    autoComplete="email"
                  />
                </div>

                <div className="form-group-admin">
                  <label>
                    {selectedAccount
                      ? "Mật khẩu mới (để trống nếu không đổi)"
                      : "Mật khẩu *"}
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    required={!selectedAccount}
                    placeholder={
                      selectedAccount ? "Nhập mật khẩu mới" : "Nhập mật khẩu"
                    }
                    autoComplete={
                      selectedAccount ? "new-password" : "current-password"
                    }
                  />
                </div>

                <div className="form-group-admin">
                  <label>Vai trò *</label>
                  <select
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value })
                    }
                    required
                  >
                    <option value="">Chọn vai trò</option>
                    <option value="Admin">Quản trị viên</option>
                    <option value="Doctor">Bác sĩ</option>
                    <option value="Patient">Bệnh nhân</option>
                    <option value="Staff">Nhân viên</option>
                    <option value="Manager">Quản lý</option>
                  </select>
                </div>

                <div className="form-group-admin">
                  <label>Trạng thái</label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                  >
                    <option value="ACTIVE">Hoạt động</option>
                    <option value="INACTIVE">Không hoạt động</option>
                    <option value="SUSPENDED">Tạm khóa</option>
                  </select>
                </div>

                <div className="modal-actions-admin">
                  <button
                    type="button"
                    className="btn-cancel-admin"
                    onClick={closeEditModal}
                  >
                    Hủy
                  </button>
                  <button type="submit" className="btn-save-admin">
                    {selectedAccount ? "Cập nhật" : "Tạo mới"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Info Modal */}
        {showInfoModal && selectedAccount && (
          <div className="modal-backdrop-admin" onClick={handleBackdropClick}>
            <div
              className="modal-container-admin"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header-admin">
                <h2>Thông Tin Tài Khoản</h2>
                <button
                  className="close-btn-admin"
                  onClick={closeInfoModal}
                  type="button"
                >
                  ✕
                </button>
              </div>

              <div className="modal-info-body-admin">
                <div className="info-section-admin">
                  <h3>Thông tin cơ bản</h3>
                  <div className="info-row-admin">
                    <span className="info-label-admin">ID:</span>
                    <span className="info-value-admin">
                      {selectedAccount.accountId}
                    </span>
                  </div>
                  <div className="info-row-admin">
                    <span className="info-label-admin">Tên đăng nhập:</span>
                    <span className="info-value-admin">
                      {selectedAccount.username}
                    </span>
                  </div>
                  <div className="info-row-admin">
                    <span className="info-label-admin">Email:</span>
                    <span className="info-value-admin">
                      {selectedAccount.email || "Chưa có"}
                    </span>
                  </div>
                  <div className="info-row-admin">
                    <span className="info-label-admin">Trạng thái:</span>
                    <span className="info-value-admin">
                      {getStatusBadge(selectedAccount.status)}
                    </span>
                  </div>
                  <div className="info-row-admin">
                    <span className="info-label-admin">Ngày tạo:</span>
                    <span className="info-value-admin">
                      {formatDate(selectedAccount.createdAt)}
                    </span>
                  </div>
                </div>

                {selectedAccount.user && (
                  <div className="info-section-admin">
                    <h3>Thông tin người dùng</h3>
                    <div className="info-row-admin">
                      <span className="info-label-admin">Họ và tên:</span>
                      <span className="info-value-admin">
                        {selectedAccount.user.fullName || "Chưa cập nhật"}
                      </span>
                    </div>
                    <div className="info-row-admin">
                      <span className="info-label-admin">Vai trò:</span>
                      <span className="info-value-admin">
                        {getRoleBadge(selectedAccount.user.role)}
                      </span>
                    </div>
                    <div className="info-row-admin">
                      <span className="info-label-admin">Số điện thoại:</span>
                      <span className="info-value-admin">
                        {selectedAccount.user.phone || "Chưa có"}
                      </span>
                    </div>
                    <div className="info-row-admin">
                      <span className="info-label-admin">
                        Trạng thái người dùng:
                      </span>
                      <span className="info-value-admin">
                        {getStatusBadge(selectedAccount.user.status)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-actions-admin">
                <button
                  type="button"
                  className="btn-cancel-admin"
                  onClick={closeInfoModal}
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
