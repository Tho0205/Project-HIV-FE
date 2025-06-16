import React from "react";

const ARVTable = ({ arvs, onEdit, onDelete }) => {
  return (
    <table className="arv-table">
      <thead className="bg-blue-100 text-blue-800">
        <tr>
          <th className="border px-4 py-2">ID</th>
          <th className="border px-4 py-2">Tên thuốc</th>
          <th className="border px-4 py-2">Mô tả</th>
          <th className="border px-4 py-2">Trạng thái</th>
          <th className="border px-4 py-2 text-center">Hành động</th>
        </tr>
      </thead>
      <tbody>
        {arvs.length > 0 ? (
          arvs.map((item) => (
            <tr key={item.arvId} className="hover:bg-gray-50">
              <td className="border px-4 py-2">{item.arvId}</td>
              <td className="border px-4 py-2">{item.name}</td>
              <td className="border px-4 py-2">{item.description}</td>
              <td className="border px-4 py-2">{item.status}</td>
              <td className="border px-4 py-2 text-center action-btn">
                <div className="arv-actions">
                  <button
                    onClick={() => onEdit(item)}
                    className="arv-action-btn edit"
                  >
                    ✏️ Sửa
                  </button>
                  <button
                    onClick={() => onDelete(item.arvId)}
                    className="arv-action-btn delete"
                  >
                    🗑️ Xóa
                  </button>
                </div>
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan="5" className="text-center py-4 text-gray-500">
              Không có dữ liệu.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
};

export default ARVTable;
