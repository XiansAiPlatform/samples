using System;
using System.Reflection;
using Microsoft.Extensions.Logging;
using Temporalio.Workflows;
using XiansAi.Flow;

[Workflow("Invoice Agent:Invoice Approval Flow")]
public class InvoiceApprovalFlow : FlowBase
{
    [WorkflowRun]
    public Task<string> Run()
    {
      // Use reflection to invoke DataProcessor.ProcessData
      var processorType = Assembly.GetExecutingAssembly().GetType("DataProcessor")
                           ?? Type.GetType("DataProcessor");
      if (processorType != null)
      {
          var processorInstance = Activator.CreateInstance(processorType);
          var processMethod = processorType.GetMethod("ProcessData", BindingFlags.Public | BindingFlags.Instance);
          processMethod?.Invoke(processorInstance, new object[] { "Data from InvoiceApprovalFlow" });
      }

      // TODO: Send the news report to the recipient

      return Task.FromResult("Invoice approved");
    }
}