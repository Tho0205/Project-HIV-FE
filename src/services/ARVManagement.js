import React, { useEffect, useState } from "react";
import { Dialog } from "@headlessui/react";

function ARVManagement() {
  const [arvs, setArvs] = useState([]);
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", description: "", status: "ACTIVE" });
  const [editingId, setEditingId] = useState(null);

  const fetchARVs = async () => {
    try {
      const res = await fetch("http://localhost:7243/api/arv");
      const data = await res.json();
      setArvs(data);
    } catch (err) {
      console.error("Lỗi lấy ARV:", err);
    }
  };

  useEffect(() => {
    fetchARVs();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    await fetch("http://localhost:7243/api/arv", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    setIsOpen(false);
    setFormData({ name: "", description: "", status: "ACTIVE" });
    fetchARVs();
  };

  const handleUpdate = async (id, arv) => {
    await fetch(`http://localhost:7243/api/arv/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(arv),
    });
    setEditingId(null);
    fetchARVs();
  };

  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc muốn xóa không?")) {
      await fetch(`http://localhost:7243/api/arv/${id}`, { method: "DELETE" });
      fetchARVs();
    }
  };

  const filteredARVs = arvs.filter((arv) =>
    arv.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Quản lý ARV</h1>
        <button
          onClick={() => setIsOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          ➕ Thêm mới
        </button>
      </div>

      <input
        type="text"
        placeholder="Tìm kiếm theo tên..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4 px-4 py-2 border w-full rounded"
      />

      <table className="table-auto w-full border border-gray-300">
        <thead className="bg-gray-100">
          <tr>
            <th className="border px-4 py-2">Tên thuốc</th>
            <th className="border px-4 py-2">Mô tả</th>
            <th className="border px-4 py-2">Trạng thái</th>
            <th className="border px-4 py-2">Hành động</th>
          </tr>
        </thead>
        <tbody>
          {filteredARVs.map((arv) => (
            <tr key={arv.arvId} className="hover:bg-gray-50">
              <td className="border px-4 py-2">
                {editingId === arv.arvId ? (
                  <input
                    value={arv.name}
                    onChange={(e) =>
                      setArvs((prev) =>
                        prev.map((a) =>
                          a.arvId === arv.arvId ? { ...a, name: e.target.value } : a
                        )
                      )
                    }
                    className="border px-2 py-1 rounded w-full"
                  />
                ) : (
                  arv.name
                )}
              </td>
              <td className="border px-4 py-2">
                {editingId === arv.arvId ? (
                  <input
                    value={arv.description}
                    onChange={(e) =>
                      setArvs((prev) =>
                        prev.map((a) =>
                          a.arvId === arv.arvId ? { ...a, description: e.target.value } : a
                        )
                      )
                    }
                    className="border px-2 py-1 rounded w-full"
                  />
                ) : (
                  arv.description
                )}
              </td>
              <td className="border px-4 py-2">
                {editingId === arv.arvId ? (
                  <select
                    value={arv.status}
                    onChange={(e) =>
                      setArvs((prev) =>
                        prev.map((a) =>
                          a.arvId === arv.arvId ? { ...a, status: e.target.value } : a
                        )
                      )
                    }
                    className="border px-2 py-1 rounded"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                ) : (
                  arv.status
                )}
              </td>
              <td className="border px-4 py-2 space-x-2">
                {editingId === arv.arvId ? (
                  <>
                    <button
                      onClick={() => handleUpdate(arv.arvId, arv)}
                      className="text-green-600 hover:underline"
                    >
                      Lưu
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="text-gray-600 hover:underline"
                    >
                      Hủy
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setEditingId(arv.arvId)}
                      className="text-blue-600 hover:underline"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(arv.arvId)}
                      className="text-red-600 hover:underline"
                    >
                      Xóa
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal Thêm mới */}
      <Dialog open={isOpen} onClose={() => setIsOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-md rounded bg-white p-6 shadow-lg">
            <Dialog.Title className="text-lg font-bold mb-4">Thêm ARV mới</Dialog.Title>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Tên</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Mô tả</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Trạng thái</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Thêm
                </button>
              </div>
            </form>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}

export default ARVManagement;
