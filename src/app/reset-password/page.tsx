import type { Metadata } from "next";
import { PasswordResetForm } from "@/components/password-reset-form";
export const metadata:Metadata={title:"Choose a new password"};
export default function ResetPassword(){return <main className="auth-page"><div className="auth-art auth-art-plain"><div className="auth-art-caption"><h2>A fresh start,<br/>same creative home.</h2><p>Set a new password for your account.</p></div></div><section className="auth-content"><div className="auth-inner"><span className="eyebrow">ACCOUNT ACCESS</span><h1>New password</h1><p>Choose at least eight characters.</p><PasswordResetForm mode="update"/></div></section></main>}
