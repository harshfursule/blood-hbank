import { Link, useNavigate, useParams } from "react-router-dom";
import { useForm }                       from "react-hook-form";
import { z }                             from "zod";
import { zodResolver }                   from "@hookform/resolvers/zod";
import toast                             from "react-hot-toast";
import { resetPassword }                 from "../../api/auth.api.js";

const schema = z
  .object({
    password:        z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path:    ["confirmPassword"],
  });

const ResetPassword = () => {
  const { token }  = useParams();
  const navigate   = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isSubmitSuccessful },
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async ({ password }) => {
    try {
      await resetPassword(token, password);
    } catch (err) {
      toast.error(err.response?.data?.message || "Reset failed. Link may have expired.");
      throw err;
    }
  };

  if (isSubmitSuccessful) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center">
          <span className="text-6xl">✅</span>
          <h2 className="mt-4 text-xl font-bold text-slate-800">Password reset!</h2>
          <p className="text-slate-500 text-sm mt-2">
            Your password has been updated. You can now sign in with your new password.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="mt-6 px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-7">
          <span className="text-5xl">🔑</span>
          <h1 className="mt-3 text-2xl font-bold text-slate-800">Set new password</h1>
          <p className="text-slate-500 text-sm mt-1">Enter your new password below.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
            <input
              type="password"
              {...register("password")}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm
                         focus:outline-none focus:ring-2 focus:ring-red-500 transition"
            />
            {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Confirm Password</label>
            <input
              type="password"
              {...register("confirmPassword")}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm
                         focus:outline-none focus:ring-2 focus:ring-red-500 transition"
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-xs text-red-500">{errors.confirmPassword.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold
                       rounded-lg transition-colors disabled:opacity-60"
          >
            {isSubmitting ? "Resetting..." : "Reset Password"}
          </button>

          <p className="text-center text-sm text-slate-500">
            <Link to="/login" className="text-red-600 font-semibold hover:underline">
              ← Back to Login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
