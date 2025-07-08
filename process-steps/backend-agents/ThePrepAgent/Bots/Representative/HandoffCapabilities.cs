using XiansAi.Flow.Router.Plugins;
using XiansAi.Messaging;

namespace PowerOfAttorneyAgent.Bots;

public class RepresentativeHandoffCapabilities
{
    private readonly MessageThread _messageThread;
    
    public RepresentativeHandoffCapabilities(MessageThread messageThread)
    {
        _messageThread = messageThread;
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

    [Capability(@"This will hand over the conversation to the Witnesses Bot which can assist users with 
    witness management tasks such as adding, removing, or listing witnesses for the power of attorney. 
    Ask the user if they would like to proceed with the handover to an agent that can assist with this information.")]
    [Parameter("originalUserMessage", "Unmodified original user message which caused the handover.")]
    [Returns(@"The name of the bot conversation is handed over to. 
    This agent will now take over the conversation and assist with the user's request.")]
    public string HandoffToWitnessesBot(string originalUserMessage)
    {
        _messageThread.SendHandoff(typeof(WitnessBot), originalUserMessage);
        return typeof(WitnessBot).Name;
    }
}
