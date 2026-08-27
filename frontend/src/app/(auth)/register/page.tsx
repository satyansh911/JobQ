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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Loading from "@/components/loading";

const RegisterPage = () => {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [bio, setBio] = useState("");
  const [resume, setResume] = useState<File | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [btnLoading, setBtnLoading] = useState(false);

  const { isAuth, setUser, loading, setIsAuth } = useAppData();

  if (loading) return <Loading />;

  if (isAuth) return redirect("/");

  const submitHandler = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setBtnLoading(true);
    const formData = new FormData();

    formData.append("role", role);
    formData.append("name", name);
    formData.append("email", email);
    formData.append("password", password);
    formData.append("phoneNumber", phoneNumber);

    if (role === "jobseeker") {
      formData.append("bio", bio);
      if (resume) {
        formData.append("file", resume);
      }
    }
    try {
      const { data } = await axios.post(
        `${auth_service}/api/auth/register`,
        formData
      );

      toast.success(data.message);

      Cookies.set("token", data.token, {
        expires: 15,
        secure: false,
        path: "/",
      });
      setUser(data.registeredUser);
      setIsAuth(true);
    } catch (error: any) {
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
        <img src="/logo.png" alt="JobQ" className="h-10 w-auto" />
      </Link>

      <div className="text-center shrink-0">
        <h1 className="text-4xl font-bold mb-2">Join JobQ</h1>
        <p className="text-sm opacity-70">
          Create your account to start a new journey
        </p>
      </div>

      <div className="w-full max-w-md min-h-0 flex">
        <div className="liquid-glass rounded-2xl p-8 w-full overflow-y-auto">
          <form onSubmit={submitHandler} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="role" className="text-sm font-medium">
                I want to
              </Label>
              <Select value={role} onValueChange={setRole} required>
                <SelectTrigger id="role" className="w-full h-11">
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="jobseeker">Find a Job</SelectItem>
                  <SelectItem value="recruiter">Hire Talent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {role && (
              <div className="space-y-5 animate-in fade-in duration-300">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">
                    Full Name
                  </Label>
                  <div className="relative">
                    <Mail className="icon-style" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="pl-10 h-11"
                    />
                  </div>
                </div>
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

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium">
                    Phone Number
                  </Label>
                  <div className="relative">
                    <Lock className="icon-style" />
                    <Input
                      id="phone"
                      type="number"
                      placeholder="+91 1234567890"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      required
                      className="pl-10 h-11"
                    />
                  </div>
                </div>

                {role === "jobseeker" && (
                  <div className="space-y-5 pt-4 border-t border-white/10">
                    <div className="space-y-2">
                      <Label htmlFor="resume" className="text-sm font-medium">
                        Resume (PDF)
                      </Label>
                      <Input
                        id="resume"
                        type="file"
                        accept="application/pdf"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setResume(e.target.files[0]);
                          }
                        }}
                        className="h-11 cursor-pointer"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bio" className="text-sm font-medium">
                        Bio
                      </Label>
                      <div className="relative">
                        <Lock className="icon-style" />
                        <Input
                          id="bio"
                          type="text"
                          placeholder="Tell us about yourself..."
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          required
                          className="pl-10 h-11"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <Button disabled={btnLoading} className="w-full">
                  {btnLoading ? "Please Wait..." : "Register"}
                  <ArrowRight size={18} />
                </Button>
              </div>
            )}
          </form>

          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-center text-sm">
              Already have an account{" "}
              <Link
                href={"/register"}
                className="text-blue-500 font-medium hover:underline transition-all"
              >
                Login?
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
