const API_BASE = '/api';

async function request(url, options = {}) {
  const config = {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  const res = await fetch(`${API_BASE}${url}`, config);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || 'API request failed');
  }

  return data;
}

// Tasks / Sessions
export const startTask = (data) => request('/tasks/start', { method: 'POST', body: data });
export const stopTask = (id, data) => request(`/tasks/${id}/stop`, { method: 'PUT', body: data });
export const getActiveTask = () => request('/tasks/active');
export const getTasks = (params = '') => request(`/tasks${params ? `?${params}` : ''}`);
export const createManualTask = (data) => request('/tasks/manual', { method: 'POST', body: data });
export const updateTask = (id, data) => request(`/tasks/${id}`, { method: 'PUT', body: data });
export const deleteTask = (id) => request(`/tasks/${id}`, { method: 'DELETE' });

// Discomforts (Break Reasons)
export const logDiscomfort = (data) => request('/discomforts', { method: 'POST', body: data });
export const getDiscomforts = (params = '') => request(`/discomforts${params ? `?${params}` : ''}`);
export const deleteDiscomfort = (id) => request(`/discomforts/${id}`, { method: 'DELETE' });

// Categories
export const getCategories = () => request('/categories');
export const createCategory = (data) => request('/categories', { method: 'POST', body: data });
export const updateCategory = (id, data) => request(`/categories/${id}`, { method: 'PUT', body: data });
export const deleteCategory = (id) => request(`/categories/${id}`, { method: 'DELETE' });

// Dashboard
export const getDashboardOverview = () => request('/dashboard/overview');
export const getDashboardChart = (view, date, customStart, customEnd) => {
  let url = `/dashboard/chart?view=${view}&date=${date}`;
  if (view === 'custom' && customStart && customEnd) {
    url += `&customStart=${customStart}&customEnd=${customEnd}`;
  }
  return request(url);
};
export const getCategorySummary = (startDate, endDate) =>
  request(`/dashboard/category-summary?startDate=${startDate}&endDate=${endDate}`);
export const getTaskSummary = (startDate, endDate) =>
  request(`/dashboard/task-summary?startDate=${startDate}&endDate=${endDate}`);
export const getFocusLogs = (page = 1, limit = 20) =>
  request(`/dashboard/focus-logs?page=${page}&limit=${limit}`);

export const getAdvancedMetrics = (startDate, endDate) =>
  request(`/dashboard/advanced-metrics?startDate=${startDate}&endDate=${endDate}`);

export const getDistractionAnalytics = (startDate, endDate) =>
  request(`/dashboard/distraction-analytics?startDate=${startDate}&endDate=${endDate}`);

// --- AI API ---
export const getAiInsights = () => request('/ai/insights');
