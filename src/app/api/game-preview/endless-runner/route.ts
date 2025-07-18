import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { template: string } }
) {
  try {
    const template = params.template;
    const gamePath = path.join(process.cwd(), 'game-templates', template, 'game.js');
    
    const js = await fs.readFile(gamePath, 'utf-8');
    
    return new NextResponse(js, {
      headers: {
        'Content-Type': 'application/javascript',
      },
    });
  } catch (error) {
    return new NextResponse('Game script not found', { status: 404 });
  }
}