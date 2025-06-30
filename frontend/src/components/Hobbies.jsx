import { ArrowLeft } from 'lucide-react';

const Hobbies = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 flex items-center justify-center px-6">
      <div className="max-w-md w-full">
        <button 
          onClick={() => onNavigate('landing')}
          className="flex items-center text-white mb-8 hover:text-gray-200 transition"
        >
          <ArrowLeft size={20} className="mr-2" />
          Zurück
        </button>
      </div>
    </div>
  );
};

export default Hobbies;
