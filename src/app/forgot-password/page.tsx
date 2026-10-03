import type { Metadata } from "next";
import { PasswordResetForm } from "@/components/password-reset-form";
export const metadata:Metadata={title:"Reset password"};
export default function ForgotPassword(){return <main className="auth-page"><div className="auth-art auth-art-plain"><div className="auth-art-caption"><h2>Your work is<br/>right where you left it.</h2><p>We will help you back into your account.</p></div></div><section className="auth-content"><div className="auth-inner"><span className="eyebrow">ACCOUNT ACCESS</span><h1>Reset password</h1><p>Enter the email associated with your account.</p><PasswordResetForm mode="request"/></div></section></main>}
