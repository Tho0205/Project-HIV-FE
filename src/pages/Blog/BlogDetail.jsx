"use client";

import { use, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getBlogById, getAllBlogs } from "../../services/blogservice";
import { useNavigate } from "react-router-dom";
import { getCommentsByBlogId, addComment } from "../../services/commentservice";
import { tokenManager } from "../../services/account";
import "./BlogDetail.css";

export default function BlogDetail() {
  const { id } = useParams();
  const [blog, setBlog] = useState(null);
  const [latestBlogs, setLatestBlogs] = useState([]);
  const [visibleCount, setVisibleCount] = useState(4);
  const navigate = useNavigate();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [visibleComments, setVisibleComments] = useState(4);

  useEffect(() => {
    const accountId = tokenManager.getCurrentAccountId();
    const username = tokenManager.getCurrentUserName();

    if (accountId && username) {
      setCurrentUser({
        userId: parseInt(accountId),
        username: username,
      });
    }
  }, []);

  useEffect(() => {
    if (id) {
      getCommentsByBlogId(id)
        .then(setComments)
        .catch(() => setComments([]));
    }
  }, [id]);

const handleAddComment = async () => {
  if (!newComment.trim() || !currentUser) return;
  const commentDto = {
    blogId: parseInt(id),
    content: newComment.trim(),
    userId: currentUser.userId,
  };

  try {
    const added = await addComment(commentDto);
    setComments((prev) => [...prev, added]);
    setNewComment("");
    window.location.reload();
  } catch (error) {
    console.error("Error adding comment:", error);
    alert("Không thể thêm bình luận. Vui lòng thử lại sau.");
  }
};

  useEffect(() => {
    getBlogById(id)
      .then(setBlog)
      .catch(() => setBlog(null));
  }, [id]);

    useEffect(() => {
      getAllBlogs()
        .then((data) => {
          const approved = data
            .filter((b) => b.isApproved)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); 
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
          <img src={getImageUrl(blog.imageUrl)} alt={blog.title} />
        </div>
        <div className="article-content">
          {blog.content
            .split("\n")
            .map((p, i) => p.trim() && <p key={i}>{p}</p>)}
        </div>
      </article>

      {/* Phần bình luận */}
      <section className="comments-section">
        <h2>Bình luận</h2>

        {currentUser ? (
          <div className="comment-form">
            <textarea
              placeholder="Nhập bình luận..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
            <button onClick={handleAddComment} className="btn">
              Gửi
            </button>
          </div>
        ) : (
          <p className="comment-accept">
            Vui lòng <a href="/login">đăng nhập</a> để bình luận.
          </p>
        )}

        <div className="comments-list">
          {comments.length === 0 ? (
            <p>Chưa có bình luận nào.</p>
          ) : (
            comments.slice(0, visibleComments).map((c, i) => (
              <div key={i} className="comment-item">
                <div className="comment-meta">
                  <strong>{c.user}</strong> -{" "}
                  <small>
                    {new Date(c.createdAt).toLocaleDateString("vi-VN")}
                  </small>
                </div>
                <p>{c.content}</p>
              </div>
            ))
          )}
        </div>
        {visibleComments < comments.length && (
          <div className="load-more">
            <button
              className="btn"
              onClick={() => setVisibleComments((prev) => prev + 4)}
            >
              Xem thêm
            </button>
          </div>
        )}
      </section>

      {/* Danh sách các bài viết mới nhất */}
      <aside className="related">
        <h1>Bài viết mới nhất</h1>
        <div className="related-list">
          {latestBlogs.length === 0 ? (
            <p>Chưa có bài viết nào được duyệt.</p>
          ) : (
            latestBlogs.slice(0, visibleCount).map((a) => (
              <div
                key={a.blogId}
                className="related-item"
                onClick={() => (window.location.href = `/blog/${a.blogId}`)}
                style={{ cursor: "pointer" }}
              >
                <img
                  className="related-img"
                  src={getImageUrl(a.imageUrl)}
                  alt={a.title}
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
        {visibleCount < latestBlogs.length && (
          <div style={{ width: "100%", display: "flex", justifyContent: "center", marginTop: 24 }}>
            <button className="hiv-btn-outline" onClick={handleShowMore}>
              Xem thêm
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}
