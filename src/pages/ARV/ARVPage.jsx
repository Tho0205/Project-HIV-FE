import React, { useEffect, useState } from "react";
import "./ARVPage123.css";
import ARVTable from "./ARVTable";
import ARVForm from "./ARVForm";
import Sidebar from "../../components/Sidebar/Sidebar";
import { toast } from "react-toastify";

const API_BASE = "https://localhost:7243/api/arv";

const ARVPage = () => {
  const [arvs, setArvs] = useState([]);
  const [selected, setSelected] = useState(null);
  const [refresh, setRefresh] = useState(false);
  const [isFormVisible, setFormVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetch(API_BASE)
      .then((res) => res.json())
      .then(setArvs)
      .catch((err) => console.error("Lỗi khi lấy dữ liệu ARV:", err));
  }, [refresh]);

  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa thuốc này không?")) {
      await fetch(`${API_BASE}/${id}`, { method: "DELETE" });
      setRefresh(!refresh);
    }
  };

  const handleEdit = (item) => {
    setSelected(item);
    setFormVisible(true);
  };

  const handleSubmit = async (data) => {
    const method = data.arvId ? "PUT" : "POST";
    const url = data.arvId ? `${API_BASE}/${data.arvId}` : API_BASE;

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    setSelected(null);
    setFormVisible(false);
    setRefresh(!refresh);
  };

  const filteredArvs = arvs.filter((arv) =>
    arv.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="arv-wrapper">
      <Sidebar active="arv" />
      <div className="arv-content">
        <div className="arv-user-row">
          <div className="arv-user">
            <span className="arv-notification">
              🔔<span className="arv-dot"></span>
            </span>
            <img
              src="https://i.pravatar.cc/40?img=5"
              className="arv-avatar"
              alt="avatar"
            />
          </div>
        </div>
        <div className="arv-header">
          <div style={{ width: 120 }}></div>
          <h1 className="arv-title">📋 Quản lý thuốc ARV</h1>
          <button
            onClick={() => {
              setSelected(null);
              setFormVisible(true);
            }}
            className="arv-add-btn"
          >
            ➕ Thêm mới
          </button>
        </div>

        <div className="arv-search-box">
          <input
            type="text"
            placeholder="🔍 Tìm kiếm theo tên thuốc..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="arv-search-input"
          />
        </div>

        {isFormVisible && (
          <div className="arv-modal">
            <div className="arv-modal-content">
              <h2 style={{ color: "#257df4", marginBottom: 16 }}>
                {selected ? "✏️ Cập nhật thông tin thuốc" : "🆕 Thêm thuốc mới"}
              </h2>
              <ARVForm
                onSubmit={handleSubmit}
                selected={selected}
                onCancel={() => {
                  setSelected(null);
                  setFormVisible(false);
                }}
              />
            </div>
          </div>
        )}

        <div className="arv-table-container">
          <ARVTable
            arvs={filteredArvs}
            onDelete={handleDelete}
            onEdit={handleEdit}
          />
        </div>
      </div>
    </div>
  );
};

export default ARVPage;
