import React, { useState, useEffect } from "react";
import { postComment, getComments } from "../api/commentService";

// ICONS
const SendIcon = () => (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="m22 2-7 20-4-9-9-4 20-7z" />
    </svg>
);

const UserIcon = () => (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <circle cx="12" cy="7" r="4" />
        <path d="M5.5 21a6.5 6.5 0 0 1 13 0" />
    </svg>
);

/* -------------------- COMMENT FORM -------------------- */
function CommentForm({ onPosted }) {
    const [username, setUsername] = useState("");
    const [content, setContent] = useState("");
    const [loading, setLoading] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        if (!username.trim() || !content.trim()) {
            alert("Vui lòng nhập tên và bình luận");
            return;
        }
        setLoading(true);

        try {
            await postComment({
                username: username.trim(),
                content: content.trim(),
            });

            setUsername("");
            setContent("");

            onPosted && onPosted();
        } catch (err) {
            console.error(err);
            alert("Không thể gửi bình luận");
        } finally {
            setLoading(false);
        }
    };

    const box = {
        background: "var(--card-bg)",
        padding: "24px",
        borderRadius: "12px",
        boxShadow: "var(--shadow)",
        marginBottom: "28px",
        transition: "0.25s",
    };

    const label = {
        fontWeight: 600,
        marginBottom: "6px",
        display: "block",
        color: "var(--text-color)",
    };

    const input = {
        width: "100%",
        padding: "12px",
        borderRadius: "8px",
        border: "1px solid var(--border)",
        background: "var(--input-bg)",
        color: "var(--text-color)",
        marginBottom: "14px",
        outline: "none",
        fontSize: "15px",
        transition: "0.25s",
    };

    const textarea = {
        ...input,
        minHeight: "110px",
        resize: "vertical",
    };

    const button = {
        padding: "10px 18px",
        background: "#2563eb",
        color: "white",
        border: "none",
        borderRadius: "8px",
        cursor: "pointer",
        fontSize: "15px",
        fontWeight: 600,
        display: "flex",
        alignItems: "center",
        gap: "8px",
        transition: "0.2s",
    };

    return (
        <form onSubmit={submit} style={box}>
            <h3
                style={{
                    marginBottom: "18px",
                    color: "var(--text-color)",
                    fontWeight: "700",
                }}
            >
                Viết bình luận
            </h3>

            <label style={label}>Tên của bạn</label>
            <input
                style={input}
                value={username}
                placeholder="Nhập tên..."
                onChange={(e) => setUsername(e.target.value)}
            />

            <label style={label}>Nội dung bình luận</label>
            <textarea
                style={textarea}
                value={content}
                placeholder="Nhập bình luận..."
                onChange={(e) => setContent(e.target.value)}
            />

            <button type="submit" style={button} disabled={loading}>
                <SendIcon />
                {loading ? "Đang gửi..." : "Gửi bình luận"}
            </button>
        </form>
    );
}

/* -------------------- COMMENT LIST -------------------- */
function CommentList({ refreshKey }) {
    const [items, setItems] = useState([]);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await getComments("approved");
                setItems(data.items || []);
            } catch (err) {
                console.error(err);
            }
        };
        load();
    }, [refreshKey]);

    const box = {
        background: "var(--card-bg)",
        padding: "18px",
        borderRadius: "10px",
        boxShadow: "var(--shadow)",
        marginBottom: "14px",
        transition: "0.25s",
    };

    return (
        <div>
            <h3
                style={{
                    marginBottom: "16px",
                    color: "var(--text-color)",
                    fontWeight: "700",
                }}
            >
                Bình luận đã được duyệt
            </h3>

            {items.length === 0 && (
                <div style={{ padding: "12px", color: "var(--text-light)" }}>
                    Chưa có bình luận nào.
                </div>
            )}

            {items.map((c) => (
                <div key={c._id} style={box}>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            fontWeight: 700,
                            color: "var(--text-color)",
                        }}
                    >
                        <UserIcon />
                        {c.username}
                    </div>

                    <p style={{ marginTop: "6px", marginBottom: "6px", lineHeight: "1.5" }}>
                        {c.content}
                    </p>

                    <small style={{ color: "var(--text-light)" }}>
                        {new Date(c.created_at).toLocaleString("vi-VN")}
                    </small>
                </div>
            ))}
        </div>
    );
}

/* -------------------- MAIN COMPONENT -------------------- */
export default function UserView() {
    const [refreshKey, setRefreshKey] = useState(0);

    // CSS VARIABLES FOR THEME (tự động lấy từ App.js)
    useEffect(() => {
        const root = document.documentElement;
        const dark = window.matchMedia("(prefers-color-scheme: dark)").matches;

        // Variables sẽ được App.js ghi đè bằng theme thực tế
        root.style.setProperty("--card-bg", dark ? "#1f2937" : "white");
        root.style.setProperty("--text-color", dark ? "#f3f4f6" : "#1f2937");
        root.style.setProperty("--text-light", dark ? "#9ca3af" : "#6b7280");
        root.style.setProperty("--border", dark ? "#374151" : "#d1d5db");
        root.style.setProperty("--input-bg", dark ? "#111827" : "white");
        root.style.setProperty("--shadow", dark ? "0 4px 20px rgba(0,0,0,0.55)" : "0 4px 12px rgba(0,0,0,0.08)");
    }, []);

    return (
        <div style={{ padding: "10px" }}>
            <h2
                style={{
                    marginBottom: "22px",
                    color: "var(--text-color)",
                    fontWeight: "800",
                    textAlign: "center",
                }}
            >
                Trang bình luận của người dùng
            </h2>

            <CommentForm onPosted={() => setRefreshKey((k) => k + 1)} />
            <CommentList refreshKey={refreshKey} />
        </div>
    );
}
