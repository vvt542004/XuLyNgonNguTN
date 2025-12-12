import React, { useState, useEffect } from "react";
import {
    getComments,
    updateCommentStatus,
    deleteComment,
} from "../api/commentService";

import {
    CheckCircle,
    XCircle,
    Trash2,
    MessageSquare,
    Loader2,
} from "lucide-react";

export default function AdminDashboard() {
    const [filter, setFilter] = useState("pending");
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);

    const load = async (f) => {
        setLoading(true);
        try {
            const data = await getComments(f, 1, 100);
            setItems(data.items || []);
        } catch (err) {
            console.error(err);
            alert("Không thể tải danh sách bình luận");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load(filter);
    }, [filter]);

    const approve = async (id) => {
        try {
            await updateCommentStatus(id, { status: "approved" });
            setItems((prev) => prev.filter((c) => c._id !== id));
        } catch {
            alert("Không thể duyệt bình luận");
        }
    };

    const reject = async (id) => {
        try {
            await updateCommentStatus(id, { status: "rejected" });
            setItems((prev) => prev.filter((c) => c._id !== id));
        } catch {
            alert("Không thể từ chối bình luận");
        }
    };

    const remove = async (id) => {
        if (!window.confirm("Bạn có chắc muốn xóa bình luận này?")) return;

        try {
            await deleteComment(id);
            setItems((prev) => prev.filter((c) => c._id !== id));
        } catch {
            alert("Không thể xóa bình luận");
        }
    };

    /* ------------------------------ UI STYLE ------------------------------ */

    const tabBtn = (active) => ({
        padding: "10px 20px",
        marginRight: "12px",
        borderRadius: "10px",
        border: active ? "2px solid #2563eb" : "1px solid #d1d5db",
        background: active ? "#2563eb" : "#ffffff",
        color: active ? "#ffffff" : "#374151",
        cursor: "pointer",
        fontWeight: 600,
        fontSize: "15px",
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        transition: "0.25s",
    });

    const card = {
        background: "#ffffff",
        padding: "20px",
        borderRadius: "12px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        marginBottom: "18px",
    };

    const statusColors = {
        pending: "#fbbf24",
        approved: "#22c55e",
        rejected: "#ef4444",
    };

    const badge = {
        padding: "5px 12px",
        borderRadius: "8px",
        fontSize: "13px",
        fontWeight: 700,
        color: "white",
        display: "inline-block",
        background: statusColors[filter],
        marginBottom: "10px",
    };

    const actionBtn = (color) => ({
        padding: "8px 14px",
        borderRadius: "8px",
        border: "none",
        cursor: "pointer",
        color: "white",
        fontWeight: 600,
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        marginRight: "8px",
        background: color,
        transition: "0.2s",
    });

    return (
        <div style={{ padding: 10 }}>
            <h2
                style={{
                    marginBottom: 20,
                    color: "#1e3a8a",
                    fontWeight: 700,
                    fontSize: 26,
                }}
            >
                Quản lý bình luận
            </h2>

            {/* --------------------- FILTER TABS --------------------- */}
            <div style={{ marginBottom: 20 }}>
                <button
                    style={tabBtn(filter === "pending")}
                    onClick={() => setFilter("pending")}
                >
                    <MessageSquare size={18} />
                    Chờ duyệt
                </button>

                <button
                    style={tabBtn(filter === "approved")}
                    onClick={() => setFilter("approved")}
                >
                    <CheckCircle size={18} />
                    Đã duyệt
                </button>

                <button
                    style={tabBtn(filter === "rejected")}
                    onClick={() => setFilter("rejected")}
                >
                    <XCircle size={18} />
                    Đã từ chối
                </button>
            </div>

            {/* LOADING */}
            {loading && (
                <div
                    style={{
                        marginBottom: 20,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        color: "#374151",
                    }}
                >
                    <Loader2 size={20} className="spin" />
                    Đang tải dữ liệu...
                </div>
            )}

            {/* --------------------- COMMENT LIST --------------------- */}
            {items.map((c) => (
                <div key={c._id} style={card}>
                    <div style={badge}>
                        {filter === "pending"
                            ? "CHỜ DUYỆT"
                            : filter === "approved"
                                ? "ĐÃ DUYỆT"
                                : "ĐÃ TỪ CHỐI"}
                    </div>

                    <div style={{ fontWeight: 700, fontSize: 17 }}>{c.username}</div>
                    <div style={{ marginTop: 6, marginBottom: 10 }}>{c.content}</div>

                    <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 10 }}>
                        Nhãn dự đoán:{" "}
                        <strong>{c.predicted_label}</strong> — độ tin cậy:{" "}
                        {c.confidence ? Math.round(c.confidence * 100) : 0}%
                    </div>

                    {/* ACTION BUTTONS */}
                    <div>
                        {filter !== "approved" && (
                            <button
                                style={actionBtn("#22c55e")}
                                onClick={() => approve(c._id)}
                            >
                                <CheckCircle size={16} />
                                Duyệt
                            </button>
                        )}

                        {filter !== "rejected" && (
                            <button
                                style={actionBtn("#ef4444")}
                                onClick={() => reject(c._id)}
                            >
                                <XCircle size={16} />
                                Từ chối
                            </button>
                        )}

                        <button
                            style={actionBtn("#6b7280")}
                            onClick={() => remove(c._id)}
                        >
                            <Trash2 size={16} />
                            Xóa
                        </button>
                    </div>
                </div>
            ))}

            {/* EMPTY */}
            {!loading && items.length === 0 && (
                <div style={{ color: "#6b7280", marginTop: 20 }}>
                    Không có bình luận nào trong mục này.
                </div>
            )}
        </div>
    );
}
