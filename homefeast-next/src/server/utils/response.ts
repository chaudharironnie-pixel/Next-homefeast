import { NextResponse } from 'next/server';

export const sendSuccess = <T>(data: T, message = 'Success', status = 200) => {
  return NextResponse.json({ success: true, data, message }, { status });
};

export const sendError = (message: string, status = 500, code?: string, errors?: unknown) => {
  const body: Record<string, unknown> = { success: false, message };
  if (code) body.code = code;
  if (errors) body.errors = errors;
  return NextResponse.json(body, { status });
};
