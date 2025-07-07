import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiPlus, FiFileText, FiCalendar, FiUser, FiMoreVertical } from 'react-icons/fi';
import { Module, getModuleEntityUrl } from '../modules';

interface Entity {
  id: string;
  title: string;
  status: 'draft' | 'in-progress' | 'completed';
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

interface ModuleDashboardProps {
  module: Module;
  firstStepSlug?: string;
}

// Mock data for demonstration
const mockEntities: Entity[] = [
  {
    id: 'fbbf5126-39c9-466d-862a-5746aefe0160',
    title: 'Johnson Family POA',
    status: 'in-progress',
    createdAt: '2024-01-15',
    updatedAt: '2024-01-16',
    createdBy: 'John Doe'
  },
  {
    id: '2',
    title: 'Smith Estate POA',
    status: 'draft',
    createdAt: '2024-01-10',
    updatedAt: '2024-01-12',
    createdBy: 'Jane Smith'
  },
  {
    id: '3',
    title: 'Williams Healthcare POA',
    status: 'completed',
    createdAt: '2024-01-05',
    updatedAt: '2024-01-08',
    createdBy: 'Mike Williams'
  }
];

const statusColors = {
  'draft': 'bg-gray-100 text-gray-800',
  'in-progress': 'bg-blue-100 text-blue-800',
  'completed': 'bg-green-100 text-green-800'
};

const statusLabels = {
  'draft': 'Draft',
  'in-progress': 'In Progress',
  'completed': 'Completed'
};

const ModuleDashboard: React.FC<ModuleDashboardProps> = ({ module, firstStepSlug = 'scope' }) => {
  const [entities] = useState<Entity[]>(mockEntities);

  const getEntityUrl = (entityId: string) => {
    return getModuleEntityUrl(module.slug, entityId, firstStepSlug);
  };

  return (
    <div className="max-w-screen-2xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">{module.title}</h1>
            <p className="text-lg text-neutral-600 mt-1">{module.description}</p>
          </div>
          <Link
            to={`${module.baseUrl}/new/${firstStepSlug}`}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            <FiPlus className="w-4 h-4" />
            Create New
          </Link>
        </div>
      </div>

      <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-200">
          <h2 className="text-lg font-semibold text-neutral-900">Recent Documents</h2>
        </div>
        
        <div className="divide-y divide-neutral-200">
          {entities.map((entity) => (
            <div key={entity.id} className="px-6 py-4 hover:bg-neutral-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-neutral-100 rounded-lg flex items-center justify-center">
                    <FiFileText className="w-5 h-5 text-neutral-600" />
                  </div>
                  <div>
                    <Link
                      to={getEntityUrl(entity.id)}
                      className="text-lg font-medium text-neutral-900 hover:text-primary transition-colors"
                    >
                      {entity.title}
                    </Link>
                    <div className="flex items-center gap-4 mt-1 text-sm text-neutral-500">
                      <div className="flex items-center gap-1">
                        <FiUser className="w-4 h-4" />
                        {entity.createdBy}
                      </div>
                      <div className="flex items-center gap-1">
                        <FiCalendar className="w-4 h-4" />
                        Updated {new Date(entity.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[entity.status]}`}>
                    {statusLabels[entity.status]}
                  </span>
                  <button className="p-1 text-neutral-400 hover:text-neutral-600 transition-colors">
                    <FiMoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {entities.length === 0 && (
          <div className="px-6 py-12 text-center">
            <FiFileText className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-neutral-900 mb-2">No documents yet</h3>
            <p className="text-neutral-600 mb-4">Get started by creating your first {module.title.toLowerCase()}</p>
            <Link
              to={`${module.baseUrl}/new/${firstStepSlug}`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              <FiPlus className="w-4 h-4" />
              Create New
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModuleDashboard; 