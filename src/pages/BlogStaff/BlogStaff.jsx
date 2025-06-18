import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getAllBlogs, 
  approveBlog, 
  deleteBlog,
} from '../../services/blogservice';
import Sidebar from "../../components/Sidebar/Sidebar";
import { toast } from 'react-toastify';
import './BlogStaff.css';

const BlogStaff = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentBlog, setCurrentBlog] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    imageUrl: '',
    status: 'Draft'
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedBlog, setSelectedBlog] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    setLoading(true);
    try {
      const data = await getAllBlogs();
      setBlogs(data);
    } catch (error) {
      toast.error('Lỗi khi tải danh sách bài viết');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };


  const handleEdit = (blog) => {
    setCurrentBlog(blog);
    setFormData({
      title: blog.title,
      content: blog.content,
      imageUrl: blog.imageUrl || '',
      status: blog.status || 'Draft'
    });
    setImagePreview(blog.imageUrl || '');
    setIsEditing(true);
  };

    const handleApprove = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn duyệt bài viết này không?')) {
        try {
        await approveBlog(id);
        toast.success('Duyệt bài viết thành công');
        // Cập nhật ngay lập tức mà không cần load lại toàn bộ
        setBlogs(blogs.map(blog => 
            blog.blogId === id ? { ...blog, isApproved: true } : blog
        ));
        } catch (error) {
        toast.error('Lỗi khi duyệt bài viết');
        console.error('Error:', error);
        }
    }
    };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa bài viết này?')) {
      try {
        await deleteBlog(id);
        toast.success('Xóa bài viết thành công');
        fetchBlogs();
      } catch (error) {
        toast.error('Lỗi khi xóa bài viết');
        console.error('Error:', error);
      }
    }
  };

  const handleViewDetails = (blog) => {
    setSelectedBlog(blog);
    setShowModal(true);
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
    <div className="blog-staff-container">
      <div className="sidebar-wrapper">
        <Sidebar active="blog" />
      </div>

      <div className="main-content">
        <h1 className="title">QUẢN LÝ BÀI VIẾT</h1>

        <div className="blog-list-section">
          {loading ? (
            <div className="loading">Đang tải...</div>
          ) : (
            <div className="blog-table-container">
              <table className="blog-table">
                <thead>
                  <tr>
                    <th>Blog ID</th>
                    <th>Tác giả</th>
                    <th>Tiêu đề</th>
                    <th>Ngày viết</th>
                    <th>Chi tiết</th>
                    <th>Xác nhận</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {blogs.map(blog => (
                    <tr key={blog.blogId}>
                      <td>{blog.blogId}</td>
                      <td>{blog.author || 'Chưa xác định'}</td>
                      <td>{blog.title}</td>
                      <td>{new Date(blog.createdAt).toLocaleDateString()}</td>
                      <td>
                        <button 
                          className="btn-detail"
                          onClick={() => handleViewDetails(blog)}
                        >
                          Xem chi tiết
                        </button>
                      </td>
                        <td>
                        {!blog.isApproved ? (
                            <button 
                            className="btn-confirm"
                            onClick={() => handleApprove(blog.blogId)}
                            >
                            Chờ xác nhận
                            </button>
                        ) : (
                            <span className="status-confirmed">Đã duyệt</span>
                        )}
                        </td>
                      <td className="action-buttons">
                        <button className="btn-delete" onClick={() => handleDelete(blog.blogId)}>
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Blog Detail Modal */}
        {/* Blog Detail Modal */}
        {showModal && selectedBlog && (
        <div className="modal-overlay">
            <div className="modal-content">
            <div className="modal-header">
                <h3>CHI TIẾT BÀI VIẾT</h3>
                <button 
                className="close-btn" 
                onClick={() => setShowModal(false)}
                >
                &times;
                </button>
            </div>
            
            <div className="blog-detail-container">
                
                <div className="form-group">
                <label>Tiêu đề</label>
                <div className="detail-value">{selectedBlog.title}</div>
                </div>     
                
                <div className="form-group">
                <label>Nội dung</label>
                <div className="detail-content">
                    {selectedBlog.content}
                </div>
                </div>
                
                {selectedBlog.imageUrl && (
                <div className="form-group">
                    <label>Ảnh bài viết</label>
                    <div className="image-preview">
                    <img src={getImageUrl(selectedBlog.imageUrl)} alt="Blog cover" />
                    </div>
                </div>
                )}
            </div>
            
            <div className="form-actions">
                <button 
                type="button" 
                className="btn cancel-btn"
                onClick={() => setShowModal(false)}
                >
                Đóng
                </button>
            </div>
            </div>
        </div>
        )}
    </div>
  );
};

export default BlogStaff;