using System.Collections.Generic;

namespace OnboardingAgent.Model.Customizations;

/// <summary>
/// Product customization settings
/// </summary>
public class ProductCustomizations
    {
        /// <summary>
        /// List of enabled modules or features
        /// </summary>
        public List<EnabledModule> EnabledModules { get; set; } = new();

        /// <summary>
        /// Primary currency setting
        /// </summary>
        public Currency Currency { get; set; } = new();

        /// <summary>
        /// Primary language setting
        /// </summary>
        public Language Language { get; set; } = new();

        /// <summary>
        /// Custom branding settings
        /// </summary>
        public BrandingSettings? Branding { get; set; }

    /// <summary>
    /// Custom workflow configurations
    /// </summary>
    public List<WorkflowConfiguration> WorkflowConfigurations { get; set; } = new();
} 