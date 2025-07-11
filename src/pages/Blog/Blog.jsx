import React, { useEffect, useState } from "react";
import "./Blog.css";
import { getAllBlogs } from "../../services/blogservice";
import { useNavigate } from "react-router-dom";

export default function Blog() {
  const [blogs, setBlogs] = useState([]);
  const [visibleCount, setVisibleCount] = useState(4);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getAllBlogs();
        const approved = data
          .filter((blog) => blog.isApproved === true)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); 
        setBlogs(approved);
      } catch (error) {
        console.error("Lỗi khi lấy danh sách blog:", error);
      }
    };

    fetchData();
  }, []);

  const getImageUrl = (imageUrl) => {
    if (!imageUrl || imageUrl.trim() === "") {
      return "/placeholder.svg?height=400&width=600";
    }
    if (imageUrl.startsWith("http")) {
      return imageUrl;
    }
    return `https://localhost:7243${imageUrl}`;
  };

  const handleShowMore = () => {
    setVisibleCount((prev) => prev + 4);
  };

  return (
    <div className="blog">
      <section className="sec">
        <h2 className="title">Bài viết mới nhất</h2>
        <div className="list">
          {blogs.length === 0 ? (
            <p>Chưa có bài viết nào được duyệt.</p>
          ) : (
            blogs.slice(0, visibleCount).map((blog) => (
              <div
                key={blog.blogId}
                className="card-blog"
                onClick={() => navigate(`/blog/${blog.blogId}`)}
                style={{ cursor: "pointer" }}
              >
                <img
                  className="img"
                  src={getImageUrl(blog.imageUrl)}
                  alt={blog.title}
                />

                <div className="info">
                  <span className="date">
                    {new Date(blog.createdAt).toLocaleDateString("vi-VN")}
                  </span>
                  <h3 className="name">{blog.title}</h3>
                </div>
              </div>
            ))
          )}
        </div>
        {visibleCount < blogs.length && (
          <div style={{ width: "100%", display: "flex", justifyContent: "center", marginTop: 24 }}>
            <button className="hiv-btn-outline" onClick={handleShowMore}>
              Xem thêm
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
