using System.Collections.Generic;

namespace OnboardingAgent.Model.Integrations;

/// <summary>
/// Office suite integration configuration
/// </summary>
public class OfficeIntegration
    {
        /// <summary>
        /// Type of office suite (e.g., Microsoft 365, Google Workspace)
        /// </summary>
        public OfficeType OfficeType { get; set; }

        /// <summary>
        /// Tenant or domain identifier
        /// </summary>
        public string? TenantId { get; set; }

        /// <summary>
        /// Whether the office integration is enabled
        /// </summary>
        public bool IsEnabled { get; set; }

    /// <summary>
    /// Specific office applications to integrate
    /// </summary>
    public List<OfficeApplication> EnabledApplications { get; set; } = new();
} 