import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { OnboardingWizard } from "@/components/onboarding-wizard";
export const metadata:Metadata={title:"Set up your profile"};
export default async function OnboardingPage(){
  const supabase=await createClient();
  if(!supabase)redirect("/signup");
  const {data:{user}}=await supabase.auth.getUser();
  if(!user)redirect("/signup");
  const {data:profile}=await supabase.from("profiles").select("username,onboarding_step").eq("user_id",user.id).maybeSingle();
  if(!profile)redirect("/login");
  if(profile.onboarding_step>=7)redirect(`/u/${profile.username}`);
  return <main className="collection-wrap onboarding-wrap"><header className="collection-head"><div><span className="eyebrow">YOUR CREATIVE PRACTICE</span><h1>Make it yours.</h1></div><p>Give people a clear first sense of who you are, what you make, and the projects you want to find.</p></header><OnboardingWizard initialStep={profile.onboarding_step} username={profile.username}/></main>;
}
