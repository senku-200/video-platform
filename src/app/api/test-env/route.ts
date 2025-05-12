import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    hasJwtSecret: !!process.env.JWT_SECRET,
    jwtSecretFirstChar: process.env.JWT_SECRET ? process.env.JWT_SECRET[0] : null,
    nodeEnv: process.env.NODE_ENV
  });
} 