import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const BackButton = () => {
  return (
        <Link 
          to="*"
          className="flex items-center text-white mb-8 hover:text-gray-200 transition"
        >
          <ArrowLeft size={20} className="mr-2" />
          Zurück
        </Link>
  );
};

export default BackButton;