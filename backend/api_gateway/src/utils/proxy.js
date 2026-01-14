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

      // Forward request
      const response = await axios({
        method: req.method,
        url: targetUrl,
        data: req.body,
        headers: {
          'Authorization': req.headers.authorization,
          'Content-Type': req.headers['content-type']
        },
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