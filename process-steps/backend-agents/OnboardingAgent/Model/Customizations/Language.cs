namespace OnboardingAgent.Model.Customizations;

/// <summary>
/// Language configuration
/// </summary>
public class Language
    {
        /// <summary>
        /// Language code (e.g., en-US, es-ES, fr-FR)
        /// </summary>
        public string Code { get; set; } = string.Empty;

        /// <summary>
        /// Language display name
        /// </summary>
        public string DisplayName { get; set; } = string.Empty;

    /// <summary>
    /// Whether this is a right-to-left language
    /// </summary>
    public bool IsRightToLeft { get; set; }
} 