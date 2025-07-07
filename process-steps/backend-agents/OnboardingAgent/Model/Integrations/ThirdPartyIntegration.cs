using System.Collections.Generic;

namespace OnboardingAgent.Model.Integrations;

/// <summary>
/// Third-party integration configuration
/// </summary>
public class ThirdPartyIntegration
    {
        /// <summary>
        /// Name of the third-party service
        /// </summary>
        public string ServiceName { get; set; } = string.Empty;

        /// <summary>
        /// Integration type or category
        /// </summary>
        public string IntegrationType { get; set; } = string.Empty;

        /// <summary>
        /// Configuration settings for the integration
        /// </summary>
        public Dictionary<string, string> Settings { get; set; } = new();

    /// <summary>
    /// Whether the integration is enabled
    /// </summary>
    public bool IsEnabled { get; set; }
} 