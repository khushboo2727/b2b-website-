// ... existing code ...
import NotificationBell from './NotificationBell';

const Header = () => {
  const { user } = useAuth();
  
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* ... existing code ... */}
          
          <div className="flex items-center gap-4">
            {user?.role === 'seller' && <NotificationBell />}
            {/* ... existing user menu ... */}
          </div>
        </div>
      </div>
    </header>
  );
};