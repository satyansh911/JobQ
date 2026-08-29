"use client";
import { auth_service, useAppData } from "@/context/AppContext";
import axios from "axios";
import { redirect } from "next/navigation";
import React, { FormEvent, useState } from "react";
import toast from "react-hot-toast";
import Cookies from "js-cookie";
import { Label } from "@/components/ui/label";
import { ArrowRight, Lock, Mail } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Loading from "@/components/loading";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [btnLoading, setBtnLoading] = useState(false);

  const { isAuth, setUser, loading, setIsAuth, fetchApplications } =
    useAppData();

  if (loading) return <Loading />;

  if (isAuth) return redirect("/");

  const submitHandler = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setBtnLoading(true);
    try {
      const { data } = await axios.post(`${auth_service}/api/auth/login`, {
        email,
        password,
      });

      toast.success(data.message);

      Cookies.set("token", data.token, {
        expires: 15,
        secure: false,
        path: "/",
      });
      setUser(data.userObject);
      setIsAuth(true);
      fetchApplications();
    } catch (error: any) {
      console.log(error);
      toast.error(error.response.data.message);
      setIsAuth(false);
    } finally {
      setBtnLoading(false);
    }
  };

  return (
    <div className="h-[100dvh] overflow-hidden flex flex-col items-center justify-center gap-6 px-4 py-6">
      <Link href="/" aria-label="JobQ home" className="shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-black.png" alt="JobQ" className="h-10 w-auto" />
      </Link>

      <div className="text-center shrink-0">

        <h1 className="t-h1 mb-2">Welcome back to JobQ</h1>
        <p className="t-body-sm">Sign in to continue your journey</p>
      </div>

      <div className="w-full max-w-md min-h-0 flex">
        <div className="surface-card p-8 w-full overflow-y-auto">
          <form onSubmit={submitHandler} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="icon-style" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-10 h-11"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <div className="relative">
                <Lock className="icon-style" />
                <Input
                  id="password"
                  type="password"
                  placeholder="********"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pl-10 h-11"
                />
              </div>
            </div>

            <div className="flex items-center justify-end">
              <Link
                href={"/forgot"}
                className="text-sm text-steel-700 hover:underline transition-all"
              >
                Forgot Password?
              </Link>
            </div>

            <Button disabled={btnLoading} className="w-full">
              {btnLoading ? "Signing in..." : "Sign In"}
              <ArrowRight size={18} />
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-hairline">
            <p className="text-center text-sm">
              Don't have an account?{" "}
              <Link
                href={"/register"}
                className="text-steel-700 font-medium hover:underline transition-all"
              >
                Create a new account?
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
