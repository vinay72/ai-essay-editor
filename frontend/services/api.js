// src/services/api.js
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const config = {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  async checkHealth() {
    return this.request('/health');
  }

  async getEssays(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/essays?${queryString}`);
  }

  async getEssay(id) {
    return this.request(`/essays/${id}`);
  }

  async evaluateEssay(essayData) {
    return this.request('/essays/evaluate', {
      method: 'POST',
      body: JSON.stringify(essayData),
    });
  }

  async updateEssay(id, updateData) {
    return this.request(`/essays/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  }

  async deleteEssay(id) {
    return this.request(`/essays/${id}`, {
      method: 'DELETE',
    });
  }

  async getStatistics() {
    return this.request('/stats');
  }
}

const apiService = new ApiService();
export default apiService;

export const {
  checkHealth,
  getEssays,
  getEssay,
  evaluateEssay,
  updateEssay,
  deleteEssay,
  getStatistics,
} = apiService;