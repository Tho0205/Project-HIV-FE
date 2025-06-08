"use client";

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getBlogById, getAllBlogs } from "../../services/blogservice";
import { useNavigate } from "react-router-dom";
import "./BlogDetail.css";

export default function BlogDetail() {
  const { id } = useParams();
  const [blog, setBlog] = useState(null);
  const [latestBlogs, setLatestBlogs] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    getBlogById(id)
      .then(setBlog)
      .catch(() => setBlog(null));
  }, [id]);

  useEffect(() => {
    getAllBlogs()
      .then((data) => {
        const approved = data.filter((b) => b.isApproved);
        setLatestBlogs(approved);
      })
      .catch(() => setLatestBlogs([]));
  }, []);

  if (!blog) {
    return (
      <div className="blog-detail">
        <div className="loading">Đang tải bài viết...</div>
      </div>
    );
  }

  return (
    <div className="blog-detail">
      <article className="article">
        <header className="article-header">
          <h1 className="article-title">{blog.title}</h1>
          <div className="meta">
            <span>{blog.author} |</span>
            <span>{new Date(blog.createdAt).toLocaleDateString("vi-VN")}</span>
          </div>
        </header>
        <div className="article-img">
          <img
            src={
              blog.imageUrl && blog.imageUrl.trim() !== ""
                ? blog.imageUrl
                : "/placeholder.svg?height=400&width=600"
            }
            alt={blog.title}
          />
        </div>
        <div className="article-content">
          {blog.content
            .split("\n")
            .map((p, i) => p.trim() && <p key={i}>{p}</p>)}
        </div>
      </article>

      {/* Đây là phần của các bài viết mới nhất bên cạnh bài viết chi tiết. */}
      <aside className="related">
        <h1>Bài viết mới nhất</h1>
        <div className="related-list">
          {latestBlogs.length === 0 ? (
            <p>Chưa có bài viết nào được duyệt.</p>
          ) : (
            latestBlogs.map((a) => (
              <div
                key={a.blogId}
                className="related-item"
                onClick={() => navigate(`/blog/${a.blogId}`)}
                style={{ cursor: "pointer" }}
              >
                <img
                  src={
                    a.imageUrl && a.imageUrl.trim() !== ""
                      ? a.imageUrl
                      : "/placeholder.svg?height=80&width=80"
                  }
                  alt={a.title}
                  className="related-img"
                />
                <div>
                  <div className="meta">
                    <span>{a.author} |</span>
                    <span>
                      {new Date(a.createdAt).toLocaleDateString("vi-VN")}
                    </span>
                  </div>
                  <h3 className="related-title">{a.title}</h3>
                </div>
              </div>
            ))
          )}
        </div>
      </aside>
    </div>
  );
}
