import { useAuth } from "../../context/AuthContext";

export default function StaffProfile() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-12">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
        
        {user && (
          <div className="mt-8 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="px-6 py-8">
              <div className="space-y-6">
                <div>
                  <label className="text-sm font-medium text-gray-600">Email</label>
                  <p className="mt-1 text-lg text-gray-900">{user.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Name</label>
                  <p className="mt-1 text-lg text-gray-900">{user.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">ID</label>
                  <p className="mt-1 text-lg font-mono text-gray-600">{user.id}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
