import React from "react";

const ARVProtocolTable = ({ protocols, onEdit, onDelete }) => {
  return (
    <table className="table-auto w-full text-sm text-left">
      <thead className="bg-gray-100">
        <tr>
          <th className="border px-4 py-2">ID</th>
          <th className="border px-4 py-2">Tên Giao Thức</th>
          <th className="border px-4 py-2">Hành động</th>
        </tr>
      </thead>
      <tbody>
        {protocols.map((item) => (
          <tr key={item.protocolId} className="hover:bg-gray-50">
            <td className="border px-4 py-2">{item.protocolId}</td>
            <td className="border px-4 py-2">{item.name}</td>
            <td className="border px-4 py-2 space-x-2">
              <button
                onClick={() => onEdit(item)}
                className="text-blue-600 hover:underline"
              >
                ✏️ Sửa
              </button>
              <button
                onClick={() => onDelete(item.protocolId)}
                className="text-red-600 hover:underline"
              >
                🗑️ Xóa
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default ARVProtocolTable;
