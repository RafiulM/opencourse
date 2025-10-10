import express from "express"
import cors from "cors"
import helmet from "helmet"
import morgan from "morgan"
import "dotenv/config"
import { toNodeHandler } from "better-auth/node"
import { auth } from "./lib/auth"
import swaggerUi from "swagger-ui-express"
import swaggerJSDoc from "swagger-jsdoc"
import basicAuth from "express-basic-auth"

// Import routes
import apiRouter from "./routes/index"

// Import error handling middleware
import { errorHandler, notFoundHandler } from "./middleware/errorHandler"

const app = express()
const PORT = process.env.PORT || 5000

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "OpenCourse API",
      version: "1.0.0",
      description:
        "API documentation for OpenCourse - an online learning platform",
      contact: {
        name: "OpenCourse API Support",
        email: "api@opencourse.com",
      },
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: "Development server",
      },
    ],
    components: {
      schemas: {
        Error: {
          type: "object",
          properties: {
            message: {
              type: "string",
              description: "Error message",
            },
            status: {
              type: "number",
              description: "HTTP status code",
            },
          },
        },
        HealthCheck: {
          type: "object",
          properties: {
            status: {
              type: "string",
              example: "OK",
            },
            timestamp: {
              type: "string",
              format: "date-time",
            },
          },
        },
        TestResponse: {
          type: "object",
          properties: {
            message: {
              type: "string",
            },
            data: {
              type: "object",
              properties: {
                courses: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
                users: {
                  type: "number",
                },
                timestamp: {
                  type: "string",
                  format: "date-time",
                },
              },
            },
          },
        },
        UserData: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "User name",
            },
            email: {
              type: "string",
              format: "email",
              description: "User email address",
            },
          },
          required: ["name", "email"],
        },
      },
    },
  },
  apis: ["./src/index.ts", "./src/routes/*.ts"],
}

const swaggerSpec = swaggerJSDoc(swaggerOptions)

app.use(helmet())

const origins = process.env.CORS_ORIGINS?.split(",") || [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://app.opencourse.id",
]

app.use(
  cors({
    origin: origins,
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
    ],
  })
)

app.all("/api/auth/*", toNodeHandler(auth))
app.use(morgan("combined"))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Documentation configuration
const isProduction = process.env.NODE_ENV === "production"
const enableDocs = process.env.ENABLE_DOCS === "true"
const protectDocs = process.env.PROTECT_DOCS === "true"

// In production, docs are disabled by default unless explicitly enabled
const shouldShowDocs = !isProduction || enableDocs

if (shouldShowDocs) {
  // Basic Auth middleware for API documentation (when protection is enabled)
  const docsAuth = basicAuth({
    users: {
      [process.env.DOCS_USERNAME || "admin"]:
        process.env.DOCS_PASSWORD || "password123",
    },
    challenge: true,
    realm: "OpenCourse API Documentation",
    unauthorizedResponse: (req) => {
      return {
        error: "Unauthorized",
        message: "API documentation requires authentication",
        hint: "Contact your administrator for access credentials",
      }
    },
  })

  // Apply protection if enabled
  if (protectDocs) {
    app.use("/api-docs", docsAuth)
    app.use("/api-docs.json", docsAuth)
  }

  // Serve documentation
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customCss: ".swagger-ui .topbar { display: none }",
      customSiteTitle: "OpenCourse API Documentation",
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        docExpansion: "list",
        filter: true,
        showExtensions: true,
        showCommonExtensions: true,
      },
    })
  )

  app.get("/api-docs.json", (req, res) => {
    res.setHeader("Content-Type", "application/json")
    res.send(swaggerSpec)
  })
} else {
  // In production, return 404 for documentation endpoints
  const productionDocsHandler = (req: any, res: any) => {
    res.status(404).json({
      error: "Not Found",
      message: "API documentation is not available in production",
      hint: "Contact your administrator if you need API documentation access",
    })
  }

  app.get("/api-docs*", productionDocsHandler)
  app.get("/api-docs.json", productionDocsHandler)
}

/**
 * @swagger
 * /:
 *   get:
 *     summary: Root endpoint
 *     description: Returns a welcome message for the OpenCourse API
 *     tags: [General]
 *     responses:
 *       200:
 *         description: Welcome message
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: OpenCourse API is running!
 */
app.get("/", (req, res) => {
  res.json({ message: "OpenCourse API is running!" })
})

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns the health status of the API server
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Server health status
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthCheck'
 */
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() })
})

/**
 * @swagger
 * /api/test:
 *   get:
 *     summary: Test GET endpoint
 *     description: Returns test data including sample courses and user count
 *     tags: [Test]
 *     responses:
 *       200:
 *         description: Test data response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TestResponse'
 */
app.get("/api/test", (req, res) => {
  res.json({
    message: "Test endpoint working!",
    data: {
      courses: ["JavaScript Basics", "React Advanced", "Node.js API"],
      users: 42,
      timestamp: new Date().toISOString(),
    },
  })
})

/**
 * @swagger
 * /api/test:
 *   post:
 *     summary: Test POST endpoint
 *     description: Accepts user data and returns a confirmation with generated ID
 *     tags: [Test]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserData'
 *     responses:
 *       200:
 *         description: Data received successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Data received successfully
 *                 received:
 *                   $ref: '#/components/schemas/UserData'
 *                 id:
 *                   type: number
 *                   description: Generated user ID
 *                   example: 123
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.post("/api/test", (req, res) => {
  const { name, email } = req.body
  res.json({
    message: "Data received successfully",
    received: { name, email },
    id: Math.floor(Math.random() * 1000),
  })
})

// API Routes
app.use("/api", apiRouter)

// Error handling middleware - must be after all routes
app.use(notFoundHandler)
app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
