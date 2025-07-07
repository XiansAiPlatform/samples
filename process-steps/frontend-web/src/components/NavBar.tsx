import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiChevronDown, FiUser, FiSettings, FiLogOut, FiDatabase } from 'react-icons/fi';
import Logo from './Logo';
import SettingsModal from './SettingsModal';
import Modal from './Modal';
import EntityExplorer from './EntityExplorer';
import { modules, getModuleDashboardUrl } from '../modules/modules';

const NavBar: React.FC = () => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isEntityDemoOpen, setIsEntityDemoOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSettingsClick = () => {
    setIsSettingsModalOpen(true);
    setIsProfileMenuOpen(false);
  };

  const handleEntityDemoClick = () => {
    setIsEntityDemoOpen(true);
    setIsProfileMenuOpen(false);
  };

  return (
    <header className="h-14 bg-white border-b border-neutral-200 shadow-sm">
      <div className="max-w-screen-2xl mx-auto px-4 h-full">
        <div className="flex items-center justify-between h-full">
          <div className="flex items-center gap-24">
            <Logo className="h-10" />
            <nav className="hidden sm:flex items-center gap-6">
              {modules.map((module) => (
                <Link
                  key={module.id}
                  to={getModuleDashboardUrl(module.slug)}
                  className="text-sm font-medium text-neutral-900 hover:text-primary transition-colors"
                >
                  {module.title}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-4 relative" ref={profileMenuRef}>
              <button
                className="flex items-center gap-2 text-sm font-medium text-neutral-700 hover:text-primary transition-colors"
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              >
                <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center">
                  <FiUser className="w-4 h-4 text-neutral-600" />
                </div>
                <span className="hidden sm:inline">Account</span>
                <FiChevronDown className={`w-4 h-4 transition-transform ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isProfileMenuOpen && (
                <div className="absolute right-4 top-[calc(100%+0.5rem)] w-56 bg-white border border-neutral-200 rounded-lg shadow-lg py-1 z-50">
                  <div className="px-4 py-3 border-b border-neutral-100">
                    <p className="text-sm font-medium text-neutral-900 text-balance">John Doe</p>
                    <p className="text-xs text-neutral-500 font-normal">john.doe@company.com</p>
                  </div>
                  
                  <a
                    href="#"
                    className="flex items-center gap-3 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors font-normal"
                  >
                    <FiUser size={16} />
                    Profile
                  </a>
                  
                  <button
                    onClick={handleSettingsClick}
                    className="flex items-center gap-3 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors font-normal w-full text-left"
                  >
                    <FiSettings size={16} />
                    Settings
                  </button>

                  <button
                    onClick={handleEntityDemoClick}
                    className="flex items-center gap-3 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors font-normal w-full text-left"
                  >
                    <FiDatabase size={16} />
                    Entity Explorer
                  </button>
                  
                  <hr className="my-1 border-neutral-100" />
                  
                  <a
                    href="#"
                    className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors font-normal"
                  >
                    <FiLogOut size={16} />
                    Sign out
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      <SettingsModal 
        isOpen={isSettingsModalOpen} 
        onClose={() => setIsSettingsModalOpen(false)} 
      />

      {/* Entity Demo Modal */}
      <Modal
        isOpen={isEntityDemoOpen}
        onClose={() => setIsEntityDemoOpen(false)}
        title="Entity Management"
        size="full"
      >
        <EntityExplorer />
      </Modal>
    </header>
  );
};

export default NavBar; 