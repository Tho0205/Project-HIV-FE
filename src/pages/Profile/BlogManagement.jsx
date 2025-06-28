import React, { useState, useEffect } from "react";
import {
  getAllBlogs,
  createBlog,
  updateBlog,
  deleteBlog,
  uploadBlogImage,
} from "../../services/blogservice";
import SidebarProfile from "../../components/SidebarProfile/SidebarProfile";
import { tokenManager } from "../../services/account";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import "./BlogManagement.css";

const BlogManagement = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentBlog, setCurrentBlog] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    imageUrl: "",
  });

  // Lấy thông tin user
  const currentUserId = parseInt(tokenManager.getCurrentUserId());
  const currentUsername = tokenManager.getCurrentUserName() || "bạn";
  const role = tokenManager.getCurrentUserRole();

  const navigate = useNavigate();
  // Lấy danh sách blog
  useEffect(() => {
    if (role === null) {
      toast.error("Vui Lòng Đăng Nhập");
      return navigate("/login");
    }

    const fetchBlogs = async () => {
      try {
        setLoading(true);
        const allBlogs = await getAllBlogs();
        const myBlogs = allBlogs.filter(
          (blog) => blog.authorId === currentUserId
        );
        setBlogs(myBlogs);
      } catch (err) {
        setError("Không thể tải bài viết");
      } finally {
        setLoading(false);
      }
    };

    if (currentUserId) fetchBlogs();
    else setError("Vui lòng đăng nhập");
  }, [currentUserId]);

  // Xử lý filter
  const filteredBlogs = blogs.filter((blog) => {
    if (activeTab === "all") return true;
    if (activeTab === "approved") return blog.isApproved;
    if (activeTab === "pending") return !blog.isApproved;
    return true;
  });

  // Xử lý xóa blog
  const handleDelete = async (blogId) => {
    try {
      await deleteBlog(blogId);

      // Cập nhật state sau khi xóa thành công
      setBlogs((prevBlogs) =>
        prevBlogs.filter((blog) => blog.blogId !== blogId)
      );

      // Nếu đang xem chi tiết bài viết bị xóa, đóng modal
      if (currentBlog?.blogId === blogId) {
        setCurrentBlog(null);
        setShowModal(false);
      }

      // Hiển thị thông báo thành công (tuỳ chọn)
      setError(null);
    } catch (err) {
      console.error("Lỗi khi xóa bài viết:", err);
      setError("Xóa bài viết thất bại. Vui lòng thử lại.");
    }
  };
  // Xử lý tạo/chỉnh sửa blog
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let imageUrl = formData.imageUrl;

      if (selectedImage) {
        imageUrl = await uploadBlogImage(selectedImage);
      } else if (currentBlog) {
        imageUrl = currentBlog.imageUrl;
      }

      const blogData = {
        title: formData.title,
        content: formData.content,
        authorId: currentUserId,
        imageUrl: imageUrl || null,
      };

      if (currentBlog) {
        await updateBlog(currentBlog.blogId, blogData);
        toast.success("Cập Nhật Bài Viết Thành Công", { autoClose: 1000 });
      } else {
        await createBlog(blogData);
        toast.success("Thêm Bài Viết Thành Công", { autoClose: 1000 });
      }

      // Refresh danh sách
      const allBlogs = await getAllBlogs();
      setBlogs(allBlogs.filter((blog) => blog.authorId === currentUserId));

      setShowModal(false);
      setCurrentBlog(null);
      setFormData({
        title: "",
        content: "",
        imageUrl: "",
      });
      setError(null);
    } catch (err) {
      console.error("Lỗi khi lưu bài viết:", err);
      setError(
        "Lỗi khi lưu bài viết: " + (err.response?.data?.message || err.message)
      );
    }
  };

  // Xử lý khi chọn ảnh
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };
  const getImageUrl = (imageUrl) => {
    if (!imageUrl || imageUrl.trim() === "") {
      return "/placeholder.svg?height=400&width=600";
    }
    if (imageUrl.startsWith("http")) {
      return imageUrl;
    }
    return `https://localhost:7243${imageUrl}`;
  };

  return (
    <div className="container blog-management-page">
      <SidebarProfile />

      <div className="blog-content">
        <h2>Quản lý bài viết</h2>

        <div className="blog-tabs">
          <button
            className={`tab-btn ${activeTab === "all" ? "active" : ""}`}
            onClick={() => setActiveTab("all")}
          >
            Tất cả
          </button>
          <button
            className={`tab-btn ${activeTab === "approved" ? "active" : ""}`}
            onClick={() => setActiveTab("approved")}
          >
            Đã xác nhận
          </button>
          <button
            className={`tab-btn ${activeTab === "pending" ? "active" : ""}`}
            onClick={() => setActiveTab("pending")}
          >
            Chờ duyệt
          </button>
        </div>

        <button
          className="btn btn-green new-blog-btn"
          onClick={() => setShowModal(true)}
        >
          Thêm bài viết
        </button>

        {error && <div className="error-message">{error}</div>}

        <div className="blog-list">
          {loading ? (
            <div className="loading">Đang tải...</div>
          ) : filteredBlogs.length === 0 ? (
            <div className="empty-message">Không có bài viết</div>
          ) : (
            filteredBlogs.map((blog) => (
              <div key={blog.blogId} className="blog-card">
                <div className="blog-main">
                  <div className="blog-header">
                    <h3 className="blog-title">{blog.title}</h3>
                    <div className="blog-actions">
                      <button
                        className="edit-btn"
                        onClick={() => {
                          setCurrentBlog(blog);
                          setFormData({
                            title: blog.title,
                            content: blog.content,
                            imageUrl: blog.imageUrl || "",
                          });
                          setImagePreview(blog.imageUrl || "");
                          setSelectedImage(null);
                          setShowModal(true);
                        }}
                      >
                        Chỉnh sửa
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => {
                          if (
                            window.confirm(
                              "Bạn có chắc chắn muốn xóa bài viết này?"
                            )
                          ) {
                            handleDelete(blog.blogId);
                          }
                        }}
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                  <p className="blog-date">
                    {new Date(blog.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay1">
          <div className="modal-content1">
            <h3>{currentBlog ? "Edit Blog" : "New Blog"}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group1">
                <label>Tiêu đề</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-group1">
                <label>Nội dung</label>
                <textarea
                  name="content"
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  required
                  rows={8}
                />
              </div>
              <div className="form-group1">
                <label>Ảnh bài viết</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                />
                {(imagePreview || formData.imageUrl) && (
                  <div className="image-preview">
                    <img
                      src={getImageUrl(imagePreview || formData.imageUrl)}
                      alt="Preview"
                      style={{ maxWidth: "100%", maxHeight: "200px" }}
                    />
                  </div>
                )}
              </div>
              <div className="form-actions1">
                <button
                  type="button"
                  className="btn cancel-btn1"
                  onClick={() => setShowModal(false)}
                >
                  Hủy
                </button>
                <button type="submit" className="btn btn-green">
                  {currentBlog ? "Cập nhật" : "Đăng bài"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlogManagement;
