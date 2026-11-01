import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { logoutApi } from "../../api/auth";
import { useAuthStore } from "../../store/authStore";

export default function KonfirmasiLogoutPage() {
  const clear = useAuthStore((s) => s.clear);
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    try {
      await logoutApi();
    } catch {
      // even if the API call fails (e.g. session already expired), still log out locally
    } finally {
      clear();
      navigate("/login", { replace: true });
    }
  }

  return (
    <div className="max-w-sm mx-auto mt-20 space-y-4 text-center">
      <h1 className="text-2xl font-bold">Keluar dari akun?</h1>
      <p className="text-sm text-gray-600">
        Anda masuk sebagai <b>{user?.username}</b>.
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => navigate(-1)}
          className="border p-2 w-full"
          disabled={loading}
        >
          Batal
        </button>
        <button
          onClick={handleLogout}
          className="bg-black text-white p-2 w-full"
          disabled={loading}
        >
          {loading ? "Memproses..." : "Ya, keluar"}
        </button>
      </div>
    </div>
  );
}