using Repositories;
using XiansAi.Flow;
using System.Text.RegularExpressions;
using System.Linq;
using XiansAi.Flow.Router;
using XiansAi.Logging;
using XiansAi.Messaging;

public class ChatInterceptor : IChatInterceptor
{

    private readonly Logger<ChatInterceptor> _logger = Logger<ChatInterceptor>.For();

    private readonly TermRepository _termRepository = new TermRepository();
    private readonly PersonRepository _personRepository = new PersonRepository();

    public Task<MessageThread> InterceptIncomingMessageAsync(MessageThread messageThread)
    {
        return Task.FromResult(messageThread);
    }

    public Task<string?> InterceptOutgoingMessageAsync(MessageThread messageThread, string? response)
    {
        // Direct fire-and-forget - more efficient for I/O operations
        _ = SendUICommand(messageThread, response);
        return Task.FromResult(response);
    }

    private async Task SendUICommand(MessageThread messageThread, string? response)
    {
        // Extract only the last couple of sentences from the assistant response – these usually
        // contain the actual call-to-action (CTA) directed at the user. This avoids diluting
        // the intent classification with lots of explanatory text that precedes the CTA.
        var messageSnippet = response ?? string.Empty;
        string prompt = @"Analyze the following assistant message and determine if it contains a direct request to the user to enter, set, or change exactly one of these contract properties:
        - Title
        - Effective Date
        - Parties
        - Contract Terms
        - Contract Description

        ONLY consider it a direct request when the message:
        1. Directly asks the user to provide or enter specific information for a property
        2. Gives a clear instruction that expects immediate user input for a property
        3. Asks ""What is..."" or ""Please enter..."" or ""Can you provide..."" for a specific property

        DO NOT consider it a direct request when the message:
        - Asks for confirmation (""Would you like to use..."", ""Is this correct..."", ""Should I..."")
        - Provides suggestions and asks for approval
        - Offers options and asks the user to choose or confirm
        - Contains phrases like ""Would you like"", ""Do you want"", ""Should I"", ""Is this""

        Use semantic understanding to map the message intent to the most appropriate property:
        - Title: Contract names, headings, document titles
        - Effective Date: Start dates, commencement, when agreements begin
        - Parties: People, organizations, signatories, contracting entities
        - Contract Terms: Any contractual provisions, clauses, conditions, legal language, terms and conditions, obligations, rights, restrictions, or regulatory requirements
        - Contract Description: A description of the contract, including the purpose, scope, and key terms.

        Return exactly the property name (one of the above) if and only if there is a direct request for user input. For confirmation requests, suggestions, or any non-direct requests, return null.

        Return exactly the property name (one of the above) if and only if there is a direct request. Otherwise, return null. Do not return any additional text.

        --- Message: " + messageSnippet;

        try
        {
            var propertyName = await SemanticRouterHub.ChatCompletionAsync(prompt);
            _logger.LogInformation($"Property identified: `{propertyName}` for `{messageSnippet}`");

            switch (propertyName)
            {
                case "Effective Date":
                    await messageThread.SendData(
                        new UICommand(
                            "Calendar",
                            new Dictionary<string, object> { { "field", propertyName } }
                            )
                        );
                    break;
                case "Parties":
                    await messageThread.SendData(
                        new UICommand(
                            "ContractParty",
                            new Dictionary<string, object> { { "command", "Add" }, { "Acquaintances", _personRepository.GetAcquaintancesAsync(messageThread.ParticipantId) } }
                            )
                        );
                    break;
                case "Contract Terms":
                    await messageThread.SendData(
                        new UICommand(
                            "ContractTerms",
                            new Dictionary<string, object> { { "terms", _termRepository.GetPotentialTerms() } }
                            )
                        );
                    break;
                case "Contract Description":
                    await messageThread.SendData(
                        new UICommand("ContractDescription", new Dictionary<string, object> {  })
                    );

                    // await messageThread.SendData(
                    //     new UICommand("PieChart", new Dictionary<string, object> {  })
                    // );
                    break;
            }

        }
        catch (Exception ex)
        {
            // Log error - don't let background task crash silently
            Console.WriteLine($"Error in background property analysis: {ex.Message}");
        }
    }
}