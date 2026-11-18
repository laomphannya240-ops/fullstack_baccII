import axios from 'axios';

export const TOKEN_KEY = 'bacii_studyhub.token';
export const USER_KEY = 'bacii_studyhub.user';

export const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api/v1',
    headers: {
        Accept: 'application/json',
    },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem(TOKEN_KEY);

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 && localStorage.getItem(TOKEN_KEY)) {
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
            window.dispatchEvent(new CustomEvent('auth:unauthorized'));
        }

        return Promise.reject(error);
    },
);

/**
 * @param {unknown} error
 * @returns {string}
 */
export function getErrorMessage(error) {
    if (error?.response?.data?.message) {
        return error.response.data.message;
    }

    const errors = error?.response?.data?.errors || error?.response?.data?.data;

    if (errors && typeof errors === 'object') {
        const firstField = Object.keys(errors)[0];
        const firstMessage = Array.isArray(errors[firstField]) ? errors[firstField][0] : errors[firstField];

        if (firstMessage) {
            return `${firstField}: ${firstMessage}`;
        }
    }

    return error?.message || 'Something went wrong. Please try again.';
}

/**
 * @param {import('axios').AxiosResponse} response
 */
export const get = (url, config) => api.get(url, config);
export const post = (url, data, config) => api.post(url, data, config);
export const put = (url, data, config) => api.put(url, data, config);
export const patch = (url, data, config) => api.patch(url, data, config);
export const del = (url, config) => api.delete(url, config);

export function unwrap(response) {
    return response.data?.data ?? response.data;
}

/**
 * @param {import('axios').AxiosResponse} response
 */
export function unwrapMeta(response) {
    return response.data?.meta ?? null;
}
