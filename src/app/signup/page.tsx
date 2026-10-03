import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";
import { HeroSceneLoader } from "@/components/hero-scene-loader";
export const metadata:Metadata={title:"Create your profile"};
export default function SignupPage(){return <main className="auth-page"><div className="auth-art"><HeroSceneLoader/><div className="auth-art-caption"><h2>Your practice<br/>deserves a home.</h2><p>Build your identity around who you are and what you make.</p></div></div><section className="auth-content"><div className="auth-inner"><span className="eyebrow">CREATE · CONNECT · DISCOVER</span><h1>Join the community</h1><p>Start with your name and email. You can shape your profile next.</p><Suspense fallback={<div className="form-skeleton"/>}><AuthForm mode="signup"/></Suspense></div></section></main>}
