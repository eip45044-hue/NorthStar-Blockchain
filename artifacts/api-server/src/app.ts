import express, { type ErrorRequestHandler, type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { clerkMiddleware } from "@clerk/express";
import { publishableKeyFromHost } from "@clerk/shared/keys";
import {
  CLERK_PROXY_PATH,
  clerkProxyMiddleware,
  getClerkProxyHost,
} from "./middlewares/clerkProxyMiddleware";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();
const configuredOrigins = new Set(
  [process.env.FRONTEND_URL, ...(process.env.CORS_ORIGINS ?? '').split(',')]
    .map((origin) => origin?.trim().replace(/\/+$/, ''))
    .filter((origin): origin is string => Boolean(origin)),
);
const localDevelopmentOrigin = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

// Clerk proxy must be mounted before body parsers — it streams raw bytes
app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());

app.use(
  cors({
    credentials: true,
    origin(origin, callback) {
      if (
        !origin ||
        configuredOrigins.has(origin) ||
        (process.env.NODE_ENV !== 'production' && localDevelopmentOrigin.test(origin))
      ) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
  }),
);
app.use(express.json({ limit: "30mb" }));
app.use(express.urlencoded({ extended: true }));

// Resolve publishable key from the incoming host so the same server can
// serve multiple Clerk custom domains / .replit.app deployments.
app.use(
  clerkMiddleware((req) => ({
    publishableKey: publishableKeyFromHost(
      getClerkProxyHost(req) ?? "",
      process.env.CLERK_PUBLISHABLE_KEY,
    ),
  })),
);

app.use("/api", router);

const errorHandler: ErrorRequestHandler = (error, _req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }
  logger.error({ err: error }, "Unhandled API request error");
  res.status(500).json({ error: "Internal server error" });
};

app.use(errorHandler);

export default app;
