using XiansAi.Flow.Router.Plugins;
using XiansAi.Messaging;

namespace PowerOfAttorneyAgent.Bots;

public class WitnessHandoffCapabilities
{
    private readonly MessageThread _messageThread;
    
    public WitnessHandoffCapabilities(MessageThread messageThread)
    {
        _messageThread = messageThread;
    }

    [Capability(@"This will hand over the conversation to the Representative Bot which can assist users with 
    representative management tasks such as adding, removing, or listing representatives for the power of attorney. 
    Ask the user if they would like to proceed with the handover to an agent that can assist with this information.")]
    [Parameter("originalUserMessage", "Original user request which caused the handover.")]
    [Returns(@"The name of the bot conversation is handed over to. 
    This agent will now take over the conversation and assist with the user's request.")]
    public string HandoffToRepresentativeBot(string originalUserMessage)
    {
        _messageThread.SendHandoff(typeof(RepresentativeBot), originalUserMessage);
        return typeof(RepresentativeBot).Name;
    }

    [Capability(@"This will hand over the conversation to the Condition Bot which can assist users with 
    condition management tasks such as adding, removing, or listing conditions for the power of attorney. 
    Ask the user if they would like to proceed with the handover to an agent that can assist with this information.")]
    [Parameter("originalUserMessage", "Original user request which caused the handover.")]
    [Returns(@"The name of the bot conversation is handed over to. 
    This agent will now take over the conversation and assist with the user's request.")]
    public string HandoffToConditionBot(string originalUserMessage)
    {
        _messageThread.SendHandoff(typeof(ConditionBot), originalUserMessage);
        return typeof(ConditionBot).Name;
    }
} 