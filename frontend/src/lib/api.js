import axios from 'axios';

const api = axios.create({
    baseURL: 'http://127.0.0.1:8000',
});

// GET /chats
export const getChats = async () => {
    const response = await api.get('/chats');
    return response.data;
};

// POST /chats
export const createChat = async () => {
    const response = await api.post('/chats');
    return response.data;
};

// PATCH /chats/{id}
export const updateChatTitle = async (id, title) => {
    const response = await api.patch(`/chats/${id}`, { title });
    return response.data;
};

// DELETE /chats/{id}
export const deleteChat = async (id) => {
    await api.delete(`/chats/${id}`);
};

// GET /chats/{id}/history
export const getChatHistory = async (id) => {
    const response = await api.get(`/chats/${id}/history`);
    return response.data;
};

// POST /chats/{id}/message
export const sendMessage = async (id, text, useHistory = true, model = 'gemma3:1b') => {
    const response = await api.post(`/chats/${id}/message`, {
        user_message: text,
        use_history: useHistory,
        model: model
    });
    return response.data;
};

// POST /chats/{id}/upload
export const uploadDocuments = async (id, files) => {
    const formData = new FormData();
    // In FastAPI, to receive a list of files, we should append them with the same key
    files.forEach(file => {
        formData.append('files', file);
    });
    const response = await api.post(`/chats/${id}/upload`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

// GET /chats/{id}/documents
export const getDocuments = async (id) => {
    const response = await api.get(`/chats/${id}/documents`);
    return response.data;
};

// DELETE /chats/{id}/documents/{docId}
export const deleteDocument = async (chatId, docId) => {
    await api.delete(`/chats/${chatId}/documents/${docId}`);
};

// POST /transcribe
export const transcribeAudio = async (audioBlob) => {
    const formData = new FormData();
    // Create a filename for the blob
    formData.append('file', audioBlob, 'recording.webm');

    const response = await api.post('/transcribe', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

export default api;
