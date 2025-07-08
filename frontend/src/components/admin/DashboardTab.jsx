import { Users, Globe, MessageSquare, AlertTriangle, BarChart3, TrendingUp } from 'lucide-react';

const DashboardTab = ({ metrics, onRefresh }) => {
  if (!metrics) {
    return (
      <div className="text-center py-12">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-secondary dark:text-muted">Lade Dashboard-Metriken...</p>
      </div>
    );
  }

  const metricCards = [
    {
      title: 'Gesamt-Nutzer',
      value: metrics.users?.total || 0,
      subtitle: `${metrics.users?.newToday || 0} neue heute`,
      icon: Users,
      color: 'blue'
    },
    {
      title: 'Universes',
      value: metrics.universes?.total || 0,
      subtitle: `${metrics.universes?.pendingApproval || 0} warten auf Genehmigung`,
      icon: Globe,
      color: 'purple'
    },
    {
      title: 'Posts',
      value: metrics.posts?.total || 0,
      subtitle: `${metrics.posts?.today || 0} heute erstellt`,
      icon: MessageSquare,
      color: 'green'
    },
    {
      title: 'Pending Reports',
      value: metrics.moderation?.pendingReports || 0,
      subtitle: 'Benötigen Aufmerksamkeit',
      icon: AlertTriangle,
      color: 'red'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-primary dark:text-white">Dashboard Übersicht</h2>
        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 hover:cursor-pointer transition-colors"
        >
          Aktualisieren
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metricCards.map((metric, index) => {
          const Icon = metric.icon;
          const colorClasses = {
            blue: 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400',
            purple: 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400',
            green: 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400',
            red: 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400'
          };

          return (
            <div key={index} className="bg-card dark:bg-gray-800 border border-primary dark:border-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${colorClasses[metric.color]}`}>
                  <Icon size={24} />
                </div>
                <TrendingUp size={16} className="text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-primary dark:text-white">{metric.value.toLocaleString()}</p>
                <p className="text-sm font-medium text-secondary dark:text-gray-300">{metric.title}</p>
                <p className="text-xs text-tertiary dark:text-muted mt-1">{metric.subtitle}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity Placeholder */}
      <div className="bg-card dark:bg-gray-800 border border-primary dark:border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-primary dark:text-white mb-4">Letzte Aktivitäten</h3>
        <div className="text-center py-8 text-secondary dark:text-muted">
          <BarChart3 size={48} className="mx-auto mb-4 opacity-50" />
          <p>Aktivitäts-Dashboard wird bald verfügbar sein</p>
        </div>
      </div>
    </div>
  );
};

export default DashboardTab;