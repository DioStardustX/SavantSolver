import { type Response, type NextFunction, type Request } from "express";
import { StatusCodes } from "http-status-codes";
import { AppError } from "../errors/custom.error";

export class ErrorMiddleware {
  public static handleError = (
    error: unknown,
    request: Request,
    res: Response,
    next: NextFunction
  ): void => {
    if (error instanceof AppError) {
      const { message, name, validationErrors } = error;
      const statusCode = error.statusCode;
      console.error(`[ERROR] ${name}: ${message}`);
      res.status(statusCode).json({ name, message, validationErrors });
    } else {
      const rError = AppError.internalServer(
        "Se produjo un error interno del servidor"
      );
      console.error(`[ERROR] Internal Server Error:`, error);
      const statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
      res.status(statusCode).json(rError);
    }
  };
}
