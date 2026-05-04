export default function PlaceholderPage({ title, subtitle, message }) {
  return (
    <div className="min-h-screen bg-gray-50 px-6 py-12">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
        <p className="mt-2 text-gray-600">{subtitle}</p>
        <div className="mt-8 rounded-lg border border-gray-200 bg-white p-6">
          <p className="text-center text-gray-500">{message}</p>
        </div>
      </div>
    </div>
  );
}
