import React from 'react';

const SilentCallback: React.FC = () => {
  // react-oidc-context handles silent callbacks automatically
  // This component just needs to exist for the redirect URI
  // No additional logic is needed
  
  return (
    <div style={{ display: 'none' }}>
      Silent authentication callback
    </div>
  );
};

export default SilentCallback;
