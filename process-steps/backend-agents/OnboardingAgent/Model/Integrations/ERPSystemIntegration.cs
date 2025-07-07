using System.Collections.Generic;

namespace OnboardingAgent.Model.Integrations;

/// <summary>
/// ERP system integration configuration
/// </summary>
public class ERPSystemIntegration
    {
        /// <summary>
        /// Type of ERP system (e.g., SAP, Oracle, Microsoft Dynamics)
        /// </summary>
        public ERPSystemType SystemType { get; set; }

        /// <summary>
        /// ERP system version
        /// </summary>
        public string? Version { get; set; }

        /// <summary>
        /// Integration endpoint or connection string
        /// </summary>
        public string? ConnectionString { get; set; }

        /// <summary>
        /// Whether the ERP integration is enabled
        /// </summary>
        public bool IsEnabled { get; set; }

    /// <summary>
    /// Additional configuration settings
    /// </summary>
    public Dictionary<string, string> ConfigurationSettings { get; set; } = new();
} 