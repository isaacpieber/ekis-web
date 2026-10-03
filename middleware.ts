import type { NextRequest } from "next/server";
import { updateSession } from "./utils/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|bmp|ico|css|js|mjs|map|woff2?|ttf|otf|eot|json|txt|xml|webmanifest|pdf)$).*)",
  ],
};
