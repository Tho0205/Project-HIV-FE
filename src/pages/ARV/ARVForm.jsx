import React, { useEffect, useState } from "react";

const ARVForm = ({ onSubmit, selected, onCancel }) => {
  const [formData, setFormData] = useState({
    arvId: 0,
    name: "",
    description: "",
    status: "ACTIVE",
  });

  useEffect(() => {
    if (selected) {
      setFormData(selected);
    } else {
      setFormData({
        arvId: 0,
        name: "",
        description: "",
        status: "ACTIVE",
      });
    }
  }, [selected]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="arv-form">
      <div>
        <label className="block font-medium mb-1">Tên thuốc ARV</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          className="w-full border border-gray-300 px-4 py-2 rounded-md"
          placeholder="Nhập tên thuốc..."
        />
      </div>

      <div>
        <label className="block font-medium mb-1">Mô tả</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={3}
          className="w-full border border-gray-300 px-4 py-2 rounded-md"
          placeholder="Nhập mô tả..."
        />
      </div>

      <div className="arv-modal-actions">
        <button
          type="button"
          onClick={onCancel}
          className="arv-btn-cancel"
        >
          Hủy
        </button>
        <button
          type="submit"
          className="arv-btn-submit"
        >
          {formData.arvId ? "Cập nhật" : "Thêm mới"}
        </button>
      </div>
    </form>
  );
};

export default ARVForm;
