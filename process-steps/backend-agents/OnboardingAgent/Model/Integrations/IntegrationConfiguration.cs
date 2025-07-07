using System.Collections.Generic;

namespace OnboardingAgent.Model.Integrations;

/// <summary>
/// Integration configuration settings
/// </summary>
public class IntegrationConfiguration
    {
        /// <summary>
        /// ERP system integration settings
        /// </summary>
        public ERPSystemIntegration ERPSystem { get; set; } = new();

        /// <summary>
        /// Office suite integration settings
        /// </summary>
        public OfficeIntegration Office { get; set; } = new();

    /// <summary>
    /// Additional third-party integrations
    /// </summary>
    public List<ThirdPartyIntegration> ThirdPartyIntegrations { get; set; } = new();
} 