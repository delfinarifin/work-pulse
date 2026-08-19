import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CookieToSet = { name: string; value: string; options: CookieOptions };

export async function updateSession(request: NextRequest) {
  const supabaseResponse = NextResponse.next({ request });

  // The agent authenticates with its own bearer API key (lib/agent/auth.ts),
  // not a Supabase Auth cookie session — this middleware's "no user, no
  // public path -> redirect to /login" rule would otherwise 302 every agent
  // request into an HTML login page instead of letting the route handler
  // run its own auth check and return JSON.
  if (request.nextUrl.pathname.startsWith("/api/agent/")) {
    return supabaseResponse;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If Supabase isn't configured, skip the auth refresh and pass through.
  // Without this guard createServerClient throws "Your project's URL and Key
  // are required", crashing the edge middleware on every route (500
  // MIDDLEWARE_INVOCATION_FAILED).
  if (!url || !anonKey) {
    return supabaseResponse;
  }

  try {
    let response = supabaseResponse;
    const supabase = createServerClient(url, anonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    });

    // Refresh session so it doesn't expire while user is active
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const publicPaths = ["/login", "/signup"];
    const isPublicPath = publicPaths.some((path) =>
      request.nextUrl.pathname.startsWith(path),
    );

    if (!user && !isPublicPath) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (user && isPublicPath) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    // A deactivated consultant is blocked from the app on every request,
    // not just at sign-in — a manager can flip `active` off mid-session
    // and it takes effect immediately. No row yet (brand-new user,
    // getCurrentConsultant hasn't created it) is not a deactivation.
    if (user && !isPublicPath) {
      const { data: consultant } = await supabase
        .from("consultants")
        .select("active")
        .eq("user_id", user.id)
        .maybeSingle();
      if (consultant && consultant.active === false) {
        await supabase.auth.signOut();
        return NextResponse.redirect(new URL("/login?deactivated=1", request.url));
      }
    }

    return response;
  } catch {
    // Never let an auth hiccup crash the entire edge middleware
    return supabaseResponse;
  }
}
