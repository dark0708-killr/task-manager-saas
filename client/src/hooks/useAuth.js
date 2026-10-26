import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:4000/api/v1';

// Configure axios defaults
axios.defaults.withCredentials = true;

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const response = await axios.get(`${API_URL}/auth/me`, {
            headers: {
              Authorization: `Bearer ${storedToken}`,
            },
          });
          setUser(response.data.data.user);
          setToken(storedToken);
        } catch (error) {
          localStorage.removeItem('token');
          setUser(null);
          setToken(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
      });

      const { token: newToken, data } = response.data;
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(data.user);

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Login failed',
      };
    }
  };

  const register = async (name, email, password, passwordConfirm) => {
    try {
      const response = await axios.post(`${API_URL}/auth/register`, {
        name,
        email,
        password,
        passwordConfirm,
      });

      const { token: newToken, data } = response.data;
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(data.user);

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Registration failed',
      };
    }
  };

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
    setToken(null);
  }, []);

  const updateProfile = async (data) => {
    try {
      const response = await axios.patch(
        `${API_URL}/users/me`,
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setUser(response.data.data.user);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Update failed',
      };
    }
  };

  const updatePassword = async (currentPassword, password, passwordConfirm) => {
    try {
      const response = await axios.patch(
        `${API_URL}/auth/update-password`,
        {
          passwordCurrent: currentPassword,
          password,
          passwordConfirm,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setUser(response.data.data.user);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Password update failed',
      };
    }
  };

  return {
    user,
    token,
    loading,
    login,
    register,
    logout,
    updateProfile,
    updatePassword,
    isAuthenticated: !!user,
  };
};