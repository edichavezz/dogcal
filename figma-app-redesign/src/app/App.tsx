import { useState } from 'react';
import { Sidebar } from '@/app/components/Sidebar';
import { HomePage } from '@/app/components/HomePage';
import { CalendarPage } from '@/app/components/CalendarPage';
import { PupsPage } from '@/app/components/PupsPage';

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'calendar' | 'create' | 'approvals' | 'pups'>('home');

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      
      <main className="flex-1 lg:ml-0">
        {activeTab === 'home' && (
          <HomePage onNavigate={(tab) => setActiveTab(tab)} />
        )}
        
        {activeTab === 'calendar' && <CalendarPage />}
        
        {activeTab === 'pups' && <PupsPage />}
        
        {activeTab === 'create' && (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 pb-20 lg:pb-8 pt-20 lg:pt-8">
            <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-200 p-8 sm:p-12 text-center">
              <div className="w-16 sm:w-20 h-16 sm:h-20 bg-gray-100 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl sm:text-4xl">➕</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">Create Hangout</h2>
              <p className="text-sm sm:text-base text-gray-600">This feature is coming soon!</p>
            </div>
          </div>
        )}
        
        {activeTab === 'approvals' && (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 pb-20 lg:pb-8 pt-20 lg:pt-8">
            <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-200 p-8 sm:p-12 text-center">
              <div className="w-16 sm:w-20 h-16 sm:h-20 bg-gray-100 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl sm:text-4xl">✓</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">Review Suggestions</h2>
              <p className="text-sm sm:text-base text-gray-600">This feature is coming soon!</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}