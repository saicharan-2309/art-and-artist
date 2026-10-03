import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request:NextRequest){
  const {searchParams,origin}=new URL(request.url);
  const code=searchParams.get("code");
  const requested=searchParams.get("next")||"/onboarding";
  const next=requested.startsWith("/")&&!requested.startsWith("//")?requested:"/onboarding";
  const supabase=await createClient();
  if(code&&supabase){
    const {error}=await supabase.auth.exchangeCodeForSession(code);
    if(!error)return NextResponse.redirect(new URL(next,origin));
  }
  return NextResponse.redirect(new URL("/login?error=auth_callback",origin));
}
