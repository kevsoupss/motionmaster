import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const { signInWithGoogle, signInWithGithub } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 space-y-4">
      <h1 className="text-2xl font-bold mb-6">Welcome to MotionMaster</h1>
      
      <button
        onClick={signInWithGoogle}
        className="flex items-center justify-center px-6 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-gray-700 hover:bg-gray-50 w-64"
      >
        <img
          src="https://www.google.com/favicon.ico"
          alt="Google"
          className="w-5 h-5 mr-2"
        />
        Sign in with Google
      </button>

      <button
        onClick={signInWithGithub}
        className="flex items-center justify-center px-6 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-gray-700 hover:bg-gray-50 w-64"
      >
        <img
          src="https://github.com/favicon.ico"
          alt="GitHub"
          className="w-5 h-5 mr-2"
        />
        Sign in with GitHub
      </button>
    </div>
  );
} 