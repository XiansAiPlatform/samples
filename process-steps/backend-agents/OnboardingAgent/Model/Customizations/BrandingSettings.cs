namespace OnboardingAgent.Model.Customizations;

/// <summary>
/// Branding customization settings
/// </summary>
public class BrandingSettings
    {
        /// <summary>
        /// Company logo URL or path
        /// </summary>
        public string? LogoUrl { get; set; }

        /// <summary>
        /// Primary brand color
        /// </summary>
        public string? PrimaryColor { get; set; }

        /// <summary>
        /// Secondary brand color
        /// </summary>
        public string? SecondaryColor { get; set; }

    /// <summary>
    /// Custom CSS styles
    /// </summary>
    public string? CustomCss { get; set; }
} 