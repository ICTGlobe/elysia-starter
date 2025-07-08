import swagger from "@elysiajs/swagger";
import Elysia from "elysia";

export const swaggerPlugin = (app: Elysia) =>
  app.use(
    swagger({
      path: "/swagger",
      exclude: [/\/api\/v1\/admin/],
      autoDarkMode: true,
      documentation: {
        info: {
          title: "ElysiaJS API",
          description: "ElysiaJS API Documentation 🚀",
          version: "1.0.0",
        },
        servers: [
          {
            url: "http://localhost:3000",
            description: "Local Development Server",
          },
          {
            url: "https://api.example.com", // TODO: Replace with your production URL
            description: "Production Server",
          }
        ]
      },
    })
  );
