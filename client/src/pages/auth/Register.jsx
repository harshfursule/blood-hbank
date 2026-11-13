import { Link, useNavigate } from "react-router-dom";
import { useForm }            from "react-hook-form";
import { z }                  from "zod";
import { zodResolver }        from "@hookform/resolvers/zod";
import toast                  from "react-hot-toast";
import { registerUser }       from "../../api/auth.api.js";

const registerSchema = z
  .object({
    name:            z.string().min(2, "Name must be at least 2 characters"),
    email:           z.string().email("Please enter a valid email"),
    phone:           z.string().min(10, "Enter a valid phone number"),
    role:            z.enum(["donor", "hospital"], { required_error: "Please select a role" }),
    password:        z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path:    ["confirmPassword"],
  });

const inputClass =
  "w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition";

const Register = () => {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isSubmitSuccessful },
  } = useForm({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (data) => {
    try {
      const { confirmPassword, ...payload } = data;
      await registerUser(payload);
      // Success state shown via isSubmitSuccessful
    } catch (err) {
      const msg = err.response?.data?.message || "Registration failed. Please try again.";
      toast.error(msg);
      throw err; // Re-throw so isSubmitSuccessful stays false
    }
  };

  // Show success screen after registration
  if (isSubmitSuccessful) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center">
          <span className="text-6xl">📧</span>
          <h2 className="mt-4 text-xl font-bold text-slate-800">Check your email!</h2>
          <p className="text-slate-500 text-sm mt-2">
            We sent a verification link to your email. Click it to activate your account.
          </p>
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700 text-left">
            <strong>Dev mode:</strong> Check your server terminal — the verification link is printed to the console (SMTP not configured yet).
          </div>
          <Link
            to="/login"
            className="mt-6 inline-block px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-7">
          <span className="text-5xl">🩸</span>
          <h1 className="mt-3 text-2xl font-bold text-slate-800">Create an account</h1>
          <p className="text-slate-500 text-sm mt-1">Join the BloodBank network</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
            <input type="text" {...register("name")} placeholder="John Doe" className={inputClass} />
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input type="email" {...register("email")} placeholder="you@example.com" className={inputClass} />
            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
            <input type="tel" {...register("phone")} placeholder="+91 98765 43210" className={inputClass} />
            {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>}
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Register as</label>
            <select {...register("role")} className={inputClass}>
              <option value="">Select role...</option>
              <option value="donor">🩸 Blood Donor</option>
              <option value="hospital">🏥 Hospital</option>
            </select>
            {errors.role && <p className="mt-1 text-xs text-red-500">{errors.role.message}</p>}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input type="password" {...register("password")} placeholder="••••••••" className={inputClass} />
            {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Confirm Password</label>
            <input type="password" {...register("confirmPassword")} placeholder="••••••••" className={inputClass} />
            {errors.confirmPassword && <p className="mt-1 text-xs text-red-500">{errors.confirmPassword.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold
                       rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-2"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
                Creating account...
              </span>
            ) : "Create Account"}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-5">
          Already have an account?{" "}
          <Link to="/login" className="text-red-600 font-semibold hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
