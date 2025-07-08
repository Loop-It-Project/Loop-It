import { useState } from 'react';
import { X, Flag, AlertTriangle } from 'lucide-react';
import ReportService from '../services/reportService';
import useEscapeKey from '../hooks/useEscapeKey';

const ReportModal = ({ isOpen, onClose, postId, postAuthor }) => {
  const [selectedReason, setSelectedReason] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEscapeKey(onClose, isOpen);

  const reportReasons = [
    { value: 'spam', label: 'Spam oder wiederholte Inhalte', icon: '🚫' },
    { value: 'harassment', label: 'Belästigung oder Mobbing', icon: '😠' },
    { value: 'hate_speech', label: 'Hassrede oder Diskriminierung', icon: '💢' },
    { value: 'inappropriate_content', label: 'Unangemessene Inhalte', icon: '⚠️' },
    { value: 'misinformation', label: 'Falschinformationen', icon: '❌' },
    { value: 'copyright', label: 'Urheberrechtsverletzung', icon: '©️' },
    { value: 'other', label: 'Anderer Grund', icon: '❓' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedReason) {
      alert('Bitte wähle einen Grund aus.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await ReportService.reportPost(postId, selectedReason, description);
      
      if (result.success) {
        setSubmitted(true);
        setTimeout(() => {
          onClose();
          setSubmitted(false);
          setSelectedReason('');
          setDescription('');
        }, 2000);
      } else {
        alert(result.error || 'Fehler beim Melden des Posts');
      }
    } catch (error) {
      console.error('Report submission error:', error);
      alert('Fehler beim Melden des Posts');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      onClose();
      setSelectedReason('');
      setDescription('');
      setSubmitted(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-secondary flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Flag className="text-red-500" size={24} />
            <h3 className="text-lg font-semibold text-primary">Post melden</h3>
          </div>
          <button
            onClick={handleClose}
            disabled={submitting}
            className="text-muted hover:text-secondary hover:cursor-pointer transition-colors disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {submitted ? (
          /* Success State */
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Flag className="text-green-600" size={24} />
            </div>
            <h3 className="text-lg font-semibold text-primary mb-2">Meldung eingereicht</h3>
            <p className="text-secondary">
              Vielen Dank für deine Meldung. Unser Team wird den Post überprüfen.
            </p>
          </div>
        ) : (
          /* Report Form */
          <form onSubmit={handleSubmit} className="p-6">
            {/* Post Info */}
            <div className="bg-secondary rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="text-yellow-500" size={16} />
                <div className="text-sm">
                  <p className="font-medium text-primary">
                    Post von @{postAuthor?.username || 'Unbekannt'}
                  </p>
                  <p className="text-tertiary">
                    Diese Meldung wird an unser Moderationsteam gesendet.
                  </p>
                </div>
              </div>
            </div>

            {/* Reason Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-secondary mb-3">
                Warum meldest du diesen Post? *
              </label>
              <div className="space-y-2">
                {reportReasons.map((reason) => (
                  <label
                    key={reason.value}
                    className={`flex items-center space-x-3 p-3 rounded-lg border hover:cursor-pointer transition-colors ${
                      selectedReason === reason.value
                        ? 'border-purple-300 bg-purple-50'
                        : 'border-secondary hover:bg-secondary'
                    }`}
                  >
                    <input
                      type="radio"
                      name="reason"
                      value={reason.value}
                      checked={selectedReason === reason.value}
                      onChange={(e) => setSelectedReason(e.target.value)}
                      className="sr-only"
                    />
                    <span className="text-lg">{reason.icon}</span>
                    <span className="text-sm font-medium text-primary">{reason.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-secondary mb-2">
                Zusätzliche Details (optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Beschreibe das Problem genauer..."
                rows={3}
                maxLength={500}
                className="w-full px-3 py-2 border border-secondary rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
              />
              <div className="text-xs text-tertiary mt-1">
                {description.length}/500 Zeichen
              </div>
            </div>

            {/* Warning */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex space-x-3">
                <AlertTriangle className="text-yellow-600 flex-shrink-0" size={16} />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">Wichtiger Hinweis</p>
                  <p>
                    Falsche Meldungen können zu Einschränkungen deines Accounts führen. 
                    Melde nur Inhalte, die tatsächlich gegen unsere Richtlinien verstoßen.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={submitting}
                className="flex-1 px-4 py-2 border border-secondary rounded-lg text-secondary hover:bg-secondary hover:cursor-pointer transition-colors disabled:opacity-50"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                disabled={!selectedReason || submitting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 hover:cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Wird gemeldet...' : 'Post melden'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ReportModal;