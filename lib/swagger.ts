import swaggerJSDoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Markify API",
      version: "1.0.0",
      description: "API documentation for Markify",
    },
    servers: [
      {
        url: "http://localhost:3000/api",
      },
    ],
  },
  apis: ["app/api/**/*.ts"],
};

export const swaggerSpec = swaggerJSDoc(options);