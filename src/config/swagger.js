const swaggerUi = require('swagger-ui-express');

const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Grocery Delivery REST API',
    version: '1.0.0',
    description: 'Centralized production-ready REST API for Grocery Mobile Application & Admin Web Dashboard.'
  },
  servers: [
    {
      url: 'http://localhost:5000/api',
      description: 'Local Development Server'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    }
  },
  paths: {
    '/auth/login': {
      post: {
        summary: 'User & Admin Login',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string', example: 'admin@example.com' },
                  password: { type: 'string', example: 'Admin@123' }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Authenticated successfully with JWT & User object' },
          401: { description: 'Invalid credentials' }
        }
      }
    },
    '/products': {
      get: {
        summary: 'Get active grocery products with search & category filters',
        responses: {
          200: { description: 'List of grocery products' }
        }
      }
    },
    '/admin/orders': {
      get: {
        security: [{ bearerAuth: [] }],
        summary: 'Admin: Get all customer orders with filters and pagination',
        responses: {
          200: { description: 'List of all customer orders' },
          403: { description: 'Unauthorized / Admin access required' }
        }
      }
    },
    '/admin/dashboard': {
      get: {
        security: [{ bearerAuth: [] }],
        summary: 'Admin: Get summary metrics & statistics',
        responses: {
          200: { description: 'Dashboard metrics object' }
        }
      }
    }
  }
};

const setupSwagger = (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  console.log('Swagger API Documentation available at http://localhost:5000/api-docs');
};

module.exports = setupSwagger;
