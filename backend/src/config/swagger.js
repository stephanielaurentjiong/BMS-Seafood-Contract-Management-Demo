const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Shrimp Contract Management API",
      version: "1.0.0",
      description:
        "API documentation for the Shrimp Contract Management System",
      contact: {
        name: "API Support",
        email: "support@example.com",
      },
    },
    servers: [
      {
        url: "http://localhost:3001",
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./src/routes/*.js"], // Path to the API routes
};

const specs = swaggerJsdoc(options);

module.exports = specs;
