using System.Collections.Generic;

namespace OnboardingAgent.Model.Customizations;

/// <summary>
/// Enabled module or feature
/// </summary>
public class EnabledModule
    {
        /// <summary>
        /// Module identifier
        /// </summary>
        public string ModuleId { get; set; } = string.Empty;

        /// <summary>
        /// Module display name
        /// </summary>
        public string ModuleName { get; set; } = string.Empty;

        /// <summary>
        /// Whether the module is enabled
        /// </summary>
        public bool IsEnabled { get; set; }

    /// <summary>
    /// Module-specific configuration
    /// </summary>
    public Dictionary<string, object> Configuration { get; set; } = new();
} 