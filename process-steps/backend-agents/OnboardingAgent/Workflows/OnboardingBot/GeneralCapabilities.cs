using System.Text.Json;
using OnboardingAgent.Commands;
using OnboardingAgent.Model;
using XiansAi.Flow.Router.Plugins;
using XiansAi.Messaging;

public class GeneralCapabilities
{    
    private readonly MessageThread messageThread;
    public GeneralCapabilities(MessageThread messageThread)
    {
        this.messageThread = messageThread;
    }

    [Capability("Get onboarding status")]
    [Returns("Onboarding status")]
    public async Task<CustomerOnboarding> GetOnboardingStatus()
    {
        var customerId = GetCustomerId();
        var onboardingStatus = await new FindOnbordingStatus().Run(customerId);
        return onboardingStatus;
    }

    public Guid GetCustomerId() {
        var data = messageThread.LatestMessage.Data;
        if (data == null) {
            throw new Exception("Message's data is null. Customer id is required");
        }
        var customerId = ((JsonElement)data).GetProperty("customerId").GetString();
        if (customerId == null) {
            throw new Exception("Customer id is null. Customer id is required");
        }
        return Guid.Parse(customerId);
    }

}