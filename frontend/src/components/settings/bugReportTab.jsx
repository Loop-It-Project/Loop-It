import { useState } from 'react';
import { Bug, ExternalLink } from 'lucide-react';
import BugReportForm from '../BugReportForm';

const BugReportSection = ({ user }) => {
  const [showBugReportForm, setShowBugReportForm] = useState(false);

  return (
    <div className="bg-card rounded-lg shadow-sm border border-primary">
      <div className="p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Bug className="text-red-500" size={24} />
          <h2 className="text-xl font-semibold text-primary">Bug Report</h2>
        </div>
        
        <div className="space-y-4">
          <p className="text-secondary">
            Hast du einen Bug gefunden? Hilf uns dabei, Loop-It zu verbessern, indem du uns das Problem meldest.
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">Bevor du einen Bug meldest:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Versuche das Problem zu reproduzieren</li>
              <li>• Beschreibe die Schritte so detailliert wie möglich</li>
              <li>• Gib an, was du erwartet hast und was stattdessen passiert ist</li>
              <li>• Browser- und Geräteinformationen werden automatisch erfasst</li>
            </ul>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowBugReportForm(true)}
              className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
            >
              <Bug size={16} />
              <span>Bug melden</span>
            </button>
            
            <a
              href="/settings/my-bug-reports"
              className="text-purple-600 hover:text-purple-700 transition-colors flex items-center space-x-2"
            >
              <span>Meine Bug Reports</span>
              <ExternalLink size={16} />
            </a>
          </div>
        </div>
      </div>

      {/* Bug Report Form Modal */}
      <BugReportForm
        isOpen={showBugReportForm}
        onClose={() => setShowBugReportForm(false)}
        user={user}
      />
    </div>
  );
};

export default BugReportSection;