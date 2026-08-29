"use client";
import useRazorpay from "@/components/scriptLoader";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import Cookies from "js-cookie";
import axios from "axios";
import { payment_service, useAppData } from "@/context/AppContext";
import toast from "react-hot-toast";
import Loading from "@/components/loading";
import { Check } from "lucide-react";

const SubscriptionPage = () => {
  const razorpayLoaded = useRazorpay();

  const router = useRouter();

  const [loading, setLoading] = useState(false);

  const { setUser } = useAppData();

  const handleSubscribe = async () => {
    if (!razorpayLoaded || typeof window === "undefined" || !window.Razorpay) {
      toast.error("Payment library is still loading — try again in a moment.");
      return;
    }

    const token = Cookies.get("token");
    setLoading(true);

    try {
      const {
        data: { order, key },
      } = await axios.post(
        `${payment_service}/api/payment/checkout`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const options = {
        key,
        amount: order.amount,
        currency: order.currency,
        name: "JobQ",
        description: "Find your next job, faster",
        order_id: order.id,
        handler: async function (response: any) {
          const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
            response;

          try {
            const { data } = await axios.post(
              `${payment_service}/api/payment/verify`,
              { razorpay_order_id, razorpay_payment_id, razorpay_signature },
              { headers: { Authorization: `Bearer ${token}` } }
            );

            toast.success(data.message);
            setUser(data.updatedUser);
            router.push(`/payment/success/${razorpay_payment_id}`);
          } catch (error: any) {
            toast.error(
              error?.response?.data?.message || "Could not verify payment"
            );
          } finally {
            setLoading(false);
          }
        },
        modal: {
          // Without this the spinner would hang forever if the user closes
          // the Razorpay widget instead of paying.
          ondismiss: () => setLoading(false),
        },
        theme: { color: "#00d2ff" },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Could not start checkout"
      );
      setLoading(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="mx-auto max-w-[560px] px-4 py-12 md:py-16">
      <p className="t-overline">Priority placement</p>
      <h1 className="t-h1 mt-3">Be at the top of the list</h1>
      <p className="t-body mt-3">
        Recruiters review applicants in one table. Priority puts yours at the
        top of it, and marks you so they can see why.
      </p>

      <div className="mt-8 border border-hairline bg-raised">
        <div className="flex items-baseline gap-2 border-b border-hairline px-6 py-5">
          <span className="numeric font-[family-name:var(--font-display)] text-[2.5rem] font-semibold leading-none text-ink">
            ₹119
          </span>
          <span className="t-body-sm">per month</span>
        </div>

        <ul className="space-y-3 px-6 py-5">
          {[
            "Your application is surfaced first in every recruiter's list",
            "A priority marker on your row, so it is clear why",
            "Cancel any time — it simply stops renewing",
          ].map((line) => (
            <li key={line} className="flex gap-3">
              <Check className="mt-0.5 size-4 shrink-0 text-ok" />
              <span className="text-[15px] text-ink-2">{line}</span>
            </li>
          ))}
        </ul>

        <div className="border-t border-hairline px-6 py-5">
          <button
            onClick={handleSubscribe}
            className="btn-primary-sm w-full justify-center"
          >
            Go priority
          </button>
          <p className="t-body-sm mt-3 text-center">
            Payment is handled by Razorpay. Test mode — no real charge.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPage;
