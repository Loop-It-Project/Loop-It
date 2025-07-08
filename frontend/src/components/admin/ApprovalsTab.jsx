const ApprovalsTab = ({ approvals }) => {
  if (!approvals) {
    return (
      <div className="text-center py-12">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-secondary dark:text-muted">Lade Genehmigungen...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-primary dark:text-white">Ausstehende Genehmigungen</h2>
      
      {/* Universe Join Requests */}
      <div className="bg-card dark:bg-gray-800 border border-primary dark:border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-primary dark:text-white mb-4">Universe Beitrittsanfragen</h3>
        
        {approvals.universeJoinRequests?.length === 0 ? (
          <p className="text-secondary dark:text-muted">Keine ausstehenden Beitrittsanfragen</p>
        ) : (
          <div className="space-y-3">
            {approvals.universeJoinRequests?.map((request) => (
              <div key={request.id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded">
                <div>
                  <p className="font-medium text-primary dark:text-white">
                    {request.displayName || request.username} möchte "{request.universeName}" beitreten
                  </p>
                  {request.message && (
                    <p className="text-sm text-secondary dark:text-muted">{request.message}</p>
                  )}
                </div>
                <div className="space-x-2">
                  <button className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 hover:cursor-pointer transition-colors">
                    Genehmigen
                  </button>
                  <button className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 hover:cursor-pointer transition-colors">
                    Ablehnen
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ApprovalsTab;