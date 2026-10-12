"use client";
import { user_service } from "@/context/AppContext";
import { User } from "@/type";
import axios from "axios";
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import Cookies from "js-cookie";
import Loading from "@/components/loading";
import Info from "../components/info";
import Skills from "../components/skills";
import Link from "next/link";
import { apiError } from "@/lib/utils";

const UserAccount = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { id } = useParams();

  async function fetchUser() {
    const token = Cookies.get("token");
    try {
      const { data } = await axios.get(`${user_service}/api/user/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setUser(data);
      setError(null);
    } catch (err) {
      setError(apiError(err, "This profile couldn't be loaded."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUser();
  }, [id]);

  if (loading) return <Loading />;

  if (error) {
    return (
      <div className="mx-auto max-w-[560px] px-4 py-20 text-center md:px-6">
        <h1 className="t-h2">Can&apos;t show this profile</h1>
        <p className="t-body mt-3">{error}</p>
        <Link href="/jobs" className="btn-primary-sm mt-6 inline-flex">
          Back to jobs
        </Link>
      </div>
    );
  }

  return (
    <>
      {user && (
        <div className="mx-auto max-w-[900px] px-4 py-8 md:px-6 md:py-10">
          <Info user={user} isYourAccount={false} />
          {user.role === "jobseeker" && (
            <Skills user={user} isYourAccount={false} />
          )}
        </div>
      )}
    </>
  );
};

export default UserAccount;
