import React, { useEffect, useState } from "react";
import "./Blog.css";
import { getAllBlogs } from "../../services/blogservice";

export default function Blog() {
  const [blogs, setBlogs] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getAllBlogs();
        // Lọc những bài đã duyệt nếu muốn
        const approved = data.filter((blog) => blog.isApproved === true); 
        setBlogs(approved);
      } catch (error) {
        console.error("Lỗi khi lấy danh sách blog:", error);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="blog">
      <section className="sec">
        <h2 className="title">Bài viết mới nhất</h2>
        <div className="list">
          {blogs.length === 0 ? (
            <p>Chưa có bài viết nào được duyệt.</p>
          ) : (
            blogs.map((blog) => (
              <div key={blog.blogId} className="card">
              <img
                className="img"
                src={
                  blog.imageUrl && blog.imageUrl.trim() !== ""
                    ? blog.imageUrl
                    : "/placeholder.svg?height=200&width=300"
                }
                alt={blog.title}
              />
                <div className="info">
                  <span className="date">
                    {new Date(blog.createdAt).toLocaleDateString("vi-VN")}
                  </span>
                  <h3 className="name">{blog.title}</h3>
                  <p className="preview">
                    {blog.content.length > 100
                      ? blog.content.substring(0, 100) + "..."
                      : blog.content}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
        <button className="btn">Xem thêm</button>
      </section>
    </div>
  );
}
