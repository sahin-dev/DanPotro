import "server-only";

import { ZodError, type z } from "zod";

import { AppError, badRequest } from "@/lib/errors";

type Handler<Context> = (request: Request, context: Context) => Promise<Response>;

/** Wraps a route handler so domain, validation, and unexpected errors become consistent JSON. */
export function handleApi<Context = unknown>(handler: Handler<Context>): Handler<Context> {
  return async (request, context) => {
    try {
      return await handler(request, context);
    } catch (error) {
      if (error instanceof AppError) {
        return Response.json({ error: error.message }, { status: error.status });
      }
      if (error instanceof ZodError) {
        return Response.json({ error: error.issues[0]?.message ?? "Some details are invalid." }, { status: 400 });
      }
      console.error(`[api] ${request.method} ${new URL(request.url).pathname} failed`, error);
      return Response.json({ error: "Something went wrong on our side. Please try again." }, { status: 500 });
    }
  };
}

export async function parseJson<Schema extends z.ZodType>(request: Request, schema: Schema): Promise<z.infer<Schema>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw badRequest("The request body must be valid JSON.");
  }
  return schema.parse(body);
}

export async function parseForm(request: Request) {
  try {
    return await request.formData();
  } catch {
    throw badRequest("The request must be sent as a form upload.");
  }
}

/** Read text fields from multipart form data into a plain object for schema parsing. */
export function formFields(form: FormData) {
  const fields: Record<string, string> = {};
  for (const [key, value] of form.entries()) if (typeof value === "string") fields[key] = value;
  return fields;
}

export function formFile(form: FormData, name: string) {
  const value = form.get(name);
  return value instanceof File && value.size > 0 ? value : undefined;
}

export function formFiles(form: FormData, name: string) {
  return form.getAll(name).filter((value): value is File => value instanceof File && value.size > 0);
}
