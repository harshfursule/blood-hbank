import { Link } from "react-router-dom";

const NotFound = () => (
  <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-center p-4">
    <span className="text-8xl mb-6">🩸</span>
    <h1 className="text-6xl font-black text-red-600">404</h1>
    <h2 className="text-2xl font-bold text-slate-800 mt-3">Page Not Found</h2>
    <p className="text-slate-500 mt-2 max-w-md">
      Looks like this page doesn&apos;t exist. The blood trail ends here.
    </p>
    <Link
      to="/"
      className="mt-8 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
    >
      Go to Dashboard
    </Link>
  </div>
);

export default NotFound;
