import React from 'react';
import NavBar from '../../components/NavBar';

interface ModuleLayoutProps {
  children: React.ReactNode;
}

const ModuleLayout: React.FC<ModuleLayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-col h-screen">
      {/* Top navigation */}
      <NavBar />
      
      {/* Module content */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
};

export default ModuleLayout; 