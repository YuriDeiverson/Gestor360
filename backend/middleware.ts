import { Request, Response, NextFunction } from "express";
import { authService } from "./auth.js";

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

export const authMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        error: "Token de acesso requerido",
        code: "MISSING_TOKEN",
      });
    }

    const token = authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        error: "Formato de token inválido",
        code: "INVALID_TOKEN_FORMAT",
      });
    }

    const decoded = authService.verifyToken(token);
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
    };

    next();
  } catch (error) {
    console.error("Erro de autenticação:", error);

    if (error instanceof Error && error.message === "Token inválido") {
      return res.status(401).json({
        error: "Token inválido ou expirado",
        code: "INVALID_TOKEN",
      });
    }

    return res.status(500).json({
      error: "Erro interno do servidor",
      code: "INTERNAL_ERROR",
    });
  }
};

export const optionalAuthMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader) {
      const token = authHeader.split(" ")[1];

      if (token) {
        try {
          const decoded = authService.verifyToken(token);
          req.user = {
            userId: decoded.userId,
            email: decoded.email,
          };
        } catch (error) {
          // Token inválido, mas não bloqueia a requisição
          console.log("Token opcional inválido:", error);
        }
      }
    }

    next();
  } catch (error) {
    console.error("Erro no middleware opcional:", error);
    next(); // Continua mesmo com erro
  }
};
