const axios = require('axios');

/**
 * Tạo proxy handler động cho một service
 * @param {string} serviceUrl - URL của backend service (vd: http://localhost:8080)
 * @param {string} pathPrefix - Prefix cần bỏ khi forward (vd: /api/auth)
 * @param {string} targetPrefix - Prefix của service backend (vd: /auth)
 */
const createProxyHandler = (serviceUrl, pathPrefix, targetPrefix = '') => {
  return async (req, res) => {
    try {
      // Tính toán đường dẫn đích
      const targetPath = req.originalUrl.replace(pathPrefix, targetPrefix);
      const targetUrl = `${serviceUrl}${targetPath}`;

      console.log(`[PROXY] ${req.method} ${req.originalUrl} -> ${targetUrl}`);

      // Chuẩn bị headers
      const headers = {
        'Authorization': req.headers.authorization, // Bearer token (nếu có)
        'Content-Type': req.headers['content-type']  // application/json
      };

      // Forward userId và user info qua custom headers
      if (req.user) {
        headers['X-User-Id'] = req.user.userId || req.user.id;
        headers['X-User-Email'] = req.user.email;
        headers['X-User-Role'] = req.user.role || 'user';
        
        // DEBUG LOG
        console.log('[PROXY] Forwarding user info:', {
          userId: headers['X-User-Id'],
          email: headers['X-User-Email']
        });
      }

      // Forward request by using axios
      const response = await axios({
        method: req.method,
        url: targetUrl,
        data: req.body,
        headers: headers,
        params: req.query,
        timeout: 10000
      });

      // Trả về response
      res.status(response.status).json(response.data);

    } catch (error) {
      console.error(`[PROXY ERROR] ${req.method} ${req.originalUrl}:`, error.message);
      
      if (error.response) {
        // Lỗi từ backend service
        res.status(error.response.status).json(error.response.data);
      } else if (error.code === 'ECONNREFUSED') {
        // Service không chạy
        res.status(503).json({ 
          error: 'Service unavailable',
          message: `Cannot connect to service at ${serviceUrl}`
        });
      } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
        // Timeout
        res.status(504).json({ 
          error: 'Gateway timeout',
          message: 'Service took too long to respond'
        });
      } else {
        // Lỗi khác
        res.status(500).json({ 
          error: 'Proxy error',
          message: error.message 
        });
      }
    }
  };
};

module.exports = { createProxyHandler };