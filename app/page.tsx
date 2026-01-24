import UserSelector from './components/UserSelector';

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-yellow-50 via-orange-50 to-yellow-50">
      <main className="flex flex-col items-center justify-center px-6 py-12 text-center space-y-8 max-w-2xl">
        {/* Paw icon decoration */}
        <div className="text-6xl">🐾</div>

        {/* Title */}
        <div className="space-y-4">
          <h1 className="text-5xl font-bold text-gray-800 tracking-tight">
            DogCal
          </h1>
          <p className="text-xl text-gray-600">
            Coordinate care time for your pups with friends
          </p>
        </div>

        {/* User selector */}
        <div className="w-full max-w-md space-y-6 pt-4">
          <h2 className="text-2xl font-semibold text-gray-700">
            Who are you?
          </h2>
          <UserSelector />
        </div>

        {/* Footer decoration */}
        <div className="pt-8 text-sm text-gray-500">
          Manage hangouts, schedule care, and stay connected
        </div>
      </main>
    </div>
  );
}
