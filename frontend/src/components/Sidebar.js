import React from 'react';
import { Link } from 'react-router-dom';

const Sidebar = () => {
  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/news', label: 'News' },
    { path: '/calendar', label: 'Calendar' },
    { path: '/preferences', label: 'Preferences' },
    { path: '/recommendations', label: 'Recommendations' },
    { path: '/saved-videos', label: 'Saved Videos' }
  ];

  return (
    <div className="w-64 bg-white shadow-sm">
      <nav className="mt-5 px-2">
        {navItems.map((item, index) => (
          <Link key={index} to={item.path} className="group flex items-center px-2 py-2 text-base leading-6 font-medium text-gray-900 hover:text-gray-900 hover:bg-gray-100">
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar; 