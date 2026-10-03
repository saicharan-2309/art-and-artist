import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";
import { HeroSceneLoader } from "@/components/hero-scene-loader";
export const metadata:Metadata={title:"Sign in"};
export default function LoginPage(){return <main className="auth-page"><div className="auth-art"><HeroSceneLoader/><div className="auth-art-caption"><h2>Make the work.<br/>Find your people.</h2><p>A professional home for creative practice.</p></div></div><section className="auth-content"><div className="auth-inner"><span className="eyebrow">WELCOME BACK</span><h1>Sign in</h1><p>Return to your work and your creative community.</p><Suspense fallback={<div className="form-skeleton"/>}><AuthForm mode="login"/></Suspense></div></section></main>}
