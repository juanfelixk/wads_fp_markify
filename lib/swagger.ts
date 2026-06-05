import swaggerJSDoc from "swagger-jsdoc";
import path from "path";

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
  apis: [path.join(process.cwd(), "app/api/**/*.ts")],
};

export const swaggerSpec = swaggerJSDoc(options);