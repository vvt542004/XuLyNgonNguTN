import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:8000",
    timeout: 15000,
});

// create comment
export async function postComment({ username, content }) {
    const res = await api.post("/comments", { username, content });
    return res.data;
}

// get comments (returns { total, page, limit, items })
export async function getComments(status, page = 1, limit = 50) {
    const params = {};
    if (status) params.status = status;
    params.page = page;
    params.limit = limit;
    const res = await api.get("/comments", { params });
    return res.data;
}

export async function updateCommentStatus(id, data) {
    const res = await api.put(`/comments/${id}`, data);
    return res.data;
}

export async function deleteComment(id) {
    const res = await api.delete(`/comments/${id}`);
    return res.data;
}

export default api;
