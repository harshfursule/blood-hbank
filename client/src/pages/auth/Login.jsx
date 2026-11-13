import { Link, useNavigate } from "react-router-dom";
import { useForm }            from "react-hook-form";
import { z }                  from "zod";
import { zodResolver }        from "@hookform/resolvers/zod";
import toast                  from "react-hot-toast";
import { loginUser }          from "../../api/auth.api.js";
import useAuthStore           from "../../store/authStore.js";

const loginSchema = z.object({
  email:    z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Role → dashboard path map
const DASHBOARD = {
  admin:      "/admin/dashboard",
  donor:      "/donor/dashboard",
  hospital:   "/hospital/dashboard",
  technician: "/technician/dashboard",
};

const Login = () => {
  const navigate   = useNavigate();
  const { setAuth } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data) => {
    try {
      const result = await loginUser(data);
      const { user, accessToken } = result.data;

      // Save user + token to Zustand store
      setAuth(user, accessToken);

      toast.success(`Welcome back, ${user.name}! 🩸`);
      navigate(DASHBOARD[user.role] || "/");
    } catch (err) {
      const msg = err.response?.data?.message || "Login failed. Please try again.";
      toast.error(msg);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <span className="text-5xl">🩸</span>
          <h1 className="mt-3 text-2xl font-bold text-slate-800">Welcome back</h1>
          <p className="text-slate-500 text-sm mt-1">Sign in to your BloodBank account</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email address</label>
            <input
              type="email"
              {...register("email")}
              placeholder="you@example.com"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm
                         focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
            />
            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
          </div>

          {/* Password */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-slate-700">Password</label>
              <Link to="/forgot-password" className="text-xs text-red-600 hover:underline">
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              {...register("password")}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm
                         focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
            />
            {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold
                       rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
                Signing in...
              </span>
            ) : "Sign In"}
          </button>
        </form>

        {/* Dev hint */}
        <div className="mt-5 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
          <strong>Dev tip:</strong> Register an account first, then check your server terminal for the verification email link (printed to console in dev mode).
        </div>

        <p className="text-center text-sm text-slate-500 mt-5">
          Don&apos;t have an account?{" "}
          <Link to="/register" className="text-red-600 font-semibold hover:underline">Register</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
