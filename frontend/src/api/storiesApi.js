import axiosClient from './axiosClient';

export const storiesApi = {
  // User
  getStories: (params) =>
    axiosClient.get('/stories', { params }),

  getStory: (id) =>
    axiosClient.get(`/stories/${id}`),

  startStory: (id) =>
    axiosClient.post(`/stories/${id}/start`),

  submitAnswer: (id, data) =>
    axiosClient.post(`/stories/${id}/answer`, data),

  completeStory: (id) =>
    axiosClient.post(`/stories/${id}/complete`),

  // Admin
  getAdminStories: (params) =>
    axiosClient.get('/stories/admin', { params }),

  createStory: (data) =>
    axiosClient.post('/stories/admin', data),

  updateStory: (id, data) =>
    axiosClient.patch(`/stories/admin/${id}`, data),

  deleteStory: (id) =>
    axiosClient.delete(`/stories/admin/${id}`),

  publishStory: (id) =>
    axiosClient.post(`/stories/admin/${id}/publish`),

  draftStory: (id) =>
    axiosClient.post(`/stories/admin/${id}/draft`),

  generateStory: (data) =>
    axiosClient.post('/stories/admin/generate', data),

  checkSimilar: (title) =>
    axiosClient.get('/stories/admin/check-similar', { params: { title } }),
};