import axios from 'axios';
import api from './api';

// Mock axios
jest.mock('axios');

describe('API Service', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Clear localStorage before each test
    localStorage.clear();
  });

  test('creates axios instance with correct base URL', () => {
    expect(api.defaults.baseURL).toBe('http://localhost:9001/api');
  });

  test('adds authorization header when token exists', async () => {
    // Set up a mock token
    const mockToken = 'test-token';
    localStorage.setItem('token', mockToken);

    // Mock successful API call
    axios.create.mockReturnValue({
      request: jest.fn().mockResolvedValue({ data: {} }),
      defaults: { baseURL: 'http://localhost:9001/api' },
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() }
      }
    });

    // Make a request
    await api.get('/test');

    // Verify authorization header was added
    expect(api.interceptors.request.use).toHaveBeenCalled();
    const requestInterceptor = api.interceptors.request.use.mock.calls[0][0];
    const config = { headers: {} };
    const modifiedConfig = requestInterceptor(config);
    expect(modifiedConfig.headers.Authorization).toBe(`Bearer ${mockToken}`);
  });

  test('does not add Content-Type header for FormData', async () => {
    const formData = new FormData();
    formData.append('test', 'value');

    // Mock successful API call
    axios.create.mockReturnValue({
      post: jest.fn().mockResolvedValue({ data: {} }),
      defaults: { baseURL: 'http://localhost:9001/api' },
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() }
      }
    });

    // Make a request with FormData
    await api.post('/test', formData);

    // Verify Content-Type was not set
    expect(api.interceptors.request.use).toHaveBeenCalled();
    const requestInterceptor = api.interceptors.request.use.mock.calls[0][0];
    const config = { 
      headers: {},
      data: formData
    };
    const modifiedConfig = requestInterceptor(config);
    expect(modifiedConfig.headers['Content-Type']).toBeUndefined();
  });

  test('adds Content-Type header for JSON data', async () => {
    const jsonData = { test: 'value' };

    // Mock successful API call
    axios.create.mockReturnValue({
      post: jest.fn().mockResolvedValue({ data: {} }),
      defaults: { baseURL: 'http://localhost:9001/api' },
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() }
      }
    });

    // Make a request with JSON data
    await api.post('/test', jsonData);

    // Verify Content-Type was set correctly
    expect(api.interceptors.request.use).toHaveBeenCalled();
    const requestInterceptor = api.interceptors.request.use.mock.calls[0][0];
    const config = { 
      headers: {},
      data: jsonData
    };
    const modifiedConfig = requestInterceptor(config);
    expect(modifiedConfig.headers['Content-Type']).toBe('application/json');
  });

  test('handles 401 unauthorized error', async () => {
    // Mock window.location
    const mockLocation = { href: '' };
    Object.defineProperty(window, 'location', {
      value: mockLocation,
      writable: true
    });

    // Mock failed API call with 401
    const error = {
      response: {
        status: 401,
        data: { message: 'Unauthorized' }
      }
    };

    // Get the response interceptor
    const responseInterceptor = api.interceptors.response.use.mock.calls[0][1];
    
    // Call the interceptor with the error
    await responseInterceptor(error).catch(() => {});

    // Verify token was removed and redirect happened
    expect(localStorage.getItem('token')).toBeNull();
    expect(window.location.href).toBe('/login');
  });

  test('handles network errors', async () => {
    // Mock console.error
    const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

    // Mock network error
    const error = new Error('Network Error');

    // Get the response interceptor
    const responseInterceptor = api.interceptors.response.use.mock.calls[0][1];
    
    // Call the interceptor with the error
    await responseInterceptor(error).catch(() => {});

    // Verify error was logged
    expect(mockConsoleError).toHaveBeenCalled();

    // Cleanup
    mockConsoleError.mockRestore();
  });

  test('handles successful responses', async () => {
    const mockResponse = { data: { success: true } };

    // Get the response interceptor
    const responseInterceptor = api.interceptors.response.use.mock.calls[0][0];
    
    // Call the interceptor with the response
    const result = await responseInterceptor(mockResponse);

    // Verify response was passed through unchanged
    expect(result).toBe(mockResponse);
  });
}); 