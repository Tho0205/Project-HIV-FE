import React, { useEffect, useState } from "react";
import ARVTable from "./ARVTable";
import ARVForm from "./ARVForm";

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
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold text-gray-800">📋 Quản lý thuốc ARV</h1>
        <button
          onClick={() => {
            setSelected(null);
            setFormVisible(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded shadow-md"
        >
          ➕ Thêm mới
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="🔍 Tìm kiếm theo tên thuốc..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full md:w-1/2 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {isFormVisible && (
        <div className="mb-6 p-6 bg-white rounded-xl shadow-lg border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">
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
      )}

      <div className="bg-white rounded-xl shadow-md overflow-x-auto border border-gray-200">
        <ARVTable arvs={filteredArvs} onDelete={handleDelete} onEdit={handleEdit} />
      </div>
    </div>
  );
};

export default ARVPage;
