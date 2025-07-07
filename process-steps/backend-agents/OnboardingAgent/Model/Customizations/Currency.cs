namespace OnboardingAgent.Model.Customizations;

/// <summary>
/// Currency configuration
/// </summary>
public class Currency
    {
        /// <summary>
        /// Currency code (e.g., USD, EUR, GBP)
        /// </summary>
        public string Code { get; set; } = string.Empty;

        /// <summary>
        /// Currency symbol (e.g., $, €, £)
        /// </summary>
        public string Symbol { get; set; } = string.Empty;

        /// <summary>
        /// Currency display name
        /// </summary>
        public string DisplayName { get; set; } = string.Empty;

    /// <summary>
    /// Number of decimal places
    /// </summary>
    public int DecimalPlaces { get; set; } = 2;
} 