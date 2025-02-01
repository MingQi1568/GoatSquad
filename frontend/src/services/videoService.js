import axios from 'axios';

const BASE_URL = process.env.REACT_APP_BACKEND_URL;

export const videoService = {
  vote: async (videoId, voteType) => {
    try {
      const response = await axios.post(
        `${BASE_URL}/api/videos/${videoId}/vote`,
        { type: voteType },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error voting:', error);
      throw error;
    }
  },

  getVotes: async (videoId) => {
    try {
      const response = await axios.get(
        `${BASE_URL}/api/videos/${videoId}/votes`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error getting votes:', error);
      throw error;
    }
  },

  getComments: async (videoId) => {
    try {
      const response = await axios.get(
        `${BASE_URL}/api/videos/${videoId}/comments`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error getting comments:', error);
      throw error;
    }
  },

  addComment: async (videoId, content) => {
    try {
      const response = await axios.post(
        `${BASE_URL}/api/videos/${videoId}/comments`,
        { content },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  },

  updateComment: async (commentId, content) => {
    try {
      const response = await axios.put(
        `${BASE_URL}/api/videos/comments/${commentId}`,
        { content },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error updating comment:', error);
      throw error;
    }
  },

  deleteComment: async (commentId) => {
    try {
      const response = await axios.delete(
        `${BASE_URL}/api/videos/comments/${commentId}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw error;
    }
  }
}; 