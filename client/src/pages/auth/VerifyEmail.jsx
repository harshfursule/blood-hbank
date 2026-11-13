import { useEffect, useState } from "react";
import { useParams, Link }    from "react-router-dom";
import { verifyEmail }        from "../../api/auth.api.js";

const VerifyEmail = () => {
  const { token }  = useParams();
  const [status, setStatus] = useState("loading"); // loading | success | error
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verify = async () => {
      try {
        const res = await verifyEmail(token);
        setMessage(res.message);
        setStatus("success");
      } catch (err) {
        setMessage(err.response?.data?.message || "Verification failed. Link may have expired.");
        setStatus("error");
      }
    };
    verify();
  }, [token]);

  const icons   = { loading: "⏳", success: "✅", error: "❌" };
  const colors  = { loading: "text-slate-700", success: "text-green-700", error: "text-red-700" };
  const bgs     = { loading: "bg-slate-50", success: "bg-green-50", error: "bg-red-50" };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-slate-100 flex items-center justify-center p-4">
      <div className={`w-full max-w-md rounded-2xl shadow-xl p-8 text-center ${bgs[status]}`}>
        <span className="text-6xl">{icons[status]}</span>
        <h2 className={`mt-4 text-xl font-bold ${colors[status]}`}>
          {status === "loading" && "Verifying your email..."}
          {status === "success" && "Email Verified!"}
          {status === "error"   && "Verification Failed"}
        </h2>
        <p className="text-slate-500 text-sm mt-2">{message}</p>
        {status !== "loading" && (
          <Link
            to="/login"
            className="mt-6 inline-block px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
          >
            Go to Login
          </Link>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
