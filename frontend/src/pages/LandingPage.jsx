import { Link } from "react-router-dom";

export default function LandingPage() {
  return (
    <div className="flex items-center justify-center w-screen h-screen"
    style={{
        backgroundImage: "url('/large-triangles.svg')",
        backgroundRepeat: "repeat",
        backgroundSize: "auto",
    }}>
      <div className="bg-gray-50 rounded-2xl shadow-xl flex flex-col items-center">
        <img src="/hexlogo.png" alt="GroupGrade Logo" className="w-32 h-32 mb-4 mt-6" />
        <h1 className="text-4xl font-bold text-gray-800 mb-2">GroupGrade</h1>
        <h2 className="text-xl font-semibold text-gray-500">Teamwork Made Easy</h2>

        <Link to="/home">
          <button className="
            bg-[#5932EA]
            hover:bg-[#3111B6]
            text-white
            font-bold
            w-80
            py-4
            rounded-full
            shadow-lg
            transition-all
            duration-100 
            text-2xl
            mt-7
          ">
            Log In
          </button>
        </Link>

        <button className="
          bg-white
          text-gray-400
          border-gray-300
          hover:border-gray-400
          hover:text-gray-400
          hover:bg-gray-100
          border-4
          font-bold
          w-80
          py-4
          rounded-full
          shadow-lg
          transition-all
          duration-100
          text-2xl
          mt-4
          mb-6
          ml-6
          mr-6
        ">
          Create an account
        </button>
      </div>
    </div>
  );
}
