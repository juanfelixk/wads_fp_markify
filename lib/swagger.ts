import swaggerJSDoc from "swagger-jsdoc";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL

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
        url: `${baseUrl}/api`,
      },
    ],
  },
  apis: ["app/api/**/*.ts"],
};

export const swaggerSpec = swaggerJSDoc(options);