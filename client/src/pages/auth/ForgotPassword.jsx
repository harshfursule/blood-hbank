import { Link }       from "react-router-dom";
import { useForm }    from "react-hook-form";
import { z }          from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import toast          from "react-hot-toast";
import { forgotPassword } from "../../api/auth.api.js";

const schema = z.object({
  email: z.string().email("Please enter a valid email"),
});

const ForgotPassword = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isSubmitSuccessful },
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async ({ email }) => {
    try {
      await forgotPassword(email);
      // isSubmitSuccessful shows the success screen
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong. Please try again.");
      throw err;
    }
  };

  if (isSubmitSuccessful) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center">
          <span className="text-6xl">📬</span>
          <h2 className="mt-4 text-xl font-bold text-slate-800">Reset link sent!</h2>
          <p className="text-slate-500 text-sm mt-2">
            If an account with that email exists, a password reset link has been sent.
          </p>
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700 text-left">
            <strong>Dev mode:</strong> Check your server terminal for the reset link (printed to console).
          </div>
          <Link
            to="/login"
            className="mt-6 inline-block text-red-600 font-semibold hover:underline"
          >
            ← Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-7">
          <span className="text-5xl">🔐</span>
          <h1 className="mt-3 text-2xl font-bold text-slate-800">Forgot password?</h1>
          <p className="text-slate-500 text-sm mt-1">
            Enter your email and we&apos;ll send you a reset link.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email address</label>
            <input
              type="email"
              {...register("email")}
              placeholder="you@example.com"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm
                         focus:outline-none focus:ring-2 focus:ring-red-500 transition"
            />
            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold
                       rounded-lg transition-colors disabled:opacity-60"
          >
            {isSubmitting ? "Sending..." : "Send Reset Link"}
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

export default ForgotPassword;
